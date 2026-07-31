package br.com.careops.api.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record AnswerSubmissionRequest(
    @NotBlank String registrationId,
    @NotBlank String profileType,
    List<AnswerItem> answers,
    boolean wantsNewsletter
) {
    public record AnswerItem(
        String questionId,
        String value
    ) {}
}
