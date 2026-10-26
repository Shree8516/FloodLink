// VALIDATES JWTs (it never creates them: only auth-realtime-service issues tokens).
// Checks the HS256 signature with the shared JWT_SECRET and the expiry time. Used by JwtAuthFilter.
package com.floodlink.request.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {

    private final SecretKey verificationKey;

    public JwtService(@Value("${app.jwt.secret}") String secret) {
        // Same secret as the issuer; HS256 needs at least 32 bytes
        this.verificationKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // Throws if the signature is wrong (token forged or different secret) or the token has expired.
    // Payload (see CONTRACT.md): { userId, name, email, role }
    public AuthUser parseToken(String token) {
        Claims claims = Jwts.parser().verifyWith(verificationKey).build().parseSignedClaims(token).getPayload();
        return new AuthUser(
                claims.get("userId", String.class),
                claims.get("name", String.class),
                claims.get("email", String.class),
                claims.get("role", String.class),
                token);
    }
}
