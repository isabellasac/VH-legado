package br.com.careops.api.campaign.dto;

import java.util.List;

public record ProfileConfigRequest(
    String profileType,
    List<QuestionRequest> questions
) {}
