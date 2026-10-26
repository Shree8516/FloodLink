// Who claimed a help request: the volunteer's id and name, copied from their JWT at claim time.
// Users live in auth-realtime-service (MongoDB), so instead of a database relation we store these two values.
// @Embeddable means they become two extra columns (claimed_by_id, claimed_by_name) in the help_requests table.
package com.floodlink.request.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public record ClaimedBy(
        @Column(name = "claimed_by_id") String userId,
        @Column(name = "claimed_by_name") String name
) {
}
