package com.yeschef.api.config;

import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.security.interfaces.ECPublicKey;
import java.security.interfaces.RSAPublicKey;
import java.util.Collections;

// Runs on every request and validates the Supabase JWT from the Authorization header.
// Supabase uses ES256 or RS256 — we verify against their public JWKS endpoint.
// If valid, sets the Spring Security context so downstream handlers know who the user is.
// If missing or invalid, the request continues unauthenticated (Spring Security rejects protected routes).
@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(SupabaseJwtFilter.class);

    @Value("${supabase.url}")
    private String supabaseUrl;

    // Lazily initialized so the @Value is available when first used
    private JwkProvider jwkProvider;

    private JwkProvider getJwkProvider() throws Exception {
        if (jwkProvider == null) {
            String jwksUrl = supabaseUrl + "/auth/v1/.well-known/jwks.json";
            log.info("Initializing JWKS provider from {}", jwksUrl);
            jwkProvider = new JwkProviderBuilder(URI.create(jwksUrl).toURL()).build();
        }
        return jwkProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("JWT filter: no Bearer token on {} {}", request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            DecodedJWT unverified = JWT.decode(token);
            String keyId = unverified.getKeyId();
            String alg = unverified.getAlgorithm();
            log.debug("JWT filter: token alg={} kid={}", alg, keyId);

            Algorithm algorithm;
            if ("RS256".equals(alg)) {
                Jwk jwk = getJwkProvider().get(keyId);
                algorithm = Algorithm.RSA256((RSAPublicKey) jwk.getPublicKey(), null);
            } else if ("ES256".equals(alg)) {
                Jwk jwk = getJwkProvider().get(keyId);
                algorithm = Algorithm.ECDSA256((ECPublicKey) jwk.getPublicKey(), null);
            } else {
                log.warn("JWT filter: unexpected algorithm {} — rejecting", alg);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            DecodedJWT decoded = JWT.require(algorithm).build().verify(token);
            String supabaseId = decoded.getSubject();
            log.debug("JWT filter: authenticated supabaseId={}", supabaseId);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(supabaseId, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (JWTVerificationException e) {
            log.warn("JWT filter: verification failed on {} {} — {}", request.getMethod(), request.getRequestURI(), e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        } catch (Exception e) {
            log.error("JWT filter: unexpected error on {} {} — {}", request.getMethod(), request.getRequestURI(), e.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
