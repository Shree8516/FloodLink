// Runs once for every HTTP request, before the controllers. If there is a valid "Authorization: Bearer <jwt>"
// header (issued by auth-realtime-service), it tells Spring Security who the user is and their role.
// Registered in SecurityConfig.
package com.floodlink.request.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    // With no token or a bad one we just continue: SecurityConfig decides whether the URL needs login (401).
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            authenticate(header.substring(BEARER_PREFIX.length()));
        }
        chain.doFilter(request, response);
    }

    // "ROLE_" prefix is how Spring Security expects roles, so hasRole('ADMIN') matches "ROLE_ADMIN"
    private void authenticate(String token) {
        try {
            AuthUser user = jwtService.parseToken(token);
            var authority = new SimpleGrantedAuthority("ROLE_" + user.role());
            var authentication = new UsernamePasswordAuthenticationToken(user, null, List.of(authority));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception e) {
            log.debug("Ignoring invalid JWT: {}", e.getMessage());
        }
    }
}
