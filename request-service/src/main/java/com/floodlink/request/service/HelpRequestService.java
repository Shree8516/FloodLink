// The heart of FloodLink: creating, listing, editing, claiming, resolving and merging help requests.
// Called by HelpRequestController. Talks to insights-service (analysis) and auth-realtime-service (live updates).
package com.floodlink.request.service;

import com.floodlink.request.client.InsightsClient;
import com.floodlink.request.client.RealtimeClient;
import com.floodlink.request.dto.AnalyzeResult;
import com.floodlink.request.dto.CreateHelpRequest;
import com.floodlink.request.dto.HelpRequestDto;
import com.floodlink.request.dto.MergeResult;
import com.floodlink.request.dto.UpdateHelpRequest;
import com.floodlink.request.exception.ApiException;
import com.floodlink.request.model.ClaimedBy;
import com.floodlink.request.model.HelpRequest;
import com.floodlink.request.model.RequestStatus;
import com.floodlink.request.repository.HelpRequestRepository;
import com.floodlink.request.security.AuthUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
public class HelpRequestService {

    // Only requests from this window are compared for duplicates (insights-service applies the same 2-hour rule)
    private static final int DUPLICATE_WINDOW_HOURS = 2;
    // Requests that still need (or are getting) help; only these can be the "original" of a new duplicate
    private static final List<RequestStatus> ACTIVE_STATUSES = List.of(RequestStatus.OPEN, RequestStatus.CLAIMED);

    private final HelpRequestRepository requestRepository;
    private final InsightsClient insightsClient;
    private final RealtimeClient realtimeClient;

    public HelpRequestService(HelpRequestRepository requestRepository, InsightsClient insightsClient,
                              RealtimeClient realtimeClient) {
        this.requestRepository = requestRepository;
        this.insightsClient = insightsClient;
        this.realtimeClient = realtimeClient;
    }

    // Lists requests for the map and list, optionally only one status, most urgent first
    public List<HelpRequestDto> listRequests(RequestStatus status) {
        List<HelpRequest> requests = status == null
                ? requestRepository.findAllByOrderByPriorityScoreDescCreatedAtDesc()
                : requestRepository.findByStatusOrderByPriorityScoreDescCreatedAtDesc(status);
        return requests.stream().map(HelpRequestDto::from).toList();
    }

    public HelpRequestDto getRequest(Long id) {
        return HelpRequestDto.from(findRequestOrThrow(id));
    }

    // Everything a volunteer has claimed (active and finished), for their dashboard
    public List<HelpRequestDto> listClaimedBy(String volunteerId) {
        return requestRepository.findByClaimedByUserIdOrderByUpdatedAtDesc(volunteerId).stream()
                .map(HelpRequestDto::from).toList();
    }

    // Steps 2-5 of the data flow: build -> analyze (Flask) -> save (PostgreSQL) -> broadcast (Node).
    // Not @Transactional on purpose: there is a single save, and we don't want to hold a DB connection
    // open while waiting for insights-service.
    public HelpRequestDto createRequest(CreateHelpRequest input, AuthUser currentUser) {
        HelpRequest request = buildNewRequest(input);
        AnalyzeResult analysis = insightsClient.analyze(request, findRecentUnresolvedRequests(), currentUser.token());
        request.setPriorityScore(analysis.priorityScore());
        request.setPriorityReasons(String.join("\n", analysis.reasons() == null ? List.of() : analysis.reasons()));
        request.setDuplicateOfId(analysis.isDuplicate() ? analysis.duplicateOfId() : null);

        HelpRequestDto saved = HelpRequestDto.from(requestRepository.save(request));
        realtimeClient.publish("request:created", saved, currentUser.token());
        return saved;
    }

    // Admin correction of text fields (e.g. a typo in the address)
    @Transactional
    public HelpRequestDto updateRequest(Long id, UpdateHelpRequest input, AuthUser currentUser) {
        HelpRequest request = findRequestOrThrow(id);
        request.setDescription(input.description().trim());
        request.setAddress(input.address().trim());
        request.setPeopleCount(input.peopleCount());
        request.setContactName(input.contactName().trim());
        request.setContactPhone(input.contactPhone());

        HelpRequestDto saved = HelpRequestDto.from(requestRepository.save(request));
        realtimeClient.publish("request:updated", saved, currentUser.token());
        return saved;
    }

    // Admin removal of spam or test requests
    @Transactional
    public void deleteRequest(Long id, AuthUser currentUser) {
        HelpRequest request = findRequestOrThrow(id);
        requestRepository.delete(request);
        realtimeClient.publish("request:deleted", Map.of("id", id), currentUser.token());
    }

    // A volunteer says "I'm going". Only OPEN requests can be claimed, so two volunteers never go to the same place.
    @Transactional
    public HelpRequestDto claimRequest(Long id, AuthUser volunteer) {
        HelpRequest request = findRequestOrThrow(id);
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.CONFLICT, "Request #" + id + " is already " + request.getStatus());
        }
        request.setStatus(RequestStatus.CLAIMED);
        request.setClaimedBy(new ClaimedBy(volunteer.id(), volunteer.name()));
        request.setClaimedAt(now());

        HelpRequestDto saved = HelpRequestDto.from(requestRepository.save(request));
        realtimeClient.publish("request:claimed", saved, volunteer.token());
        return saved;
    }

    // Marks help as delivered. Only the volunteer who claimed it (or an admin) may do this.
    @Transactional
    public HelpRequestDto resolveRequest(Long id, AuthUser currentUser) {
        HelpRequest request = findRequestOrThrow(id);
        if (request.getStatus() != RequestStatus.CLAIMED) {
            throw new ApiException(HttpStatus.CONFLICT, "Only CLAIMED requests can be resolved (this one is "
                    + request.getStatus() + ")");
        }
        boolean isClaimer = request.getClaimedBy() != null && request.getClaimedBy().userId().equals(currentUser.id());
        if (!isClaimer && !currentUser.isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the volunteer who claimed this request can resolve it");
        }
        request.setStatus(RequestStatus.RESOLVED);
        request.setResolvedAt(now());

        HelpRequestDto saved = HelpRequestDto.from(requestRepository.save(request));
        realtimeClient.publish("request:resolved", saved, currentUser.token());
        return saved;
    }

    // Folds a duplicate report into the original: the duplicate becomes MERGED (and leaves the map), and the
    // original's reportCount grows, so volunteers see "reported 3 times" on ONE request instead of three.
    // targetId is optional; by default we use the duplicate link insights-service found.
    @Transactional
    public MergeResult mergeRequest(Long id, Long targetId, AuthUser currentUser) {
        HelpRequest duplicate = findRequestOrThrow(id);
        Long originalId = targetId != null ? targetId : duplicate.getDuplicateOfId();
        if (originalId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Request #" + id + " is not flagged as a duplicate; send a targetId to merge it");
        }
        if (originalId.equals(id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A request cannot be merged into itself");
        }
        // A claimed duplicate means a volunteer is already on the way, so we leave it alone
        if (duplicate.getStatus() != RequestStatus.OPEN) {
            throw new ApiException(HttpStatus.CONFLICT, "Only OPEN requests can be merged (#" + id + " is "
                    + duplicate.getStatus() + ")");
        }
        HelpRequest original = findRequestOrThrow(originalId);
        if (original.getStatus() == RequestStatus.MERGED) {
            throw new ApiException(HttpStatus.CONFLICT, "Request #" + originalId + " was itself merged into #"
                    + original.getMergedIntoId());
        }

        duplicate.setStatus(RequestStatus.MERGED);
        duplicate.setMergedIntoId(originalId);
        original.setReportCount(original.getReportCount() + duplicate.getReportCount());

        MergeResult result = MergeResult.of(
                HelpRequestDto.from(requestRepository.save(original)),
                HelpRequestDto.from(requestRepository.save(duplicate)));
        realtimeClient.publish("request:merged", result, currentUser.token());
        return result;
    }

    // createdAt is set now (not at save time) so insights-service sees the real time when scoring
    private HelpRequest buildNewRequest(CreateHelpRequest input) {
        HelpRequest request = new HelpRequest();
        request.setType(input.type());
        request.setDescription(input.description().trim());
        request.setLatitude(input.latitude());
        request.setLongitude(input.longitude());
        request.setAddress(input.address().trim());
        request.setPeopleCount(input.peopleCount());
        request.setContactName(input.contactName().trim());
        request.setContactPhone(input.contactPhone());
        request.setStatus(RequestStatus.OPEN);
        request.setCreatedAt(now());
        return request;
    }

    private List<HelpRequest> findRecentUnresolvedRequests() {
        LocalDateTime windowStart = LocalDateTime.now().minusHours(DUPLICATE_WINDOW_HOURS);
        return requestRepository.findByStatusInAndCreatedAtAfter(ACTIVE_STATUSES, windowStart);
    }

    // Whole seconds are enough for a timeline and keep the JSON short ("2025-12-02T10:15:00")
    private static LocalDateTime now() {
        return LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }

    private HelpRequest findRequestOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Help request #" + id + " not found"));
    }
}
