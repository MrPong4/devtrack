package com.charles.devtrack.service;

import com.charles.devtrack.dto.AuthResponse;
import com.charles.devtrack.dto.LoginRequest;
import com.charles.devtrack.dto.RegisterRequest;
import com.charles.devtrack.entity.User;
import com.charles.devtrack.repository.UserRepository;
import com.charles.devtrack.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException(
                "An account with this email already exists"
            );
        }

        User user = new User(
            request.getName(),
            request.getEmail(),
            passwordEncoder.encode(request.getPassword())
        );

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser.getEmail());

        return new AuthResponse(
            token,
            savedUser.getName(),
            savedUser.getEmail()
        );
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException(
                "Invalid email or password"
            ));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new IllegalArgumentException(
                "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
            token,
            user.getName(),
            user.getEmail()
        );
    }
}