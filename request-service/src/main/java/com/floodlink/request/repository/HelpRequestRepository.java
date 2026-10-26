// Database access for help requests. Spring Data JPA writes the SQL from the method names.
// Used by HelpRequestService.
package com.floodlink.request.repository;

import com.floodlink.request.model.HelpRequest;
import com.floodlink.request.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface HelpRequestRepository extends JpaRepository<HelpRequest, Long> {

    // Main list: most urgent first, newest first when the score is equal
    List<HelpRequest> findAllByOrderByPriorityScoreDescCreatedAtDesc();

    // List filtered by status (e.g. only OPEN)
    List<HelpRequest> findByStatusOrderByPriorityScoreDescCreatedAtDesc(RequestStatus status);

    // Volunteer dashboard: "what have I claimed?" (claimedBy.userId inside the embedded ClaimedBy)
    List<HelpRequest> findByClaimedByUserIdOrderByUpdatedAtDesc(String volunteerId);

    // Candidates for duplicate detection: still-active (OPEN or CLAIMED) requests from the last few hours.
    // Resolved and merged requests are left out, so a new report is never linked to one of those.
    List<HelpRequest> findByStatusInAndCreatedAtAfter(Collection<RequestStatus> statuses, LocalDateTime after);
}
