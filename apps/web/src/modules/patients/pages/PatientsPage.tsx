import { useEffect, useMemo, useState } from "react";
import { Archive, Edit3, Eye, Search, UserPlus } from "lucide-react";

import {
  archivePatient,
  createPatient,
  fetchPatientRecord,
  fetchPatients,
  updatePatient,
  type PatientItem,
  type PatientRecord,
} from "../services/patientsApi";

type PatientFormState = {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  sex: string;
};

const emptyForm: PatientFormState = {
  name: "",
  cpf: "",
  email: "",
  phone: "",
  birthDate: "",
  sex: "",
};

export function PatientsPage() {
  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientItem | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [formState, setFormState] = useState<PatientFormState>(emptyForm);

  useEffect(() => {
    fetchPatients()
      .then(setPatients)
      .catch(() => setError("Nao foi possivel carregar a lista de pacientes."))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return patients;

    return patients.filter((patient) =>
      [patient.name, patient.status, patient.professional, patient.signal]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [patients, search]);

  const openCreateModal = () => {
    setSelectedAction("");
    setSelectedPatient(null);
    setSelectedRecord(null);
    setFormState(emptyForm);
    setIsCreateModalOpen(true);
  };

  const openEditModal = async (patient: PatientItem) => {
    setSelectedAction("");
    setSelectedPatient(patient);
    setSelectedRecord(null);
    setIsRecordLoading(true);
    setIsEditModalOpen(true);

    try {
      const record = await fetchPatientRecord(patient.id);
      setSelectedRecord(record);
      setFormState({
        name: record.patient.name,
        cpf: record.patient.cpfMasked,
        email: record.patient.email,
        phone: record.patient.phone,
        birthDate: record.patient.birthDate,
        sex: record.patient.sex,
      });
    } catch {
      setSelectedAction("Nao foi possivel carregar o cadastro completo do paciente.");
    } finally {
      setIsRecordLoading(false);
    }
  };

  const openRecordModal = async (patient: PatientItem) => {
    setSelectedAction("");
    setSelectedPatient(patient);
    setSelectedRecord(null);
    setIsRecordModalOpen(true);
    setIsRecordLoading(true);

    try {
      const record = await fetchPatientRecord(patient.id);
      setSelectedRecord(record);
    } catch {
      setSelectedAction("Nao foi possivel carregar o prontuario integrado.");
    } finally {
      setIsRecordLoading(false);
    }
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsRecordModalOpen(false);
    setSelectedRecord(null);
    setIsRecordLoading(false);
  };

  const handleFieldChange = (field: keyof PatientFormState, value: string) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const refreshPatients = async () => {
    const nextPatients = await fetchPatients();
    setPatients(nextPatients);
  };

  const handleArchive = async (patient: PatientItem) => {
    setSelectedAction("");
    try {
      const updated = await archivePatient(patient.id);
      setPatients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedAction(`Paciente ${patient.name} arquivado com status Inativo.`);
      if (selectedPatient?.id === patient.id) {
        closeModals();
      }
    } catch {
      setSelectedAction(`Nao foi possivel arquivar ${patient.name}.`);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSelectedAction("");

    try {
      if (isCreateModalOpen) {
        const created = await createPatient(formState);
        setPatients((current) => [created, ...current]);
        setSelectedAction(`Paciente ${created.name} criado com status Pendente.`);
      } else if (selectedPatient) {
        const updated = await updatePatient(selectedPatient.id, formState);
        setPatients((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSelectedAction(`Cadastro de ${updated.name} atualizado.`);
      }
      closeModals();
    } catch {
      setSelectedAction(isCreateModalOpen ? "Nao foi possivel criar o paciente." : "Nao foi possivel salvar as alteracoes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section">
      <div className="page-heading page-heading-inline">
        <div>
          <div className="page-breadcrumb">Gestao / Pacientes</div>
          <h2>Lista de pacientes</h2>
          <p>Visao central da clinica para acompanhar respostas, score e sinais de atencao.</p>
        </div>
        <button className="primary-button primary-button-inline" type="button" onClick={openCreateModal}>
          <UserPlus size={16} />
          <span>Adicionar paciente manualmente</span>
        </button>
      </div>

      <div className="toolbar toolbar-grid">
        <label className="search-field">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nome, status, profissional ou sinal clinico"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button className="secondary-button" type="button" onClick={() => void refreshPatients()}>
          Atualizar lista
        </button>
      </div>

      {selectedAction ? <div className="form-message form-message-success">{selectedAction}</div> : null}

      {isLoading ? (
        <section className="empty-state">Carregando pacientes...</section>
      ) : error ? (
        <section className="empty-state empty-state-error">{error}</section>
      ) : filteredPatients.length === 0 ? (
        <section className="empty-state">Nenhum paciente cadastrado. Comece adicionando um manualmente.</section>
      ) : (
        <div className="table-card">
          <div className="table-card-header">
            <div>
              <strong>Pacientes vinculados</strong>
              <span>{filteredPatients.length} registros ativos para monitoramento</span>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>CPF</th>
                  <th>Score atual</th>
                  <th>Status</th>
                  <th>Ultima resposta</th>
                  <th>Responsavel</th>
                  <th>Sinal clinico</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <button className="table-main table-main-button" type="button" onClick={() => void openRecordModal(patient)}>
                        <strong>{patient.name}</strong>
                        <span>Visualizar prontuario integrado</span>
                      </button>
                    </td>
                    <td>{patient.cpfMasked}</td>
                    <td>
                      <span className="table-score">{patient.score}</span>
                    </td>
                    <td>
                      <span className={`table-badge table-badge-${patient.status.toLowerCase().replaceAll(" ", "-")}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>{patient.lastResponseAt}</td>
                    <td>{patient.professional}</td>
                    <td>{patient.signal}</td>
                    <td>
                      <div className="table-actions">
                        <button className="table-action-button" type="button" onClick={() => void openRecordModal(patient)}>
                          <Eye size={15} />
                          Ver
                        </button>
                        <button className="table-action-button" type="button" onClick={() => void openEditModal(patient)}>
                          <Edit3 size={15} />
                          Editar
                        </button>
                        <button className="table-action-button table-action-button-danger" type="button" onClick={() => void handleArchive(patient)}>
                          <Archive size={15} />
                          Arquivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isCreateModalOpen || isEditModalOpen || isRecordModalOpen) ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModals}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="panel-kicker">
                  {isCreateModalOpen ? "Novo paciente" : isEditModalOpen ? "Editar cadastro" : "Prontuario integrado"}
                </span>
                <h3>
                  {isCreateModalOpen
                    ? "Adicionar paciente manualmente"
                    : isEditModalOpen
                      ? `Editar ${selectedPatient?.name ?? ""}`
                      : selectedPatient?.name ?? "Paciente"}
                </h3>
              </div>
              <button className="secondary-button" type="button" onClick={closeModals}>
                Fechar
              </button>
            </div>

            {isRecordModalOpen ? (
              <div className="modal-content">
                {isRecordLoading || !selectedRecord ? (
                  <section className="empty-state">Carregando prontuario...</section>
                ) : (
                  <div className="modal-grid">
                    <article className="modal-panel">
                      <strong>Dados principais</strong>
                      <p>CPF: {selectedRecord.patient.cpfMasked}</p>
                      <p>Status: {selectedRecord.patient.status}</p>
                      <p>Score atual: {selectedRecord.patient.score}</p>
                      <p>Ultima resposta: {selectedRecord.patient.lastResponseAt || "Sem resposta"}</p>
                      <p>Convite: {selectedRecord.patient.invitationCode}</p>
                    </article>
                    <article className="modal-panel">
                      <strong>Plano e metas</strong>
                      {selectedRecord.goals.length === 0 ? <p>Nenhuma meta registrada.</p> : null}
                      {selectedRecord.goals.slice(0, 3).map((goal) => (
                        <p key={goal.id}>{goal.title} · {goal.status}</p>
                      ))}
                    </article>
                    <article className="modal-panel">
                      <strong>ROI e alertas</strong>
                      {selectedRecord.roiEvents.slice(0, 2).map((event) => (
                        <p key={event.id}>{event.title} · R$ {event.value}</p>
                      ))}
                      {selectedRecord.alerts.slice(0, 2).map((alert) => (
                        <p key={alert.id}>{alert.message}</p>
                      ))}
                    </article>
                    <article className="modal-panel">
                      <strong>Leitura assistiva</strong>
                      <p>{selectedRecord.intelligence.title}</p>
                      <p>{selectedRecord.intelligence.summary}</p>
                    </article>
                  </div>
                )}
              </div>
            ) : (
              <form className="modal-form" onSubmit={(event) => void handleSubmit(event)}>
                <div className="modal-grid modal-grid-form">
                  <label className="field">
                    <span>Nome completo</span>
                    <input value={formState.name} onChange={(event) => handleFieldChange("name", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>CPF</span>
                    <input value={formState.cpf} onChange={(event) => handleFieldChange("cpf", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>E-mail</span>
                    <input value={formState.email} onChange={(event) => handleFieldChange("email", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input value={formState.phone} onChange={(event) => handleFieldChange("phone", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Data de nascimento</span>
                    <input type="date" value={formState.birthDate} onChange={(event) => handleFieldChange("birthDate", event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Sexo</span>
                    <input value={formState.sex} onChange={(event) => handleFieldChange("sex", event.target.value)} />
                  </label>
                </div>

                {isRecordLoading && isEditModalOpen ? <div className="form-message">Carregando cadastro completo...</div> : null}

                <div className="modal-actions">
                  <button className="secondary-button" type="button" onClick={closeModals}>
                    Cancelar
                  </button>
                  <button className="primary-button primary-button-inline" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Salvando..." : isCreateModalOpen ? "Salvar paciente" : "Salvar alteracoes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
