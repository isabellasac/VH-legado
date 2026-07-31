import { useEffect, useState } from "react";
import { Building2, Loader2, Stethoscope, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BrandLogo } from "../../../../shared/components/BrandLogo";
import { fetchCampaignPublic, type CampaignPublicData } from "../../services/campaignPublicApi";

const PROFILES = [
  {
    key: "INSTITUTION",
    label: "Empresa",
    icon: Building2,
    color: "var(--primary-strong)",
    bg: "rgba(16, 185, 129, 0.10)",
  },
  {
    key: "USER",
    label: "Pessoa Física",
    icon: UserRound,
    color: "var(--info)",
    bg: "rgba(63, 120, 212, 0.10)",
  },
  {
    key: "PARTNER",
    label: "Profissional e Clínica",
    icon: Stethoscope,
    color: "#8f7cff",
    bg: "rgba(143, 124, 255, 0.10)",
  },
];

export function CampaignLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [campaign, setCampaign] = useState<CampaignPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetchCampaignPublic(slug)
      .then(setCampaign)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar campanha."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <main className="cl-shell">
        <Loader2 className="campaign-spinner" size={32} />
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="cl-shell">
        <div className="empty-state empty-state-error">
          <p>{error ?? "Campanha não encontrada."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cl-shell">
      <div className="cl-content">
        <BrandLogo subtitle="" />

        <div className="cl-copy">
          <h1>{campaign.name}</h1>
          <p>Você é:</p>
        </div>

        <div className="cl-buttons">
          {PROFILES.map(({ key, label, icon: Icon, color, bg }) => (
            <Link
              key={key}
              className="cl-btn"
              to={`/campanha/${slug}/cadastro/${key}`}
            >
              <span className="cl-btn-icon" style={{ background: bg, color }}>
                <Icon size={22} />
              </span>
              <span className="cl-btn-label">{label}</span>
            </Link>
          ))}
        </div>

        <p className="cl-footer">
          Participe da pesquisa de saúde e bem-estar.
          <br />
          Leva menos de 2 minutos.
        </p>
      </div>
    </main>
  );
}
