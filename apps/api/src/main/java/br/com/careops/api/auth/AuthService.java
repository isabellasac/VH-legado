package br.com.careops.api.auth;

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
        store.findUserByRoleAndIdentifier("MANAGEMENT", request.email())
            .ifPresent(user -> store.updatePassword(user.id, request.password()));
        return new ActionResponse("Acesso liberado. Sua conta da clinica ja pode entrar no painel.");
    }

    public ActionResponse activatePatientAccess(PatientFirstAccessRequest request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        store.findUserByRoleAndIdentifier("PATIENT", request.cpf())
            .ifPresent(user -> store.updatePassword(user.id, request.password()));
        return new ActionResponse("Primeiro acesso concluido. Agora voce ja pode entrar na sua area.");
    }

    public ActionResponse activatePartnerAccess(PartnerFirstAccessRequest request) {
        validatePasswordConfirmation(request.password(), request.confirmPassword());
        store.findUserByRoleAndIdentifier("PARTNER", request.email())
            .ifPresent(user -> store.updatePassword(user.id, request.password()));
        return new ActionResponse("Acesso do parceiro liberado. Seu perfil ja pode entrar na rede VH.");
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

    private void validatePasswordConfirmation(String password, String confirmPassword) {
        if (!password.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "As senhas informadas nao coincidem");
        }
    }
}
