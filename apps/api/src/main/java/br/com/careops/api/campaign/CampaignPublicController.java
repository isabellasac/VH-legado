package br.com.careops.api.campaign;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.careops.api.auth.dto.ActionResponse;
import br.com.careops.api.campaign.dto.AnswerSubmissionRequest;
import br.com.careops.api.campaign.dto.CampaignPublicResponse;
import br.com.careops.api.campaign.dto.CheckUserRequest;
import br.com.careops.api.campaign.dto.CheckUserResponse;
import br.com.careops.api.campaign.dto.QuestionResponse;
import br.com.careops.api.campaign.dto.RegistrationRequest;
import br.com.careops.api.campaign.dto.RegistrationResponse;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/public/campaigns")
public class CampaignPublicController {

    private final CampaignService campaignService;

    public CampaignPublicController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping("/{slug}")
    public CampaignPublicResponse getPublicCampaign(@PathVariable String slug) {
        return campaignService.getPublicCampaign(slug);
    }

    @GetMapping("/{slug}/questions/{profileType}")
    public List<QuestionResponse> getQuestionsForProfile(
            @PathVariable String slug,
            @PathVariable String profileType) {
        return campaignService.getQuestionsForProfile(slug, profileType);
    }

    @PostMapping("/{slug}/check-user")
    public CheckUserResponse checkUser(
            @PathVariable String slug,
            @Valid @RequestBody CheckUserRequest request) {
        return campaignService.checkUser(slug, request);
    }

    @PostMapping("/{slug}/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegistrationResponse register(
            @PathVariable String slug,
            @Valid @RequestBody RegistrationRequest request) {
        return campaignService.register(slug, request);
    }

    @PostMapping("/{slug}/responses")
    public ActionResponse submitAnswers(
            @PathVariable String slug,
            @Valid @RequestBody AnswerSubmissionRequest request) {
        return campaignService.submitAnswers(slug, request);
    }
}
