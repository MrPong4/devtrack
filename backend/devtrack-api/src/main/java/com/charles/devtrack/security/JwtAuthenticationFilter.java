
package com.charles.devtrack.security;

import com.charles.devtrack.repository.UserRepository;

import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        final String authorizationHeader =
            request.getHeader("Authorization");

        if (authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {

            filterChain.doFilter(request, response);
            return;
        }

        final String token =
            authorizationHeader.substring(7);

        try {
            String email = jwtService.extractEmail(token);

            if (email != null &&
                    SecurityContextHolder.getContext()
                        .getAuthentication() == null) {

                var user = userRepository.findByEmail(email);

                if (user.isPresent() &&
                        jwtService.isTokenValid(token, email)) {

                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of()
                        );

                    SecurityContext context =
                        SecurityContextHolder.createEmptyContext();

                    context.setAuthentication(authentication);

                    SecurityContextHolder.setContext(context);
                }
            }

        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
