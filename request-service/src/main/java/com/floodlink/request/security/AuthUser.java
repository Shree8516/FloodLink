// The logged-in user, read from the JWT that auth-realtime-service issued. JwtAuthFilter creates it;
// controllers receive it with @AuthenticationPrincipal. We keep the raw token so we can forward it
// to insights-service and auth-realtime-service, which validate it too.
package com.floodlink.request.security;

public record AuthUser(String id, String name, String email, String role, String token) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
