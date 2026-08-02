package br.com.careops.api.auth;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.careops.api.auth.dto.ActionResponse;
import br.com.careops.api.auth.dto.LoginRequest;
import br.com.careops.api.auth.dto.LoginResponse;
import br.com.careops.api.auth.dto.ManagementFirstAccessRequest;
import br.com.careops.api.auth.dto.ManagementPasswordResetRequest;
import br.com.careops.api.auth.dto.PartnerFirstAccessRequest;
import br.com.careops.api.auth.dto.PartnerPasswordResetRequest;
import br.com.careops.api.auth.dto.PatientFirstAccessRequest;
import br.com.careops.api.auth.dto.PatientPasswordResetRequest;
import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.core.CareopsDataStore.InstitutionRecord;
import br.com.careops.api.core.CareopsDataStore.PatientRecord;
import br.com.careops.api.core.CareopsDataStore.SessionRecord;
import br.com.careops.api.core.CareopsDataStore.UserAccountRecord;

@Service
public class AuthService {

    private final CareopsDataStore store;

    public AuthService(CareopsDataStore store) {
        this.store = store;
    }

    public LoginResponse loginManagement(LoginRequest request) {
        return login(request, "MANAGEMENT", "/gestao/dashboard");
    }

    public LoginResponse loginPatient(LoginRequest request) {
        return login(request, "PATIENT", "/paciente/home");
    }

    public LoginResponse loginPartner(LoginRequest request) {
        return login(request, "PARTNER", "/parceiro/home");
    }

    public ActionResponse requestManagementPasswordReset(ManagementPasswordResetRequest request) {
        return new ActionResponse("Enviamos as instrucoes de redefinicao para " + request.email() + ".");
    }

    public ActionResponse requestPatientPasswordReset(PatientPasswordResetRequest request) {
        return new ActionResponse("Enviamos um novo link de acesso para o e-mail informado.");
    }

    public ActionResponse requestPartnerPasswordReset(PartnerPasswordResetRequest request) {
        return new ActionResponse("Enviamos as instrucoes de acesso para o e-mail informado.");
    }

    public ActionResponse activateManagementAccess(ManagementFirstAccessRequest request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        InstitutionRecord institution = requireInstitution(request.invitationCode());
        store.createOrActivateUser(
            institution.id,
            "MANAGEMENT",
            request.email(),
            displayNameFromEmail(request.email()),
            "Administrador",
            List.of("DASHBOARD_READ", "PATIENT_WRITE", "ROI_WRITE", "CAMPAIGN_WRITE"),
            request.password()
        );
        return new ActionResponse("Conta da clinica criada e acesso liberado. Agora voce ja pode entrar no painel.");
    }

    public ActionResponse activatePatientAccess(PatientFirstAccessRequest request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        InstitutionRecord institution = requireInstitution(request.institutionCode());
        PatientRecord patient = store.findPatientByCpf(request.cpf()).orElse(null);
        boolean newPatient = patient == null;

        if (newPatient) {
            if (request.name() == null || request.name().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o nome completo para criar o cadastro");
            }
            PatientRecord registration = new PatientRecord();
            registration.institutionId = institution.id;
            registration.name = request.name().trim();
            registration.cpf = request.cpf();
            registration.email = request.email() == null ? "" : request.email().trim();
            registration.birthDate = request.birthDate();
            registration.sex = "Nao informado";
            registration.professional = "Equipe clinica";
            patient = store.createPatient(registration);
        } else if (!patient.active || !patient.institutionId.equals(institution.id) || !request.birthDate().equals(patient.birthDate)) {
            throw new ResponseStatusException(
                HttpStatus.UNPROCESSABLE_ENTITY,
                "Este CPF ja esta cadastrado. Confira a data de nascimento e o codigo da instituicao"
            );
        }

        store.createOrActivateUser(
            institution.id,
            "PATIENT",
            patient.cpf,
            patient.name,
            "Paciente",
            List.of("PATIENT_HOME_READ", "ASSESSMENT_WRITE", "GOAL_WRITE"),
            request.password()
        );
        return new ActionResponse(newPatient
            ? "Cadastro e conta criados. Agora voce ja pode entrar na sua area."
            : "Conta ativada. Agora voce ja pode entrar na sua area.");
    }

    public ActionResponse activatePartnerAccess(PartnerFirstAccessRequest request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        InstitutionRecord institution = requireInstitution(request.institutionCode());
        store.createOrActivateUser(
            institution.id,
            "PARTNER",
            request.email(),
            request.name(),
            request.specialty(),
            List.of("PARTNER_HOME_READ"),
            request.password()
        );
        return new ActionResponse("Conta de parceiro criada e acesso liberado. Agora voce ja pode entrar na rede VH.");
    }

    private LoginResponse login(LoginRequest request, String role, String destination) {
        UserAccountRecord user = store.findUserByRoleAndIdentifier(role, request.identifier())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas"));

        if (!store.passwordMatches(user, request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
        }

        SessionRecord session = store.createSession(user);
        return new LoginResponse(
            session.token,
            user.role,
            user.name,
            destination,
            user.institutionId,
            user.id,
            session.expiresAt,
            user.permissions,
            false
        );
    }

    public UserAccountRecord requireAuthenticatedUser(String authorization, String expectedRole) {
        String token = authorization == null ? "" : authorization.replaceFirst("(?i)^Bearer\\s+", "").trim();
        SessionRecord session = store.findSession(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessao invalida ou expirada"));
        if (!expectedRole.equals(session.role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este acesso nao possui permissao para esta area");
        }
        return store.findUserById(session.userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Conta da sessao nao encontrada"));
    }

    private void validatePasswordConfirmation(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "As senhas informadas nao coincidem");
        }
    }

    private InstitutionRecord requireInstitution(String code) {
        try {
            return store.requireActiveInstitutionByCode(code);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        }
    }

    private String displayNameFromEmail(String email) {
        String localPart = email == null ? "" : email.trim().split("@", 2)[0];
        String normalized = localPart.replaceAll("[._-]+", " ").trim();
        return normalized.isBlank() ? "Equipe da clinica" : normalized;
    }
}
