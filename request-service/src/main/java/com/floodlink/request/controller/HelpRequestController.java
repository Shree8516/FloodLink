// HTTP endpoints for help requests under /api/v1/requests (CRUD + claim + resolve + merge). Called by the React app.
// Role rules are declared right on each method with @PreAuthorize so they're easy to read and present.
package com.floodlink.request.controller;

import com.floodlink.request.dto.CreateHelpRequest;
import com.floodlink.request.dto.HelpRequestDto;
import com.floodlink.request.dto.MergeHelpRequest;
import com.floodlink.request.dto.MergeResult;
import com.floodlink.request.dto.UpdateHelpRequest;
import com.floodlink.request.model.RequestStatus;
import com.floodlink.request.security.AuthUser;
import com.floodlink.request.service.HelpRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests")
public class HelpRequestController {

    private final HelpRequestService helpRequestService;

    public HelpRequestController(HelpRequestService helpRequestService) {
        this.helpRequestService = helpRequestService;
    }

    // Any logged-in user can see the map. ?status=OPEN filters the list.
    @GetMapping
    public List<HelpRequestDto> listRequests(@RequestParam(required = false) RequestStatus status) {
        return helpRequestService.listRequests(status);
    }

    @GetMapping("/{id}")
    public HelpRequestDto getRequest(@PathVariable Long id) {
        return helpRequestService.getRequest(id);
    }

    // @AuthenticationPrincipal gives us the AuthUser that JwtAuthFilter built from the token
    @GetMapping("/claimed/me")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public List<HelpRequestDto> listMyClaimedRequests(@AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.listClaimedBy(currentUser.id());
    }

    // Anyone logged in may ask for help (volunteers sometimes post on behalf of others)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HelpRequestDto createRequest(@Valid @RequestBody CreateHelpRequest input,
                                        @AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.createRequest(input, currentUser);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public HelpRequestDto updateRequest(@PathVariable Long id, @Valid @RequestBody UpdateHelpRequest input,
                                        @AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.updateRequest(id, input, currentUser);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRequest(@PathVariable Long id, @AuthenticationPrincipal AuthUser currentUser) {
        helpRequestService.deleteRequest(id, currentUser);
    }

    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public HelpRequestDto claimRequest(@PathVariable Long id, @AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.claimRequest(id, currentUser);
    }

    // The role check here is coarse; the service also checks that it's the *same* volunteer who claimed it
    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
    public HelpRequestDto resolveRequest(@PathVariable Long id, @AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.resolveRequest(id, currentUser);
    }

    // Folds duplicate #id into its original. The body is optional: { "targetId": 16 } picks another original.
    @PostMapping("/{id}/merge")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'ADMIN')")
    public MergeResult mergeRequest(@PathVariable Long id, @RequestBody(required = false) MergeHelpRequest input,
                                    @AuthenticationPrincipal AuthUser currentUser) {
        return helpRequestService.mergeRequest(id, input == null ? null : input.targetId(), currentUser);
    }
}
