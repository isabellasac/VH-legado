package br.com.careops.api.campaign.dto;

import java.util.List;

public record QuestionResponse(
    String id,
    String text,
    String type,
    List<String> options,
    boolean required,
    int order,
    String conditionalOnQuestionId,
    String conditionalOnAnswer
) {}
