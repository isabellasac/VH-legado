package br.com.careops.api.patient;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.careops.api.auth.AuthService;
import br.com.careops.api.core.CareopsDataStore.UserAccountRecord;
import br.com.careops.api.intelligence.ClinicalIntelligenceResponse;
import br.com.careops.api.patient.dto.AssessmentSubmissionRequest;
import br.com.careops.api.patient.dto.CareGoalRequest;
import br.com.careops.api.patient.dto.GoalStatusRequest;
import br.com.careops.api.patient.dto.PatientCreateRequest;
import br.com.careops.api.patient.dto.PatientListItemResponse;
import br.com.careops.api.patient.dto.PatientRecordResponse;
import br.com.careops.api.patient.dto.PatientUpdateRequest;
import br.com.careops.api.patient.dto.RoiEventRequest;
import jakarta.validation.Valid;

@Validated
@RestController
@RequestMapping("/api")
public class PatientController {

    private final PatientService patientService;
    private final AuthService authService;

    public PatientController(PatientService patientService, AuthService authService) {
        this.patientService = patientService;
        this.authService = authService;
    }

    @GetMapping("/management/patients")
    public List<PatientListItemResponse> listPatients() {
        return patientService.listPatients();
    }

    @PostMapping("/management/patients")
    @ResponseStatus(HttpStatus.CREATED)
    public PatientListItemResponse createPatient(@Valid @RequestBody PatientCreateRequest request) {
        return patientService.createPatient(request);
    }

    @GetMapping("/management/patients/{id}")
    public PatientRecordResponse getRecord(@PathVariable String id) {
        return patientService.getRecord(id);
    }

    @PutMapping("/management/patients/{id}")
    public PatientListItemResponse updatePatient(@PathVariable String id, @RequestBody PatientUpdateRequest request) {
        return patientService.updatePatient(id, request);
    }

    @PatchMapping("/management/patients/{id}/archive")
    public PatientListItemResponse archivePatient(@PathVariable String id) {
        return patientService.archivePatient(id);
    }

    @PostMapping("/management/patients/{id}/assessment")
    public PatientRecordResponse submitAssessment(
        @PathVariable String id,
        @Valid @RequestBody AssessmentSubmissionRequest request
    ) {
        return patientService.submitAssessment(id, request.answers());
    }

    @PostMapping("/management/patients/{id}/goals")
    public PatientRecordResponse addGoal(@PathVariable String id, @Valid @RequestBody CareGoalRequest request) {
        return patientService.addGoal(id, request);
    }

    @PatchMapping("/management/patients/{id}/goals/{goalId}")
    public PatientRecordResponse updateGoal(
        @PathVariable String id,
        @PathVariable String goalId,
        @Valid @RequestBody GoalStatusRequest request
    ) {
        return patientService.updateGoal(id, goalId, request.status());
    }

    @PostMapping("/management/patients/{id}/roi-events")
    public PatientRecordResponse addRoiEvent(@PathVariable String id, @Valid @RequestBody RoiEventRequest request) {
        return patientService.addRoiEvent(id, request);
    }

    @GetMapping("/patient/home")
    public PatientRecordResponse getPatientHome(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccountRecord user = authService.requireAuthenticatedUser(authorization, "PATIENT");
        return patientService.getPatientHome(user);
    }

    @PostMapping("/patient/assessment")
    public PatientRecordResponse submitPatientAssessment(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody AssessmentSubmissionRequest request
    ) {
        UserAccountRecord user = authService.requireAuthenticatedUser(authorization, "PATIENT");
        return patientService.submitPatientAssessment(user, request.answers());
    }

    @PostMapping("/intelligence/preview")
    public ClinicalIntelligenceResponse previewIntelligence(@Valid @RequestBody AssessmentSubmissionRequest request) {
        return patientService.previewIntelligence(request.answers());
    }
}
