// Unit tests for HelpRequestService: the claim, resolve, create and merge rules. Run with `mvn test`.
// The repository and the two HTTP clients are replaced by Mockito mocks, so no database or other service is needed.
package com.floodlink.request.service;

import com.floodlink.request.client.InsightsClient;
import com.floodlink.request.client.RealtimeClient;
import com.floodlink.request.dto.AnalyzeResult;
import com.floodlink.request.dto.CreateHelpRequest;
import com.floodlink.request.dto.HelpRequestDto;
import com.floodlink.request.dto.MergeResult;
import com.floodlink.request.exception.ApiException;
import com.floodlink.request.model.ClaimedBy;
import com.floodlink.request.model.HelpRequest;
import com.floodlink.request.model.RequestStatus;
import com.floodlink.request.model.RequestType;
import com.floodlink.request.repository.HelpRequestRepository;
import com.floodlink.request.security.AuthUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HelpRequestServiceTest {

    // Users as they would come out of JWTs issued by auth-realtime-service
    private static final AuthUser PRIYA = new AuthUser("u-priya", "Priya", "priya@floodlink.in", "VOLUNTEER", "jwt-priya");
    private static final AuthUser BALA = new AuthUser("u-bala", "Bala", "bala@floodlink.in", "VOLUNTEER", "jwt-bala");
    private static final AuthUser ADMIN = new AuthUser("u-admin", "Admin", "admin@floodlink.in", "ADMIN", "jwt-admin");

    @Mock
    private HelpRequestRepository requestRepository;
    @Mock
    private InsightsClient insightsClient;
    @Mock
    private RealtimeClient realtimeClient;

    @InjectMocks
    private HelpRequestService service;

    @Test
    void claimRequest_openRequest_becomesClaimedByVolunteerAndIsBroadcast() {
        HelpRequest request = buildRequest(RequestStatus.OPEN, null);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(requestRepository.save(request)).thenReturn(request);

        HelpRequestDto result = service.claimRequest(10L, PRIYA);

        assertEquals(RequestStatus.CLAIMED, result.status());
        assertEquals("u-priya", result.claimedBy().id());
        assertEquals("Priya", result.claimedBy().name());
        assertNotNull(result.claimedAt(), "the timeline records when it was claimed");
        verify(realtimeClient).publish(eq("request:claimed"), any(), eq("jwt-priya"));
    }

    @Test
    void claimRequest_alreadyClaimed_isRejectedWithConflict() {
        HelpRequest request = buildRequest(RequestStatus.CLAIMED, BALA);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));

        ApiException error = assertThrows(ApiException.class, () -> service.claimRequest(10L, PRIYA));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(requestRepository, never()).save(any());
    }

    @Test
    void claimRequest_unknownId_isRejectedWithNotFound() {
        when(requestRepository.findById(99L)).thenReturn(Optional.empty());

        ApiException error = assertThrows(ApiException.class, () -> service.claimRequest(99L, PRIYA));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
    }

    @Test
    void resolveRequest_byClaimingVolunteer_becomesResolved() {
        HelpRequest request = buildRequest(RequestStatus.CLAIMED, PRIYA);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(requestRepository.save(request)).thenReturn(request);

        HelpRequestDto result = service.resolveRequest(10L, PRIYA);

        assertEquals(RequestStatus.RESOLVED, result.status());
        assertNotNull(result.resolvedAt(), "the timeline records when it was resolved");
        verify(realtimeClient).publish(eq("request:resolved"), any(), eq("jwt-priya"));
    }

    @Test
    void resolveRequest_byDifferentVolunteer_isForbidden() {
        HelpRequest request = buildRequest(RequestStatus.CLAIMED, BALA);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));

        ApiException error = assertThrows(ApiException.class, () -> service.resolveRequest(10L, PRIYA));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatus());
    }

    @Test
    void resolveRequest_byAdmin_isAllowedEvenIfSomeoneElseClaimed() {
        HelpRequest request = buildRequest(RequestStatus.CLAIMED, BALA);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));
        when(requestRepository.save(request)).thenReturn(request);

        HelpRequestDto result = service.resolveRequest(10L, ADMIN);

        assertEquals(RequestStatus.RESOLVED, result.status());
    }

    @Test
    void resolveRequest_stillOpen_isRejectedWithConflict() {
        HelpRequest request = buildRequest(RequestStatus.OPEN, null);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(request));

        ApiException error = assertThrows(ApiException.class, () -> service.resolveRequest(10L, PRIYA));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
    }

    @Test
    void createRequest_usesInsightsResultForPriorityReasonsAndDuplicateFlag() {
        when(requestRepository.findByStatusInAndCreatedAtAfter(anyCollection(), any())).thenReturn(List.of());
        when(insightsClient.analyze(any(), anyList(), eq("jwt-priya")))
                .thenReturn(new AnalyzeResult(true, 7L, 82, List.of("RESCUE request: +40", "Urgent words: +10")));
        when(requestRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        HelpRequestDto result = service.createRequest(buildCreateInput(), PRIYA);

        assertEquals(82, result.priorityScore());
        assertEquals(7L, result.duplicateOfId());
        assertEquals(List.of("RESCUE request: +40", "Urgent words: +10"), result.priorityReasons());
        assertEquals(RequestStatus.OPEN, result.status());
        verify(realtimeClient).publish(eq("request:created"), any(), eq("jwt-priya"));
    }

    @Test
    void createRequest_whenInsightsIsDown_usesFallback() {
        when(requestRepository.findByStatusInAndCreatedAtAfter(anyCollection(), any())).thenReturn(List.of());
        when(insightsClient.analyze(any(), anyList(), any())).thenReturn(AnalyzeResult.fallback());
        when(requestRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        HelpRequestDto result = service.createRequest(buildCreateInput(), PRIYA);

        assertNull(result.duplicateOfId());
        assertEquals(50, result.priorityScore());
        assertEquals(1, result.reportCount());
    }

    @Test
    void mergeRequest_flaggedDuplicate_isFoldedIntoOriginalAndRaisesReportCount() {
        HelpRequest original = buildRequest(7L, RequestStatus.OPEN, null);
        HelpRequest duplicate = buildRequest(10L, RequestStatus.OPEN, null);
        duplicate.setDuplicateOfId(7L);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(duplicate));
        when(requestRepository.findById(7L)).thenReturn(Optional.of(original));
        when(requestRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        MergeResult result = service.mergeRequest(10L, null, PRIYA);

        assertEquals(RequestStatus.MERGED, result.merged().status());
        assertEquals(7L, result.merged().mergedIntoId());
        assertEquals(2, result.original().reportCount());
        assertEquals(7L, result.id());
        verify(realtimeClient).publish(eq("request:merged"), any(), eq("jwt-priya"));
    }

    @Test
    void mergeRequest_claimedDuplicate_isRejectedWithConflict() {
        HelpRequest duplicate = buildRequest(10L, RequestStatus.CLAIMED, BALA);
        duplicate.setDuplicateOfId(7L);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(duplicate));

        ApiException error = assertThrows(ApiException.class, () -> service.mergeRequest(10L, null, PRIYA));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(requestRepository, never()).save(any());
    }

    @Test
    void mergeRequest_withoutDuplicateLinkOrTarget_isBadRequest() {
        when(requestRepository.findById(10L)).thenReturn(Optional.of(buildRequest(RequestStatus.OPEN, null)));

        ApiException error = assertThrows(ApiException.class, () -> service.mergeRequest(10L, null, PRIYA));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void mergeRequest_intoAlreadyMergedRequest_isRejectedWithConflict() {
        HelpRequest original = buildRequest(7L, RequestStatus.MERGED, null);
        original.setMergedIntoId(3L);
        when(requestRepository.findById(10L)).thenReturn(Optional.of(buildRequest(RequestStatus.OPEN, null)));
        when(requestRepository.findById(7L)).thenReturn(Optional.of(original));

        ApiException error = assertThrows(ApiException.class, () -> service.mergeRequest(10L, 7L, PRIYA));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        verify(requestRepository, never()).save(any());
    }

    private HelpRequest buildRequest(RequestStatus status, AuthUser claimer) {
        return buildRequest(10L, status, claimer);
    }

    private HelpRequest buildRequest(Long id, RequestStatus status, AuthUser claimer) {
        HelpRequest request = new HelpRequest();
        request.setId(id);
        request.setType(RequestType.RESCUE);
        request.setDescription("Family trapped on terrace");
        request.setAddress("4th Main Road, Velachery");
        request.setStatus(status);
        if (claimer != null) {
            request.setClaimedBy(new ClaimedBy(claimer.id(), claimer.name()));
        }
        return request;
    }

    private CreateHelpRequest buildCreateInput() {
        return new CreateHelpRequest(RequestType.RESCUE, "Elderly couple trapped", 12.98, 80.21,
                "Gandhi Road, Velachery", 2, "Lakshmi", "9876543210");
    }
}
