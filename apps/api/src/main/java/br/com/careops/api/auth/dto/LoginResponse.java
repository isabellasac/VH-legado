package br.com.careops.api.auth.dto;

import java.util.List;

public record LoginResponse(
    String token,
    String role,
    String name,
    String destination,
    String institutionId,
    String subjectId,
    String expiresAt,
    List<String> permissions,
    boolean demoMode
) {
}
