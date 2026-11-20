
package com.charles.devtrack.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;

    private static final long JWT_EXPIRATION =
            24 * 60 * 60 * 1000;

    public JwtService() {
        String secret = System.getenv("JWT_SECRET");

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "JWT_SECRET environment variable is not configured"
            );
        }

        try {
            byte[] keyBytes = Decoders.BASE64.decode(secret);
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception exception) {
            throw new IllegalStateException(
                "JWT_SECRET must be a valid Base64-encoded key of at least 32 bytes.",
                exception
            );
        }
    }

    public String generateToken(String email) {
        Date now = new Date();
        Date expiration = new Date(
            now.getTime() + JWT_EXPIRATION
        );

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String email) {
        try {
            Claims claims = extractAllClaims(token);

            String tokenEmail = claims.getSubject();

            return tokenEmail != null
                    && tokenEmail.equals(email)
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date());

        } catch (Exception exception) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
