package br.com.careops.api.patient;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.careops.api.core.CareopsDataStore;
import br.com.careops.api.core.CareopsDataStore.AlertRecord;
import br.com.careops.api.core.CareopsDataStore.AssessmentRecord;
import br.com.careops.api.core.CareopsDataStore.CareGoalRecord;
import br.com.careops.api.core.CareopsDataStore.IntelligenceSnapshot;
import br.com.careops.api.core.CareopsDataStore.PatientRecord;
import br.com.careops.api.core.CareopsDataStore.RoiEventRecord;
import br.com.careops.api.intelligence.ClinicalIntelligenceResponse;
import br.com.careops.api.intelligence.ClinicalIntelligenceService;
import br.com.careops.api.patient.dto.CareGoalRequest;
import br.com.careops.api.patient.dto.PatientCreateRequest;
import br.com.careops.api.patient.dto.PatientListItemResponse;
import br.com.careops.api.patient.dto.PatientRecordResponse;
import br.com.careops.api.patient.dto.PatientRecordResponse.AlertSummary;
import br.com.careops.api.patient.dto.PatientRecordResponse.AssessmentSummary;
import br.com.careops.api.patient.dto.PatientRecordResponse.GoalSummary;
import br.com.careops.api.patient.dto.PatientRecordResponse.PatientSummary;
import br.com.careops.api.patient.dto.PatientRecordResponse.RoiEventSummary;
import br.com.careops.api.patient.dto.PatientUpdateRequest;
import br.com.careops.api.patient.dto.RoiEventRequest;

@Service
public class PatientService {

    private final CareopsDataStore store;
    private final ClinicalIntelligenceService intelligenceService;

    public PatientService(CareopsDataStore store, ClinicalIntelligenceService intelligenceService) {
        this.store = store;
        this.intelligenceService = intelligenceService;
    }

    public List<PatientListItemResponse> listPatients() {
        return store.listPatients(store.defaultInstitutionId()).stream()
            .map(this::toListItem)
            .toList();
    }

    public PatientRecordResponse getRecord(String id) {
        PatientRecord patient = store.findPatient(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado"));
        return toRecord(patient);
    }

    public PatientListItemResponse createPatient(PatientCreateRequest request) {
        PatientRecord patient = new PatientRecord();
        patient.name = request.name();
        patient.cpf = request.cpf();
        patient.email = request.email();
        patient.phone = request.phone();
        patient.birthDate = request.birthDate();
        patient.sex = request.sex();
        patient.professional = request.professional() == null || request.professional().isBlank()
            ? "Equipe clinica"
            : request.professional();
        return toListItem(store.createPatient(patient));
    }

    public PatientListItemResponse updatePatient(String id, PatientUpdateRequest request) {
        return toListItem(store.updatePatient(id, patient -> {
            if (request.name() != null) patient.name = request.name();
            if (request.cpf() != null) patient.cpf = request.cpf();
            if (request.email() != null) patient.email = request.email();
            if (request.phone() != null) patient.phone = request.phone();
            if (request.birthDate() != null) patient.birthDate = request.birthDate();
            if (request.sex() != null) patient.sex = request.sex();
            if (request.professional() != null) patient.professional = request.professional();
            if (request.active() != null) patient.active = request.active();
        }));
    }

    public PatientListItemResponse archivePatient(String id) {
        return toListItem(store.updatePatient(id, patient -> {
            patient.active = false;
            patient.status = "Inativo";
            patient.signal = "Paciente arquivado pelo profissional";
        }));
    }

    public PatientRecordResponse submitAssessment(String patientId, Map<String, String> answers) {
        PatientRecord patient = store.findPatient(patientId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente nao encontrado"));
        IntelligenceSnapshot snapshot = intelligenceService.evaluateSnapshot(answers);
        store.addAssessment(patient.id, answers, snapshot);
        return getRecord(patient.id);
    }

    public PatientRecordResponse submitPatientAssessment(String requestedPatientId, Map<String, String> answers) {
        String patientId = requestedPatientId == null || requestedPatientId.isBlank()
            ? store.findPatientByCpf("123.456.789-00").map(patient -> patient.id).orElse("maria-silva")
            : requestedPatientId;
        return submitAssessment(patientId, answers);
    }

    public PatientRecordResponse addGoal(String patientId, CareGoalRequest request) {
        store.addGoal(patientId, request.title(), request.frequency(), request.createdBy());
        return getRecord(patientId);
    }

    public PatientRecordResponse updateGoal(String patientId, String goalId, String status) {
        store.updateGoal(goalId, status);
        return getRecord(patientId);
    }

    public PatientRecordResponse addRoiEvent(String patientId, RoiEventRequest request) {
        store.addRoiEvent(patientId, request.title(), request.value(), request.category(), request.justification(), request.createdBy());
        return getRecord(patientId);
    }

    public ClinicalIntelligenceResponse previewIntelligence(Map<String, String> answers) {
        return intelligenceService.evaluate(answers);
    }

    private PatientRecordResponse toRecord(PatientRecord patient) {
        List<AssessmentRecord> assessments = store.listAssessments(patient.id);
        Map<String, String> latestAnswers = assessments.isEmpty() ? Map.of() : assessments.get(0).answers;
        ClinicalIntelligenceResponse intelligence = intelligenceService.evaluate(latestAnswers);
        List<String> patientAlertIds = store.listAlerts(patient.institutionId).stream()
            .filter(alert -> alert.patientId.equals(patient.id))
            .map(alert -> alert.id)
            .toList();

        return new PatientRecordResponse(
            new PatientSummary(
                patient.id,
                patient.name,
                patient.cpfMasked,
                patient.email,
                patient.phone,
                patient.birthDate,
                patient.sex,
                patient.professional,
                patient.status,
                patient.signal,
                patient.currentScore,
                patient.currentRiskPercent,
                patient.currentRiskLevel,
                patient.lastResponseAt,
                patient.invitationCode,
                patient.active
            ),
            assessments.stream().map(this::toAssessmentSummary).toList(),
            store.listGoals(patient.id).stream().map(this::toGoalSummary).toList(),
            store.listRoiEvents(patient.id).stream().map(this::toRoiSummary).toList(),
            store.listAlerts(patient.institutionId).stream()
                .filter(alert -> patientAlertIds.contains(alert.id))
                .map(this::toAlertSummary)
                .toList(),
            intelligence,
            patient.consentVersion,
            patient.consentAcceptedAt
        );
    }

    private PatientListItemResponse toListItem(PatientRecord patient) {
        return new PatientListItemResponse(
            patient.id,
            patient.name,
            patient.cpfMasked,
            String.valueOf(patient.currentScore),
            patient.status,
            patient.lastResponseAt == null || patient.lastResponseAt.isBlank() ? "Sem resposta" : patient.lastResponseAt,
            patient.professional,
            patient.signal
        );
    }

    private AssessmentSummary toAssessmentSummary(AssessmentRecord assessment) {
        return new AssessmentSummary(
            assessment.id,
            assessment.answers,
            assessment.score,
            assessment.riskPercent,
            assessment.riskLevel,
            assessment.rulesVersion,
            assessment.questionVersion,
            assessment.createdAt
        );
    }

    private GoalSummary toGoalSummary(CareGoalRecord goal) {
        return new GoalSummary(
            goal.id,
            goal.title,
            goal.frequency,
            goal.status,
            goal.createdBy,
            goal.createdAt,
            goal.updatedAt,
            goal.completedAt
        );
    }

    private RoiEventSummary toRoiSummary(RoiEventRecord event) {
        return new RoiEventSummary(
            event.id,
            event.title,
            event.value,
            event.category,
            event.justification,
            event.createdBy,
            event.createdAt
        );
    }

    private AlertSummary toAlertSummary(AlertRecord alert) {
        return new AlertSummary(
            alert.id,
            alert.tone,
            alert.message,
            alert.source,
            alert.status,
            alert.priority,
            alert.createdAt,
            alert.resolvedAt
        );
    }
}
