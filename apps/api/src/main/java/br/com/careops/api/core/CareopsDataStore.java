package br.com.careops.api.core;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Component
public class CareopsDataStore {

    private static final String DEFAULT_INSTITUTION_ID = "clinicavida";
    private static final String DEFAULT_PASSWORD = "12345678";

    private static final String STORE_ID = "main";

    private final ObjectMapper objectMapper;
    private final Path dataPath;
    private final String databaseUrl;
    private final boolean databaseRequired;
    private CareopsData data = new CareopsData();

    public CareopsDataStore(
        ObjectMapper objectMapper,
        @Value("${careops.data.path:data/careops-store.json}") String dataPath,
        @Value("${careops.database.url:}") String databaseUrl,
        @Value("${careops.database.required:false}") boolean databaseRequired
    ) {
        this.objectMapper = objectMapper;
        this.dataPath = Path.of(dataPath);
        this.databaseUrl = databaseUrl == null ? "" : databaseUrl.trim();
        this.databaseRequired = databaseRequired;
    }

    @PostConstruct
    public synchronized void load() {
        if (hasDatabaseUrl()) {
            loadFromDatabase();
            return;
        }

        if (databaseRequired) {
            throw new IllegalStateException("DATABASE_URL e obrigatoria quando CAREOPS_REQUIRE_DATABASE=true");
        }

        if (Files.exists(dataPath)) {
            try {
                data = objectMapper.readValue(dataPath.toFile(), CareopsData.class);
                ensureCollections();
                if (!data.seeded) {
                    seed();
                    save();
                }
                return;
            } catch (IOException ex) {
                throw new IllegalStateException("Nao foi possivel carregar o store CareOps em " + dataPath, ex);
            }
        }

        seed();
        save();
    }

    public synchronized String defaultInstitutionId() {
        return DEFAULT_INSTITUTION_ID;
    }

    public synchronized List<InstitutionRecord> institutions() {
        return data.institutions.stream().map(InstitutionRecord::copy).toList();
    }

    public synchronized Optional<InstitutionRecord> findInstitution(String id) {
        return data.institutions.stream()
            .filter(item -> item.id.equals(id))
            .findFirst()
            .map(InstitutionRecord::copy);
    }

    public synchronized Optional<UserAccountRecord> findUserByRoleAndIdentifier(String role, String identifier) {
        String normalized = normalizeIdentifier(identifier);
        return data.users.stream()
            .filter(user -> user.role.equals(role))
            .filter(user -> normalizeIdentifier(user.identifier).equals(normalized))
            .findFirst()
            .map(UserAccountRecord::copy);
    }

    public synchronized Optional<UserAccountRecord> findUserById(String id) {
        return data.users.stream()
            .filter(user -> user.id.equals(id))
            .findFirst()
            .map(UserAccountRecord::copy);
    }

    public synchronized boolean passwordMatches(UserAccountRecord user, String rawPassword) {
        return user.passwordHash.equals(hashPassword(rawPassword));
    }

    public synchronized void updatePassword(String userId, String rawPassword) {
        mutateUser(userId, user -> {
            user.passwordHash = hashPassword(rawPassword);
            user.firstAccessCompleted = true;
            user.updatedAt = now();
        });
    }

    public synchronized SessionRecord createSession(UserAccountRecord user) {
        SessionRecord session = new SessionRecord();
        session.id = UUID.randomUUID().toString();
        session.userId = user.id;
        session.institutionId = user.institutionId;
        session.role = user.role;
        session.token = "careops." + UUID.randomUUID() + "." + UUID.randomUUID();
        session.createdAt = now();
        session.expiresAt = LocalDateTime.now().plusHours(8).format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        session.revoked = false;

        data.sessions.removeIf(existing -> existing.userId.equals(user.id));
        data.sessions.add(session);
        save();
        return SessionRecord.copy(session);
    }

    public synchronized Optional<SessionRecord> findSession(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        return data.sessions.stream()
            .filter(session -> session.token.equals(token))
            .filter(session -> !session.revoked)
            .findFirst()
            .map(SessionRecord::copy);
    }

    public synchronized List<PatientRecord> listPatients(String institutionId) {
        recalculatePatientStates(institutionId);
        return data.patients.stream()
            .filter(patient -> patient.institutionId.equals(institutionId))
            .sorted(Comparator.comparing((PatientRecord patient) -> patient.statusPriority()).thenComparing(patient -> patient.name))
            .map(PatientRecord::copy)
            .toList();
    }

    public synchronized Optional<PatientRecord> findPatient(String id) {
        recalculatePatientStates(DEFAULT_INSTITUTION_ID);
        return data.patients.stream()
            .filter(patient -> patient.id.equals(id))
            .findFirst()
            .map(PatientRecord::copy);
    }

    public synchronized Optional<PatientRecord> findPatientByCpf(String cpf) {
        String normalizedCpf = normalizeCpf(cpf);
        recalculatePatientStates(DEFAULT_INSTITUTION_ID);
        return data.patients.stream()
            .filter(patient -> normalizeCpf(patient.cpf).equals(normalizedCpf))
            .findFirst()
            .map(PatientRecord::copy);
    }

    public synchronized PatientRecord createPatient(PatientRecord request) {
        PatientRecord patient = PatientRecord.copy(request);
        patient.id = patient.id == null || patient.id.isBlank() ? slugFromName(patient.name) : patient.id;
        patient.institutionId = blankToDefault(patient.institutionId, DEFAULT_INSTITUTION_ID);
        patient.cpfMasked = maskCpf(patient.cpf);
        patient.currentScore = patient.currentScore <= 0 ? 0 : patient.currentScore;
        patient.currentRiskLevel = blankToDefault(patient.currentRiskLevel, "Sem leitura");
        patient.currentRiskPercent = Math.max(patient.currentRiskPercent, 0);
        patient.status = "Pendente";
        patient.signal = "Aguardando primeira avaliacao";
        patient.active = true;
        patient.invitationCode = blankToDefault(patient.invitationCode, "VH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        patient.createdAt = blankToDefault(patient.createdAt, now());
        patient.updatedAt = now();

        String baseId = patient.id;
        int suffix = 2;
        while (data.patients.stream().anyMatch(existing -> existing.id.equals(patient.id))) {
            patient.id = baseId + "-" + suffix;
            suffix++;
        }

        data.patients.add(patient);
        recordConsent(patient.id, patient.institutionId, "manual-patient-create", "lgpd-v1");
        save();
        return PatientRecord.copy(patient);
    }

    public synchronized PatientRecord updatePatient(String id, Consumer<PatientRecord> mutation) {
        PatientRecord patient = data.patients.stream()
            .filter(item -> item.id.equals(id))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Paciente nao encontrado"));

        mutation.accept(patient);
        patient.cpfMasked = maskCpf(patient.cpf);
        patient.updatedAt = now();
        recalculatePatient(patient);
        save();
        return PatientRecord.copy(patient);
    }

    public synchronized AssessmentRecord addAssessment(String patientId, Map<String, String> answers, IntelligenceSnapshot intelligence) {
        PatientRecord patient = data.patients.stream()
            .filter(item -> item.id.equals(patientId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Paciente nao encontrado"));

        AssessmentRecord assessment = new AssessmentRecord();
        assessment.id = UUID.randomUUID().toString();
        assessment.patientId = patient.id;
        assessment.institutionId = patient.institutionId;
        assessment.answers = new LinkedHashMap<>(answers);
        assessment.score = intelligence.score;
        assessment.riskPercent = intelligence.riskPercent;
        assessment.riskLevel = intelligence.riskLevel;
        assessment.riskTone = intelligence.riskTone;
        assessment.signals = intelligence.signals.stream().map(SignalRecord::copy).toList();
        assessment.sourceIds = new ArrayList<>(intelligence.sourceIds);
        assessment.rulesVersion = intelligence.rulesVersion;
        assessment.questionVersion = "careops-vh-questionnaire-v1";
        assessment.createdAt = now();
        data.assessments.add(assessment);

        patient.lastResponseAt = assessment.createdAt;
        patient.currentScore = assessment.score;
        patient.currentRiskPercent = assessment.riskPercent;
        patient.currentRiskLevel = assessment.riskLevel;
        patient.signal = intelligence.primarySignal();
        recalculatePatient(patient);
        rebuildAlertsForPatient(patient);
        save();
        return AssessmentRecord.copy(assessment);
    }

    public synchronized List<AssessmentRecord> listAssessments(String patientId) {
        return data.assessments.stream()
            .filter(item -> item.patientId.equals(patientId))
            .sorted(Comparator.comparing((AssessmentRecord item) -> item.createdAt).reversed())
            .map(AssessmentRecord::copy)
            .toList();
    }

    public synchronized List<CareGoalRecord> listGoals(String patientId) {
        return data.goals.stream()
            .filter(goal -> goal.patientId.equals(patientId))
            .sorted(Comparator.comparing((CareGoalRecord goal) -> goal.createdAt))
            .map(CareGoalRecord::copy)
            .toList();
    }

    public synchronized CareGoalRecord addGoal(String patientId, String title, String frequency, String createdBy) {
        PatientRecord patient = requirePatient(patientId);
        CareGoalRecord goal = new CareGoalRecord();
        goal.id = UUID.randomUUID().toString();
        goal.patientId = patient.id;
        goal.institutionId = patient.institutionId;
        goal.title = title;
        goal.frequency = blankToDefault(frequency, "Diaria");
        goal.status = "Pendente";
        goal.createdBy = blankToDefault(createdBy, "Equipe clinica");
        goal.createdAt = now();
        goal.updatedAt = goal.createdAt;
        data.goals.add(goal);
        save();
        return CareGoalRecord.copy(goal);
    }

    public synchronized CareGoalRecord updateGoal(String goalId, String status) {
        CareGoalRecord goal = data.goals.stream()
            .filter(item -> item.id.equals(goalId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Meta nao encontrada"));

        goal.status = blankToDefault(status, goal.status);
        goal.updatedAt = now();
        if ("Concluida".equalsIgnoreCase(goal.status) || "Concluída".equalsIgnoreCase(goal.status)) {
            goal.completedAt = now();
            goal.status = "Concluida";
        }
        recalculatePatient(requirePatient(goal.patientId));
        save();
        return CareGoalRecord.copy(goal);
    }

    public synchronized List<RoiEventRecord> listRoiEvents(String patientId) {
        return data.roiEvents.stream()
            .filter(event -> event.patientId.equals(patientId))
            .sorted(Comparator.comparing((RoiEventRecord event) -> event.createdAt).reversed())
            .map(RoiEventRecord::copy)
            .toList();
    }

    public synchronized RoiEventRecord addRoiEvent(String patientId, String title, BigDecimal value, String category, String justification, String createdBy) {
        PatientRecord patient = requirePatient(patientId);
        RoiEventRecord event = new RoiEventRecord();
        event.id = UUID.randomUUID().toString();
        event.patientId = patient.id;
        event.institutionId = patient.institutionId;
        event.title = title;
        event.value = value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
        event.category = blankToDefault(category, "Ganho manual");
        event.justification = blankToDefault(justification, "");
        event.createdBy = blankToDefault(createdBy, "Equipe clinica");
        event.createdAt = now();
        data.roiEvents.add(event);
        save();
        return RoiEventRecord.copy(event);
    }

    public synchronized List<AlertRecord> listAlerts(String institutionId) {
        recalculatePatientStates(institutionId);
        return data.alerts.stream()
            .filter(alert -> alert.institutionId.equals(institutionId))
            .filter(alert -> !"Resolvido".equals(alert.status))
            .sorted(Comparator.comparing((AlertRecord alert) -> alert.priority).thenComparing(alert -> alert.createdAt))
            .map(AlertRecord::copy)
            .toList();
    }

    public synchronized AlertRecord updateAlertStatus(String alertId, String status) {
        AlertRecord alert = data.alerts.stream()
            .filter(item -> item.id.equals(alertId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Alerta nao encontrado"));
        alert.status = blankToDefault(status, alert.status);
        alert.updatedAt = now();
        if ("Resolvido".equalsIgnoreCase(alert.status)) {
            alert.resolvedAt = now();
            alert.status = "Resolvido";
        }
        save();
        return AlertRecord.copy(alert);
    }

    public synchronized List<RagSourceRecord> ragSources() {
        return data.ragSources.stream().map(RagSourceRecord::copy).toList();
    }

    public synchronized List<CampaignRecord> listCampaigns() {
        return data.campaigns.stream()
            .sorted(Comparator.comparing((CampaignRecord campaign) -> campaign.createdAt).reversed())
            .map(CampaignRecord::copy)
            .toList();
    }

    public synchronized Optional<CampaignRecord> findCampaignById(String id) {
        return data.campaigns.stream()
            .filter(campaign -> campaign.id.equals(id))
            .findFirst()
            .map(CampaignRecord::copy);
    }

    public synchronized Optional<CampaignRecord> findActiveCampaignBySlug(String slug) {
        return data.campaigns.stream()
            .filter(campaign -> campaign.slug.equalsIgnoreCase(slug))
            .filter(campaign -> campaign.active)
            .findFirst()
            .map(CampaignRecord::copy);
    }

    public synchronized CampaignRecord upsertCampaign(CampaignRecord request) {
        CampaignRecord campaign = CampaignRecord.copy(request);
        if (campaign.id == null || campaign.id.isBlank()) {
            campaign.id = UUID.randomUUID().toString();
            campaign.createdAt = now();
            data.campaigns.add(campaign);
        } else {
            CampaignRecord existing = data.campaigns.stream()
                .filter(item -> item.id.equals(campaign.id))
                .findFirst()
                .orElse(null);
            if (existing == null) {
                campaign.createdAt = blankToDefault(campaign.createdAt, now());
                data.campaigns.add(campaign);
            } else {
                campaign.createdAt = existing.createdAt;
                int index = data.campaigns.indexOf(existing);
                data.campaigns.set(index, campaign);
            }
        }
        save();
        return CampaignRecord.copy(campaign);
    }

    public synchronized void deleteCampaign(String id) {
        boolean removed = data.campaigns.removeIf(campaign -> campaign.id.equals(id));
        if (!removed) {
            throw new IllegalArgumentException("Campanha nao encontrada");
        }
        save();
    }

    public synchronized List<RegistrationRecord> listRegistrations(String campaignId) {
        return data.registrations.stream()
            .filter(registration -> registration.campaignId.equals(campaignId))
            .sorted(Comparator.comparing((RegistrationRecord item) -> item.createdAt).reversed())
            .map(RegistrationRecord::copy)
            .toList();
    }

    public synchronized Optional<RegistrationRecord> findRegistrationByEmail(String campaignId, String email) {
        return data.registrations.stream()
            .filter(registration -> registration.campaignId.equals(campaignId))
            .filter(registration -> registration.email.equalsIgnoreCase(email))
            .findFirst()
            .map(RegistrationRecord::copy);
    }

    public synchronized RegistrationRecord addRegistration(RegistrationRecord request) {
        RegistrationRecord registration = RegistrationRecord.copy(request);
        registration.id = UUID.randomUUID().toString();
        registration.createdAt = now();
        registration.answers = new ArrayList<>();
        data.registrations.add(registration);
        save();
        return RegistrationRecord.copy(registration);
    }

    public synchronized RegistrationRecord submitRegistrationAnswers(String registrationId, List<AnswerEntryRecord> answers, boolean wantsNewsletter) {
        RegistrationRecord registration = data.registrations.stream()
            .filter(item -> item.id.equals(registrationId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Registro nao encontrado"));
        registration.answers = answers.stream().map(AnswerEntryRecord::copy).toList();
        registration.wantsNewsletter = wantsNewsletter;
        registration.completedAt = now();
        save();
        return RegistrationRecord.copy(registration);
    }

    public synchronized BigDecimal totalRoi(String institutionId) {
        return data.roiEvents.stream()
            .filter(event -> event.institutionId.equals(institutionId))
            .map(event -> event.value)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public synchronized Map<String, BigDecimal> roiByCategory(String institutionId) {
        Map<String, BigDecimal> totals = new LinkedHashMap<>();
        data.roiEvents.stream()
            .filter(event -> event.institutionId.equals(institutionId))
            .forEach(event -> totals.merge(event.category, event.value, BigDecimal::add));
        return totals;
    }

    public synchronized String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("careops-vh:" + rawPassword).getBytes());
            StringBuilder builder = new StringBuilder();
            for (byte item : hash) {
                builder.append(String.format("%02x", item));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 indisponivel", ex);
        }
    }

    private void mutateUser(String userId, Consumer<UserAccountRecord> mutation) {
        UserAccountRecord user = data.users.stream()
            .filter(item -> item.id.equals(userId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado"));
        mutation.accept(user);
        save();
    }

    private PatientRecord requirePatient(String patientId) {
        return data.patients.stream()
            .filter(patient -> patient.id.equals(patientId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Paciente nao encontrado"));
    }

    private void recalculatePatientStates(String institutionId) {
        data.patients.stream()
            .filter(patient -> patient.institutionId.equals(institutionId))
            .forEach(this::recalculatePatient);
        rebuildAllAlerts(institutionId);
    }

    private void recalculatePatient(PatientRecord patient) {
        if (!patient.active) {
            patient.status = "Inativo";
            return;
        }

        if (patient.lastResponseAt == null || patient.lastResponseAt.isBlank()) {
            patient.status = "Pendente";
            return;
        }

        LocalDateTime lastResponse = parseDateTime(patient.lastResponseAt);
        long daysWithoutResponse = java.time.Duration.between(lastResponse, LocalDateTime.now()).toDays();
        boolean hasRecentCompletedGoals = data.goals.stream()
            .filter(goal -> goal.patientId.equals(patient.id))
            .anyMatch(goal -> "Concluida".equals(goal.status) && goal.completedAt != null && !goal.completedAt.isBlank());

        if (patient.currentScore < 60 || daysWithoutResponse > 10) {
            patient.status = "Em Alerta";
        } else if (hasRecentCompletedGoals) {
            patient.status = "Monitorado";
        } else {
            patient.status = "Ativo";
        }
    }

    private void rebuildAllAlerts(String institutionId) {
        Set<String> patientIds = new HashSet<>();
        data.patients.stream()
            .filter(patient -> patient.institutionId.equals(institutionId))
            .forEach(patient -> {
                patientIds.add(patient.id);
                rebuildAlertsForPatient(patient);
            });
        data.alerts.removeIf(alert -> alert.institutionId.equals(institutionId) && !patientIds.contains(alert.patientId));
    }

    private void rebuildAlertsForPatient(PatientRecord patient) {
        data.alerts.removeIf(alert -> alert.patientId.equals(patient.id) && alert.source.startsWith("AUTO_"));

        if (!patient.active) {
            return;
        }

        LocalDateTime created = LocalDateTime.now();
        List<AlertRecord> nextAlerts = new ArrayList<>();

        if (patient.currentScore > 0 && patient.currentScore < 60) {
            nextAlerts.add(newAutoAlert(patient, "danger", "Score abaixo de 60 para " + patient.name, "AUTO_SCORE", 1, created));
        }

        List<AssessmentRecord> assessments = data.assessments.stream()
            .filter(item -> item.patientId.equals(patient.id))
            .sorted(Comparator.comparing((AssessmentRecord item) -> item.createdAt).reversed())
            .toList();
        if (assessments.size() >= 2) {
            int drop = assessments.get(1).score - assessments.get(0).score;
            if (drop >= 20) {
                nextAlerts.add(newAutoAlert(patient, "danger", "Score caiu " + drop + " pontos desde a ultima leitura", "AUTO_SCORE_DROP", 1, created));
            }
        }

        if (patient.lastResponseAt != null && !patient.lastResponseAt.isBlank()) {
            LocalDateTime lastResponse = parseDateTime(patient.lastResponseAt);
            long daysWithoutResponse = java.time.Duration.between(lastResponse, LocalDateTime.now()).toDays();
            if (daysWithoutResponse >= 10) {
                nextAlerts.add(newAutoAlert(patient, "info", patient.name + " esta sem resposta ha " + daysWithoutResponse + " dias", "AUTO_RESPONSE_GAP", 3, created));
            }
        }

        boolean hasMedicineRisk = assessments.stream()
            .limit(1)
            .map(assessment -> assessment.answers.getOrDefault("quantidade_medicamentos", ""))
            .anyMatch(value -> value.contains("6") || value.toLowerCase().contains("mais"));
        if (hasMedicineRisk) {
            nextAlerts.add(newAutoAlert(patient, "danger", patient.name + " informou uso de 6 ou mais medicamentos", "AUTO_PRM", 1, created));
        }

        long daysSinceGoal = data.goals.stream()
            .filter(goal -> goal.patientId.equals(patient.id))
            .filter(goal -> "Concluida".equals(goal.status))
            .map(goal -> parseDateTime(blankToDefault(goal.completedAt, goal.updatedAt)))
            .max(Comparator.naturalOrder())
            .map(lastCompleted -> java.time.Duration.between(lastCompleted, LocalDateTime.now()).toDays())
            .orElse(8L);
        if (!data.goals.stream().filter(goal -> goal.patientId.equals(patient.id)).toList().isEmpty() && daysSinceGoal >= 7) {
            nextAlerts.add(newAutoAlert(patient, "warning", patient.name + " esta ha " + daysSinceGoal + " dias sem meta concluida", "AUTO_GOAL_GAP", 2, created));
        }

        data.alerts.addAll(nextAlerts);
    }

    private AlertRecord newAutoAlert(PatientRecord patient, String tone, String message, String source, int priority, LocalDateTime created) {
        AlertRecord alert = new AlertRecord();
        alert.id = UUID.randomUUID().toString();
        alert.patientId = patient.id;
        alert.institutionId = patient.institutionId;
        alert.tone = tone;
        alert.message = message;
        alert.source = source;
        alert.status = "Aberto";
        alert.priority = priority;
        alert.createdAt = created.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        alert.updatedAt = alert.createdAt;
        return alert;
    }

    private void recordConsent(String patientId, String institutionId, String source, String version) {
        ConsentRecord consent = new ConsentRecord();
        consent.id = UUID.randomUUID().toString();
        consent.patientId = patientId;
        consent.institutionId = institutionId;
        consent.source = source;
        consent.version = version;
        consent.acceptedAt = now();
        data.consents.add(consent);
    }

    private void seed() {
        data = new CareopsData();
        data.schemaVersion = "careops-store-v1";
        data.seeded = true;

        InstitutionRecord institution = new InstitutionRecord();
        institution.id = DEFAULT_INSTITUTION_ID;
        institution.name = "Clinica Vida & Saude";
        institution.code = "VH-CLINICA-VIDA";
        institution.active = true;
        data.institutions.add(institution);

        addUser("user-management-1", institution.id, "MANAGEMENT", "gestao@clinicavida.com", "Dr. Ricardo Andrade", "Administrador", List.of("DASHBOARD_READ", "PATIENT_WRITE", "ROI_WRITE", "CAMPAIGN_WRITE"));
        addUser("user-patient-1", institution.id, "PATIENT", "123.456.789-00", "Maria Silva", "Paciente", List.of("PATIENT_HOME_READ", "ASSESSMENT_WRITE", "GOAL_WRITE"));
        addUser("user-partner-1", institution.id, "PARTNER", "parceiro@vh.com", "Dra. Marina Costa", "Parceiro", List.of("PARTNER_HOME_READ"));

        seedRagSources();
        seedPatients();
        seedCampaign();

        data.patients.forEach(patient -> {
            recalculatePatient(patient);
            rebuildAlertsForPatient(patient);
        });
    }

    private void addUser(String id, String institutionId, String role, String identifier, String name, String displayRole, List<String> permissions) {
        UserAccountRecord user = new UserAccountRecord();
        user.id = id;
        user.institutionId = institutionId;
        user.role = role;
        user.identifier = identifier;
        user.passwordHash = hashPassword(DEFAULT_PASSWORD);
        user.name = name;
        user.displayRole = displayRole;
        user.permissions = new ArrayList<>(permissions);
        user.firstAccessCompleted = true;
        user.createdAt = now();
        user.updatedAt = user.createdAt;
        data.users.add(user);
    }

    private void seedRagSources() {
        data.ragSources.add(new RagSourceRecord("score", "Regra de score VH", "Perguntas fechadas pontuam de 0 a 100; respostas abertas geram aviso para o prontuario.", "score-v1", "Equipe CareOps", "2026-06-16", "score"));
        data.ragSources.add(new RagSourceRecord("prm", "Parametros de PRMs", "Uso de muitos medicamentos, efeitos relatados e necessidade de revisao farmaceutica.", "prm-v1", "Equipe CareOps", "2026-06-16", "farmaceutico"));
        data.ragSources.add(new RagSourceRecord("alertas", "Regras clinicas de alerta", "Baixa adesao, queda de score, muitos medicamentos e ausencia de resposta/metas.", "alertas-v1", "Equipe CareOps", "2026-06-16", "alertas"));
        data.ragSources.add(new RagSourceRecord("acompanhamento", "Plano de cuidado validado", "Sono, hidratacao, terapia, metas e acompanhamento humano pela clinica.", "cuidado-v1", "Equipe CareOps", "2026-06-16", "cuidado"));
        data.ragSources.add(new RagSourceRecord("roi", "ROI assistencial", "Eventos evitados, intervencoes registradas e economia assistencial por tipo.", "roi-v1", "Equipe CareOps", "2026-06-16", "roi"));
    }

    private void seedPatients() {
        PatientRecord maria = createSeedPatient("maria-silva", "Maria Silva", "123.456.789-00", "maria@vh.com", "(31) 99999-1001", "1984-03-12", "Feminino", "Dra. Ana Costa");
        PatientRecord joao = createSeedPatient("joao-oliveira", "Joao Oliveira", "341.222.987-91", "joao@vh.com", "(31) 99999-1002", "1978-09-04", "Masculino", "Dr. Carlos Mendes");
        PatientRecord ana = createSeedPatient("ana-santos", "Ana Santos", "918.444.222-14", "ana@vh.com", "(31) 99999-1003", "1991-11-21", "Feminino", "Dra. Lucia Ferreira");
        PatientRecord pedro = createSeedPatient("pedro-souza", "Pedro Souza", "557.333.111-30", "pedro@vh.com", "(31) 99999-1004", "1966-05-18", "Masculino", "Dr. Pedro Santos");
        data.patients.addAll(List.of(maria, joao, ana, pedro));

        addSeedAssessment(maria.id, 78, 22, "Baixo", Map.of("sono", "4", "energia", "4", "humor", "4", "estresse", "2", "medicacao", "4", "quantidade_medicamentos", "3-5", "terapia", "sim"), "Energia estavel");
        addSeedAssessment(joao.id, 61, 39, "Moderado", Map.of("sono", "3", "energia", "3", "humor", "3", "estresse", "3", "medicacao", "3", "quantidade_medicamentos", "3-5", "terapia", "parcialmente"), "Atencao");
        addSeedAssessment(ana.id, 84, 16, "Baixo", Map.of("sono", "5", "energia", "4", "humor", "5", "estresse", "1", "medicacao", "5", "quantidade_medicamentos", "1-2", "terapia", "sim"), "Estavel");
        addSeedAssessment(pedro.id, 49, 51, "Moderado", Map.of("sono", "2", "energia", "2", "humor", "2", "estresse", "4", "medicacao", "2", "quantidade_medicamentos", "6+", "efeitos", "tontura", "terapia", "nao"), "Critico");

        addGoal(maria.id, "Beber agua ao longo do dia", "Diaria", "Dra. Ana Costa");
        updateGoal(data.goals.get(data.goals.size() - 1).id, "Concluida");
        addGoal(maria.id, "Caminhada leve", "3x por semana", "Dra. Ana Costa");
        addGoal(pedro.id, "Revisar horarios dos medicamentos", "Diaria", "Dr. Pedro Santos");

        addRoiEvent(maria.id, "Ajuste de medicacao evitou retorno ao pronto atendimento", new BigDecimal("4100"), "Ajuste de medicacao", "Revisao farmaceutica registrada no plano.", "Dra. Ana Costa");
        addRoiEvent(pedro.id, "Prevencao de risco de queda", new BigDecimal("1500"), "Risco de queda", "Relato de tontura priorizado para acompanhamento.", "Dr. Pedro Santos");
        addRoiEvent(joao.id, "Intervencao NR-1 em saude mental", new BigDecimal("600"), "NR-1", "Monitoramento de estresse e adesao terapeutica.", "Dr. Carlos Mendes");
    }

    private PatientRecord createSeedPatient(String id, String name, String cpf, String email, String phone, String birthDate, String sex, String professional) {
        PatientRecord patient = new PatientRecord();
        patient.id = id;
        patient.institutionId = DEFAULT_INSTITUTION_ID;
        patient.name = name;
        patient.cpf = cpf;
        patient.cpfMasked = maskCpf(cpf);
        patient.email = email;
        patient.phone = phone;
        patient.birthDate = birthDate;
        patient.sex = sex;
        patient.professional = professional;
        patient.assignedProfessionalId = "user-management-1";
        patient.status = "Pendente";
        patient.signal = "Aguardando leitura";
        patient.currentRiskLevel = "Sem leitura";
        patient.active = true;
        patient.invitationCode = "VH-" + id.toUpperCase().replace("-", "-").substring(0, Math.min(id.length(), 8));
        patient.createdAt = now();
        patient.updatedAt = patient.createdAt;
        patient.consentVersion = "lgpd-v1";
        patient.consentAcceptedAt = patient.createdAt;
        return patient;
    }

    private void addSeedAssessment(String patientId, int score, int riskPercent, String riskLevel, Map<String, String> answers, String signal) {
        PatientRecord patient = requirePatient(patientId);
        AssessmentRecord assessment = new AssessmentRecord();
        assessment.id = UUID.randomUUID().toString();
        assessment.patientId = patientId;
        assessment.institutionId = DEFAULT_INSTITUTION_ID;
        assessment.answers = new LinkedHashMap<>(answers);
        assessment.score = score;
        assessment.riskPercent = riskPercent;
        assessment.riskLevel = riskLevel;
        assessment.riskTone = score < 60 ? "danger" : score < 71 ? "warning" : "success";
        assessment.rulesVersion = "vh-rules-seed";
        assessment.questionVersion = "careops-vh-questionnaire-v1";
        assessment.createdAt = now();
        SignalRecord seedSignal = new SignalRecord();
        seedSignal.label = signal;
        seedSignal.evidence = "Carga inicial do MVP.";
        seedSignal.action = "Manter monitoramento e validar no prontuario.";
        seedSignal.tone = assessment.riskTone;
        seedSignal.sourceIds = List.of("score", "acompanhamento");
        assessment.signals = List.of(seedSignal);
        assessment.sourceIds = List.of("score", "acompanhamento");
        data.assessments.add(assessment);
        patient.lastResponseAt = assessment.createdAt;
        patient.currentScore = score;
        patient.currentRiskPercent = riskPercent;
        patient.currentRiskLevel = riskLevel;
        patient.signal = signal;
    }

    private void seedCampaign() {
        CampaignRecord campaign = new CampaignRecord();
        campaign.id = "camp-minas-summit-2026";
        campaign.name = "Minas Summit 2026";
        campaign.slug = "minas-summit-2026";
        campaign.description = "Evento voltado para saude corporativa, bem-estar e inovacao em cuidados integrados.";
        campaign.confirmationMessage = "Cadastro realizado! Nos vemos no Minas Summit 2026.";
        campaign.active = true;
        campaign.createdAt = now();
        campaign.profiles = new ArrayList<>();

        CampaignProfileRecord instituicao = new CampaignProfileRecord();
        instituicao.profileType = "Instituicao";
        instituicao.questions = List.of(
            question("inst-q1", "A sua empresa adota medidas de adequacao a NR-1?", "SINGLE_CHOICE", List.of("Sim", "Nao", "Em implementacao"), true, 1, null, null),
            question("inst-q2", "O que mais observa entre os colaboradores com quem tem contato?", "MULTIPLE_CHOICE", List.of("Fadiga recorrente", "Dificuldade de concentracao", "Baixa performance nao habitual", "Inseguranca na comunicacao", "Afastamentos recorrentes", "Outros"), true, 2, null, null),
            question("inst-q3", "Como a saude do colaborador e monitorada?", "SINGLE_CHOICE", List.of("Nao ha monitoramento", "Existe monitoramento pontual, sem propositivas de melhoria", "Existe monitoramento com propositivas de melhoria"), true, 3, null, null)
        );

        CampaignProfileRecord usuario = new CampaignProfileRecord();
        usuario.profileType = "Usuario";
        usuario.questions = List.of(
            question("usr-q1", "Possui algum problema de saude que gostaria de compartilhar?", "TEXT", List.of(), false, 1, null, null),
            question("usr-q2", "Quais sao os cuidados que tem adotado para reverter os sintomas e buscar a cura?", "SINGLE_CHOICE", List.of("Tratamento monitorado com medico/profissional", "Busca solucionar apenas quando ha crises", "Ja conhece a forma de tratamento e o realiza por conta propria", "Nao busca tratamento"), true, 2, null, null),
            question("usr-q3", "Dos tratamentos disponiveis, quais busca para solucionar o problema de saude?", "MULTIPLE_CHOICE", List.of("Terapias medicamentosas, apenas", "Terapias holisticas associadas a medicacao", "Terapias holisticas"), true, 3, null, null)
        );

        CampaignProfileRecord parceiro = new CampaignProfileRecord();
        parceiro.profileType = "Parceiro";
        parceiro.questions = List.of(
            question("par-q1", "Qual a especialidade em que atua?", "TEXT", List.of(), true, 1, null, null),
            question("par-q2", "Voce e:", "SINGLE_CHOICE", List.of("Profissional independente", "Possui sua propria clinica", "Trabalha em clinicas como PJ ou CLT"), true, 2, null, null),
            question("par-q3", "Qual o numero aproximado de pacientes/clientes que atende?", "SINGLE_CHOICE", List.of("0-10", "10-30", "30-60", "60-100"), true, 3, null, null)
        );

        campaign.profiles.addAll(List.of(instituicao, usuario, parceiro));
        data.campaigns.add(campaign);
    }

    private CampaignQuestionRecord question(String id, String text, String type, List<String> options, boolean required, int order, String conditionalOnQuestionId, String conditionalOnAnswer) {
        CampaignQuestionRecord question = new CampaignQuestionRecord();
        question.id = id;
        question.text = text;
        question.type = type;
        question.options = options;
        question.required = required;
        question.order = order;
        question.conditionalOnQuestionId = conditionalOnQuestionId;
        question.conditionalOnAnswer = conditionalOnAnswer;
        return question;
    }

    private void ensureCollections() {
        if (data.institutions == null) data.institutions = new ArrayList<>();
        if (data.users == null) data.users = new ArrayList<>();
        if (data.sessions == null) data.sessions = new ArrayList<>();
        if (data.patients == null) data.patients = new ArrayList<>();
        if (data.assessments == null) data.assessments = new ArrayList<>();
        if (data.goals == null) data.goals = new ArrayList<>();
        if (data.roiEvents == null) data.roiEvents = new ArrayList<>();
        if (data.alerts == null) data.alerts = new ArrayList<>();
        if (data.ragSources == null) data.ragSources = new ArrayList<>();
        if (data.campaigns == null) data.campaigns = new ArrayList<>();
        if (data.registrations == null) data.registrations = new ArrayList<>();
        if (data.consents == null) data.consents = new ArrayList<>();
    }

    private void save() {
        if (hasDatabaseUrl()) {
            saveToDatabase();
            return;
        }

        try {
            Path parent = dataPath.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(dataPath.toFile(), data);
        } catch (IOException ex) {
            throw new IllegalStateException("Nao foi possivel salvar o store CareOps em " + dataPath, ex);
        }
    }

    private boolean hasDatabaseUrl() {
        return databaseUrl != null && !databaseUrl.isBlank();
    }

    private void loadFromDatabase() {
        try (Connection connection = openDatabaseConnection()) {
            ensureDatabaseTable(connection);
            try (PreparedStatement statement = connection.prepareStatement("select data from careops_store where id = ?")) {
                statement.setString(1, STORE_ID);
                try (ResultSet resultSet = statement.executeQuery()) {
                    if (resultSet.next()) {
                        data = objectMapper.readValue(resultSet.getString("data"), CareopsData.class);
                        ensureCollections();
                        if (!data.seeded) {
                            seed();
                            saveToDatabase();
                        }
                        return;
                    }
                }
            }
            seed();
            saveToDatabase();
        } catch (IOException | SQLException ex) {
            throw new IllegalStateException("Nao foi possivel carregar o store CareOps no PostgreSQL/Neon", ex);
        }
    }

    private void saveToDatabase() {
        try (Connection connection = openDatabaseConnection()) {
            ensureDatabaseTable(connection);
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(data);
            try (PreparedStatement statement = connection.prepareStatement(
                "insert into careops_store (id, data, updated_at) values (?, ?, now()) " +
                    "on conflict (id) do update set data = excluded.data, updated_at = now()"
            )) {
                statement.setString(1, STORE_ID);
                statement.setString(2, json);
                statement.executeUpdate();
            }
        } catch (IOException | SQLException ex) {
            throw new IllegalStateException("Nao foi possivel salvar o store CareOps no PostgreSQL/Neon", ex);
        }
    }

    private Connection openDatabaseConnection() throws SQLException {
        return DriverManager.getConnection(toJdbcUrl(databaseUrl));
    }

    private void ensureDatabaseTable(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate(
                "create table if not exists careops_store (" +
                    "id varchar(64) primary key, " +
                    "data text not null, " +
                    "updated_at timestamptz not null default now()" +
                ")"
            );
        }
    }

    private static String toJdbcUrl(String value) {
        String jdbcUrl = value == null ? "" : value.trim();
        if (jdbcUrl.startsWith("postgres://")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring("postgres://".length());
        } else if (jdbcUrl.startsWith("postgresql://")) {
            jdbcUrl = "jdbc:postgresql://" + jdbcUrl.substring("postgresql://".length());
        }

        // A URL do Neon pode vir com channel_binding=require. O driver JDBC usa outro nome
        // para esse parametro; remover evita falha de conexao e mantem sslmode=require.
        jdbcUrl = jdbcUrl.replaceAll("([?&])channel_binding=[^&]*&?", "$1");
        jdbcUrl = jdbcUrl.replace("?&", "?").replaceAll("[?&]$", "");
        return jdbcUrl;
    }

    private static String normalizeIdentifier(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static String normalizeCpf(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String maskCpf(String cpf) {
        String digits = normalizeCpf(cpf);
        if (digits.length() < 11) {
            return cpf == null ? "" : cpf;
        }
        return digits.substring(0, 3) + ".***.***-" + digits.substring(9);
    }

    private static String slugFromName(String name) {
        String normalized = name == null ? "paciente" : name.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .trim()
            .replaceAll("\\s+", "-");
        return normalized.isBlank() ? "paciente-" + UUID.randomUUID() : normalized;
    }

    private static String now() {
        return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return LocalDate.now().atStartOfDay();
        }
        return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
    }

    public static class CareopsData {
        public String schemaVersion = "careops-store-v1";
        public boolean seeded;
        public List<InstitutionRecord> institutions = new ArrayList<>();
        public List<UserAccountRecord> users = new ArrayList<>();
        public List<SessionRecord> sessions = new ArrayList<>();
        public List<PatientRecord> patients = new ArrayList<>();
        public List<AssessmentRecord> assessments = new ArrayList<>();
        public List<CareGoalRecord> goals = new ArrayList<>();
        public List<RoiEventRecord> roiEvents = new ArrayList<>();
        public List<AlertRecord> alerts = new ArrayList<>();
        public List<RagSourceRecord> ragSources = new ArrayList<>();
        public List<CampaignRecord> campaigns = new ArrayList<>();
        public List<RegistrationRecord> registrations = new ArrayList<>();
        public List<ConsentRecord> consents = new ArrayList<>();
    }

    public static class InstitutionRecord {
        public String id;
        public String name;
        public String code;
        public boolean active;

        public static InstitutionRecord copy(InstitutionRecord source) {
            InstitutionRecord copy = new InstitutionRecord();
            copy.id = source.id;
            copy.name = source.name;
            copy.code = source.code;
            copy.active = source.active;
            return copy;
        }
    }

    public static class UserAccountRecord {
        public String id;
        public String institutionId;
        public String role;
        public String identifier;
        public String passwordHash;
        public String name;
        public String displayRole;
        public List<String> permissions = new ArrayList<>();
        public boolean firstAccessCompleted;
        public String createdAt;
        public String updatedAt;

        public static UserAccountRecord copy(UserAccountRecord source) {
            UserAccountRecord copy = new UserAccountRecord();
            copy.id = source.id;
            copy.institutionId = source.institutionId;
            copy.role = source.role;
            copy.identifier = source.identifier;
            copy.passwordHash = source.passwordHash;
            copy.name = source.name;
            copy.displayRole = source.displayRole;
            copy.permissions = new ArrayList<>(source.permissions);
            copy.firstAccessCompleted = source.firstAccessCompleted;
            copy.createdAt = source.createdAt;
            copy.updatedAt = source.updatedAt;
            return copy;
        }
    }

    public static class SessionRecord {
        public String id;
        public String token;
        public String userId;
        public String institutionId;
        public String role;
        public String createdAt;
        public String expiresAt;
        public boolean revoked;

        public static SessionRecord copy(SessionRecord source) {
            SessionRecord copy = new SessionRecord();
            copy.id = source.id;
            copy.token = source.token;
            copy.userId = source.userId;
            copy.institutionId = source.institutionId;
            copy.role = source.role;
            copy.createdAt = source.createdAt;
            copy.expiresAt = source.expiresAt;
            copy.revoked = source.revoked;
            return copy;
        }
    }

    public static class PatientRecord {
        public String id;
        public String institutionId;
        public String name;
        public String cpf;
        public String cpfMasked;
        public String email;
        public String phone;
        public String birthDate;
        public String sex;
        public String professional;
        public String assignedProfessionalId;
        public String status;
        public String signal;
        public int currentScore;
        public int currentRiskPercent;
        public String currentRiskLevel;
        public boolean active;
        public String invitationCode;
        public String consentVersion;
        public String consentAcceptedAt;
        public String createdAt;
        public String updatedAt;
        public String lastResponseAt;

        int statusPriority() {
            return switch (status == null ? "" : status) {
                case "Em Alerta" -> 0;
                case "Pendente" -> 1;
                case "Monitorado" -> 2;
                case "Ativo" -> 3;
                case "Inativo" -> 4;
                default -> 5;
            };
        }

        public static PatientRecord copy(PatientRecord source) {
            PatientRecord copy = new PatientRecord();
            copy.id = source.id;
            copy.institutionId = source.institutionId;
            copy.name = source.name;
            copy.cpf = source.cpf;
            copy.cpfMasked = source.cpfMasked;
            copy.email = source.email;
            copy.phone = source.phone;
            copy.birthDate = source.birthDate;
            copy.sex = source.sex;
            copy.professional = source.professional;
            copy.assignedProfessionalId = source.assignedProfessionalId;
            copy.status = source.status;
            copy.signal = source.signal;
            copy.currentScore = source.currentScore;
            copy.currentRiskPercent = source.currentRiskPercent;
            copy.currentRiskLevel = source.currentRiskLevel;
            copy.active = source.active;
            copy.invitationCode = source.invitationCode;
            copy.consentVersion = source.consentVersion;
            copy.consentAcceptedAt = source.consentAcceptedAt;
            copy.createdAt = source.createdAt;
            copy.updatedAt = source.updatedAt;
            copy.lastResponseAt = source.lastResponseAt;
            return copy;
        }
    }

    public static class AssessmentRecord {
        public String id;
        public String patientId;
        public String institutionId;
        public Map<String, String> answers = new LinkedHashMap<>();
        public int score;
        public int riskPercent;
        public String riskLevel;
        public String riskTone;
        public List<SignalRecord> signals = new ArrayList<>();
        public List<String> sourceIds = new ArrayList<>();
        public String rulesVersion;
        public String questionVersion;
        public String createdAt;

        public static AssessmentRecord copy(AssessmentRecord source) {
            AssessmentRecord copy = new AssessmentRecord();
            copy.id = source.id;
            copy.patientId = source.patientId;
            copy.institutionId = source.institutionId;
            copy.answers = new LinkedHashMap<>(source.answers);
            copy.score = source.score;
            copy.riskPercent = source.riskPercent;
            copy.riskLevel = source.riskLevel;
            copy.riskTone = source.riskTone;
            copy.signals = source.signals.stream().map(SignalRecord::copy).toList();
            copy.sourceIds = new ArrayList<>(source.sourceIds);
            copy.rulesVersion = source.rulesVersion;
            copy.questionVersion = source.questionVersion;
            copy.createdAt = source.createdAt;
            return copy;
        }
    }

    public static class SignalRecord {
        public String label;
        public String evidence;
        public String action;
        public String tone;
        public List<String> sourceIds = new ArrayList<>();

        public static SignalRecord copy(SignalRecord source) {
            SignalRecord copy = new SignalRecord();
            copy.label = source.label;
            copy.evidence = source.evidence;
            copy.action = source.action;
            copy.tone = source.tone;
            copy.sourceIds = new ArrayList<>(source.sourceIds);
            return copy;
        }
    }

    public static class IntelligenceSnapshot {
        public int score;
        public int riskPercent;
        public String riskLevel;
        public String riskTone;
        public String rulesVersion;
        public List<SignalRecord> signals = new ArrayList<>();
        public List<String> sourceIds = new ArrayList<>();

        public String primarySignal() {
            return signals.isEmpty() ? "Sem sinal critico evidente" : signals.get(0).label;
        }
    }

    public static class CareGoalRecord {
        public String id;
        public String patientId;
        public String institutionId;
        public String title;
        public String frequency;
        public String status;
        public String createdBy;
        public String createdAt;
        public String updatedAt;
        public String completedAt;

        public static CareGoalRecord copy(CareGoalRecord source) {
            CareGoalRecord copy = new CareGoalRecord();
            copy.id = source.id;
            copy.patientId = source.patientId;
            copy.institutionId = source.institutionId;
            copy.title = source.title;
            copy.frequency = source.frequency;
            copy.status = source.status;
            copy.createdBy = source.createdBy;
            copy.createdAt = source.createdAt;
            copy.updatedAt = source.updatedAt;
            copy.completedAt = source.completedAt;
            return copy;
        }
    }

    public static class RoiEventRecord {
        public String id;
        public String patientId;
        public String institutionId;
        public String title;
        public BigDecimal value = BigDecimal.ZERO;
        public String category;
        public String justification;
        public String createdBy;
        public String createdAt;

        public static RoiEventRecord copy(RoiEventRecord source) {
            RoiEventRecord copy = new RoiEventRecord();
            copy.id = source.id;
            copy.patientId = source.patientId;
            copy.institutionId = source.institutionId;
            copy.title = source.title;
            copy.value = source.value;
            copy.category = source.category;
            copy.justification = source.justification;
            copy.createdBy = source.createdBy;
            copy.createdAt = source.createdAt;
            return copy;
        }
    }

    public static class AlertRecord {
        public String id;
        public String patientId;
        public String institutionId;
        public String tone;
        public String message;
        public String source;
        public String status;
        public int priority;
        public String createdAt;
        public String updatedAt;
        public String resolvedAt;

        public static AlertRecord copy(AlertRecord source) {
            AlertRecord copy = new AlertRecord();
            copy.id = source.id;
            copy.patientId = source.patientId;
            copy.institutionId = source.institutionId;
            copy.tone = source.tone;
            copy.message = source.message;
            copy.source = source.source;
            copy.status = source.status;
            copy.priority = source.priority;
            copy.createdAt = source.createdAt;
            copy.updatedAt = source.updatedAt;
            copy.resolvedAt = source.resolvedAt;
            return copy;
        }
    }

    public record RagSourceRecord(String id, String title, String scope, String version, String approvedBy, String approvedAt, String domain) {
        public static RagSourceRecord copy(RagSourceRecord source) {
            return new RagSourceRecord(source.id, source.title, source.scope, source.version, source.approvedBy, source.approvedAt, source.domain);
        }
    }

    public static class CampaignRecord {
        public String id;
        public String name;
        public String slug;
        public String description;
        public String confirmationMessage;
        public boolean active;
        public List<CampaignProfileRecord> profiles = new ArrayList<>();
        public String createdAt;

        public static CampaignRecord copy(CampaignRecord source) {
            CampaignRecord copy = new CampaignRecord();
            copy.id = source.id;
            copy.name = source.name;
            copy.slug = source.slug;
            copy.description = source.description;
            copy.confirmationMessage = source.confirmationMessage;
            copy.active = source.active;
            copy.profiles = source.profiles.stream().map(CampaignProfileRecord::copy).toList();
            copy.createdAt = source.createdAt;
            return copy;
        }
    }

    public static class CampaignProfileRecord {
        public String profileType;
        public List<CampaignQuestionRecord> questions = new ArrayList<>();

        public static CampaignProfileRecord copy(CampaignProfileRecord source) {
            CampaignProfileRecord copy = new CampaignProfileRecord();
            copy.profileType = source.profileType;
            copy.questions = source.questions.stream().map(CampaignQuestionRecord::copy).toList();
            return copy;
        }
    }

    public static class CampaignQuestionRecord {
        public String id;
        public String text;
        public String type;
        public List<String> options = new ArrayList<>();
        public boolean required;
        public int order;
        public String conditionalOnQuestionId;
        public String conditionalOnAnswer;

        public static CampaignQuestionRecord copy(CampaignQuestionRecord source) {
            CampaignQuestionRecord copy = new CampaignQuestionRecord();
            copy.id = source.id;
            copy.text = source.text;
            copy.type = source.type;
            copy.options = new ArrayList<>(source.options);
            copy.required = source.required;
            copy.order = source.order;
            copy.conditionalOnQuestionId = source.conditionalOnQuestionId;
            copy.conditionalOnAnswer = source.conditionalOnAnswer;
            return copy;
        }
    }

    public static class RegistrationRecord {
        public String id;
        public String campaignId;
        public String profileType;
        public String name;
        public String email;
        public String phone;
        public Map<String, String> profileFields = new LinkedHashMap<>();
        public List<AnswerEntryRecord> answers = new ArrayList<>();
        public boolean wantsNewsletter;
        public String createdAt;
        public String completedAt;

        public static RegistrationRecord copy(RegistrationRecord source) {
            RegistrationRecord copy = new RegistrationRecord();
            copy.id = source.id;
            copy.campaignId = source.campaignId;
            copy.profileType = source.profileType;
            copy.name = source.name;
            copy.email = source.email;
            copy.phone = source.phone;
            copy.profileFields = new LinkedHashMap<>(source.profileFields);
            copy.answers = source.answers.stream().map(AnswerEntryRecord::copy).toList();
            copy.wantsNewsletter = source.wantsNewsletter;
            copy.createdAt = source.createdAt;
            copy.completedAt = source.completedAt;
            return copy;
        }
    }

    public static class AnswerEntryRecord {
        public String questionId;
        public String value;

        public static AnswerEntryRecord copy(AnswerEntryRecord source) {
            AnswerEntryRecord copy = new AnswerEntryRecord();
            copy.questionId = source.questionId;
            copy.value = source.value;
            return copy;
        }
    }

    public static class ConsentRecord {
        public String id;
        public String patientId;
        public String institutionId;
        public String source;
        public String version;
        public String acceptedAt;
    }
}
