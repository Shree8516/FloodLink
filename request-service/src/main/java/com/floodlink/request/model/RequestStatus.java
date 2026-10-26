// Life cycle of a help request: OPEN -> CLAIMED (a volunteer is on the way) -> RESOLVED.
// MERGED is a side exit: a duplicate report that was folded into its original request (see mergedIntoId).
// HelpRequestService enforces that requests only move forward through these steps.
package com.floodlink.request.model;

public enum RequestStatus {
    OPEN,
    CLAIMED,
    RESOLVED,
    MERGED
}
