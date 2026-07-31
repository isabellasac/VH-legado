package br.com.careops.api.campaign;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.careops.api.auth.dto.ActionResponse;
import br.com.careops.api.campaign.dto.AnswerSubmissionRequest;
import br.com.careops.api.campaign.dto.CampaignListItemResponse;
import br.com.careops.api.campaign.dto.CampaignPublicResponse;
import br.com.careops.api.campaign.dto.CampaignRequest;
import br.com.careops.api.campaign.dto.CampaignResponse;
import br.com.careops.api.campaign.dto.CheckUserRequest;
import br.com.careops.api.campaign.dto.CheckUserResponse;
import br.com.careops.api.campaign.dto.ProfileConfigRequest;
import br.com.careops.api.campaign.dto.ProfileConfigResponse;
import br.com.careops.api.campaign.dto.QuestionRequest;
import br.com.careops.api.campaign.dto.QuestionResponse;
import br.com.careops.api.campaign.dto.RegistrationRequest;
import br.com.careops.api.campaign.dto.RegistrationResponse;
import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.core.CareopsDataStore.AnswerEntryRecord;
import br.com.careops.api.core.CareopsDataStore.CampaignProfileRecord;
import br.com.careops.api.core.CareopsDataStore.CampaignQuestionRecord;
import br.com.careops.api.core.CareopsDataStore.CampaignRecord;
import br.com.careops.api.core.CareopsDataStore.RegistrationRecord;

@Service
public class CampaignService {

    private final CareopsDataStore store;

    public CampaignService(CareopsDataStore store) {
        this.store = store;
    }

    public List<CampaignListItemResponse> listCampaigns() {
        return store.listCampaigns().stream()
            .map(campaign -> new CampaignListItemResponse(
                campaign.id,
                campaign.name,
                campaign.slug,
                campaign.active,
                store.listRegistrations(campaign.id).size(),
                parseDate(campaign.createdAt)
            ))
            .toList();
    }

    public CampaignResponse getCampaign(String id) {
        CampaignRecord campaign = store.findCampaignById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campanha nao encontrada"));
        return toResponse(campaign);
    }

    public CampaignResponse createCampaign(CampaignRequest request) {
        CampaignRecord campaign = fromRequest(null, request);
        return toResponse(store.upsertCampaign(campaign));
    }

    public CampaignResponse updateCampaign(String id, CampaignRequest request) {
        if (store.findCampaignById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campanha nao encontrada");
        }
        CampaignRecord campaign = fromRequest(id, request);
        return toResponse(store.upsertCampaign(campaign));
    }

    public void deleteCampaign(String id) {
        try {
            store.deleteCampaign(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Campanha nao encontrada");
        }
    }

    public CampaignPublicResponse getPublicCampaign(String slug) {
        CampaignRecord campaign = findBySlug(slug);
        return new CampaignPublicResponse(
            campaign.name,
            campaign.description,
            campaign.profiles.stream().map(profile -> profile.profileType).toList()
        );
    }

    public List<QuestionResponse> getQuestionsForProfile(String slug, String profileType) {
        CampaignRecord campaign = findBySlug(slug);
        return campaign.profiles.stream()
            .filter(profile -> profile.profileType.equalsIgnoreCase(profileType))
            .findFirst()
            .map(profile -> profile.questions.stream().map(this::toQuestionResponse).toList())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil nao encontrado nesta campanha"));
    }

    public CheckUserResponse checkUser(String slug, CheckUserRequest request) {
        CampaignRecord campaign = findBySlug(slug);
        return store.findRegistrationByEmail(campaign.id, request.email())
            .map(registration -> new CheckUserResponse(true, registration.name, registration.id))
            .orElse(new CheckUserResponse(false, null, null));
    }

    public RegistrationResponse register(String slug, RegistrationRequest request) {
        CampaignRecord campaign = findBySlug(slug);
        return store.findRegistrationByEmail(campaign.id, request.email())
            .map(existing -> new RegistrationResponse(existing.id, "Voce ja esta cadastrado nesta campanha.", true))
            .orElseGet(() -> {
                RegistrationRecord registration = new RegistrationRecord();
                registration.campaignId = campaign.id;
                registration.profileType = request.profileType();
                registration.name = request.name();
                registration.email = request.email();
                registration.phone = request.phone();
                registration.profileFields = request.profileFields() == null ? Map.of() : request.profileFields();
                RegistrationRecord created = store.addRegistration(registration);
                String message = campaign.confirmationMessage == null || campaign.confirmationMessage.isBlank()
                    ? "Cadastro realizado com sucesso!"
                    : campaign.confirmationMessage;
                return new RegistrationResponse(created.id, message, false);
            });
    }

    public ActionResponse submitAnswers(String slug, AnswerSubmissionRequest request) {
        findBySlug(slug);
        List<AnswerEntryRecord> answers = request.answers() == null
            ? List.of()
            : request.answers().stream().map(answer -> {
                AnswerEntryRecord entry = new AnswerEntryRecord();
                entry.questionId = answer.questionId();
                entry.value = answer.value();
                return entry;
            }).toList();
        store.submitRegistrationAnswers(request.registrationId(), answers, request.wantsNewsletter());
        return new ActionResponse("Respostas registradas com sucesso. Obrigado por participar!");
    }

    private CampaignRecord findBySlug(String slug) {
        return store.findActiveCampaignBySlug(slug)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Campanha nao encontrada ou inativa"));
    }

    private CampaignResponse toResponse(CampaignRecord campaign) {
        return new CampaignResponse(
            campaign.id,
            campaign.name,
            campaign.slug,
            campaign.description,
            campaign.confirmationMessage,
            campaign.active,
            campaign.profiles.stream()
                .map(profile -> new ProfileConfigResponse(
                    profile.profileType,
                    profile.questions.stream().map(this::toQuestionResponse).toList()
                ))
                .toList(),
            store.listRegistrations(campaign.id).size(),
            parseDate(campaign.createdAt)
        );
    }

    private CampaignRecord fromRequest(String id, CampaignRequest request) {
        CampaignRecord campaign = new CampaignRecord();
        campaign.id = id;
        campaign.name = request.name();
        campaign.slug = request.slug();
        campaign.description = request.description();
        campaign.confirmationMessage = request.confirmationMessage();
        campaign.active = request.active();
        campaign.profiles = new ArrayList<>();

        if (request.profiles() != null) {
            for (ProfileConfigRequest profileRequest : request.profiles()) {
                CampaignProfileRecord profile = new CampaignProfileRecord();
                profile.profileType = profileRequest.profileType();
                profile.questions = new ArrayList<>();
                if (profileRequest.questions() != null) {
                    for (QuestionRequest questionRequest : profileRequest.questions()) {
                        profile.questions.add(fromQuestionRequest(questionRequest));
                    }
                }
                campaign.profiles.add(profile);
            }
        }

        return campaign;
    }

    private CampaignQuestionRecord fromQuestionRequest(QuestionRequest request) {
        CampaignQuestionRecord question = new CampaignQuestionRecord();
        question.id = UUID.randomUUID().toString();
        question.text = request.text();
        question.type = request.type();
        question.options = request.options() == null ? List.of() : request.options();
        question.required = request.required();
        question.order = request.order();
        question.conditionalOnQuestionId = request.conditionalOnQuestionId();
        question.conditionalOnAnswer = request.conditionalOnAnswer();
        return question;
    }

    private QuestionResponse toQuestionResponse(CampaignQuestionRecord question) {
        return new QuestionResponse(
            question.id,
            question.text,
            question.type,
            question.options,
            question.required,
            question.order,
            question.conditionalOnQuestionId,
            question.conditionalOnAnswer
        );
    }

    private LocalDateTime parseDate(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }
        return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }
}
