package br.com.careops.api.campaign.dto;

import java.util.List;

public record QuestionRequest(
    String text,
    String type,
    List<String> options,
    boolean required,
    int order,
    String conditionalOnQuestionId,
    String conditionalOnAnswer
) {}
