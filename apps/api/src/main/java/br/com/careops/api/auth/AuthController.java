package br.com.careops.api.auth;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.careops.api.auth.dto.ActionResponse;
import br.com.careops.api.auth.dto.LoginRequest;
import br.com.careops.api.auth.dto.LoginResponse;
import br.com.careops.api.auth.dto.ManagementFirstAccessRequest;
import br.com.careops.api.auth.dto.ManagementPasswordResetRequest;
import br.com.careops.api.auth.dto.PartnerFirstAccessRequest;
import br.com.careops.api.auth.dto.PartnerPasswordResetRequest;
import br.com.careops.api.auth.dto.PatientFirstAccessRequest;
import br.com.careops.api.auth.dto.PatientPasswordResetRequest;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/management/login")
    public LoginResponse managementLogin(@Valid @RequestBody LoginRequest request) {
        return authService.loginManagement(request);
    }

    @PostMapping("/patient/login")
    public LoginResponse patientLogin(@Valid @RequestBody LoginRequest request) {
        return authService.loginPatient(request);
    }

    @PostMapping("/partner/login")
    public LoginResponse partnerLogin(@Valid @RequestBody LoginRequest request) {
        return authService.loginPartner(request);
    }

    @PostMapping("/management/password-reset")
    public ActionResponse managementPasswordReset(@Valid @RequestBody ManagementPasswordResetRequest request) {
        return authService.requestManagementPasswordReset(request);
    }

    @PostMapping("/patient/password-reset")
    public ActionResponse patientPasswordReset(@Valid @RequestBody PatientPasswordResetRequest request) {
        return authService.requestPatientPasswordReset(request);
    }

    @PostMapping("/partner/password-reset")
    public ActionResponse partnerPasswordReset(@Valid @RequestBody PartnerPasswordResetRequest request) {
        return authService.requestPartnerPasswordReset(request);
    }

    @PostMapping("/management/first-access")
    public ActionResponse managementFirstAccess(@Valid @RequestBody ManagementFirstAccessRequest request) {
        return authService.activateManagementAccess(request);
    }

    @PostMapping("/patient/first-access")
    public ActionResponse patientFirstAccess(@Valid @RequestBody PatientFirstAccessRequest request) {
        return authService.activatePatientAccess(request);
    }

    @PostMapping("/partner/first-access")
    public ActionResponse partnerFirstAccess(@Valid @RequestBody PartnerFirstAccessRequest request) {
        return authService.activatePartnerAccess(request);
    }
}
