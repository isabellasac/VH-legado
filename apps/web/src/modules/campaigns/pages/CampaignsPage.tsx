import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Copy,
  Eye,
  Megaphone,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  type CampaignItem,
  deleteCampaign,
  listCampaigns,
} from "../../campaigns/services/campaignsApi";

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/campanha/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const handleDelete = async (id: string) => {
    await deleteCampaign(id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Gestão</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-current">Campanhas</span>
        </div>

        <div className="page-header-row">
          <div className="page-header-copy">
            <h1>Campanhas</h1>
            <p>Crie campanhas com formulários de cadastro e questionários para cada perfil.</p>
          </div>
          <Link className="primary-button" to="/gestao/campanhas/nova">
            <Plus size={16} />
            Nova campanha
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="campaigns-loading">
          <div className="spinner" />
          <p>Carregando campanhas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="campaigns-empty">
          <Megaphone size={48} />
          <h2>Nenhuma campanha criada</h2>
          <p>Crie sua primeira campanha para começar a captar cadastros via QR code ou link direto.</p>
          <Link className="primary-button" to="/gestao/campanhas/nova">
            <Plus size={16} />
            Criar primeira campanha
          </Link>
        </div>
      ) : (
        <div className="data-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Cadastros</th>
                <th>Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                  </td>
                  <td>
                    <code className="slug-badge">/campanha/{c.slug}</code>
                  </td>
                  <td>
                    <span className={`status-badge status-${c.active ? "success" : "neutral"}`}>
                      <Power size={12} />
                      {c.active ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <strong>{c.totalRegistrations}</strong>
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        type="button"
                        title="Visualizar"
                        onClick={() => navigate(`/gestao/campanhas/${c.id}`)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title="Editar"
                        onClick={() => navigate(`/gestao/campanhas/${c.id}/editar`)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        title={copiedSlug === c.slug ? "Link copiado!" : "Copiar link"}
                        onClick={() => handleCopyLink(c.slug)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="icon-button icon-button-danger"
                        type="button"
                        title="Excluir"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
