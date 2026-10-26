// Spring Security setup: every /api/v1 call needs a valid JWT, sessions are off (stateless), CORS for React.
// This service only VALIDATES tokens; logging in happens in auth-realtime-service.
// Role rules live on the controller methods as @PreAuthorize (enabled here by @EnableMethodSecurity).
package com.floodlink.request.config;

import com.floodlink.request.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    // The main security rules for every HTTP request
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        http
                // CSRF protects cookie-based sessions; we use JWT headers instead, so it's not needed
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                // No server-side sessions: every request carries its own JWT
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors.authenticationEntryPoint(jsonUnauthorizedResponse()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // The React app runs on a different port (5173), so the browser needs explicit permission to call us
    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origin}") String allowedOrigin) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // Returns the same JSON error shape as GlobalExceptionHandler when no valid token is sent
    private AuthenticationEntryPoint jsonUnauthorizedResponse() {
        return (request, response, exception) -> {
            response.setStatus(401);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Please log in (missing or invalid token)\"}");
        };
    }
}
