import { CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { BrandLogo } from "../../../../shared/components/BrandLogo";

export function CampaignCompletionPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <main className="campaign-complete-shell">
      <section className="campaign-complete-card">
        <div className="gateway-brand-row" style={{ marginBottom: 24 }}>
          <BrandLogo subtitle="Pesquisa de saúde e bem-estar" />
        </div>

        <div className="campaign-success-icon">
          <CheckCircle2 size={40} />
        </div>

        <h1>Cadastro realizado com sucesso!</h1>
        <p>
          Obrigado por participar. Sua contribuição é muito importante para nós.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link className="primary-button" to="/" style={{ justifyContent: "center" }}>
            Acessar a plataforma
          </Link>
          <Link
            className="secondary-button secondary-button-link"
            to={`/campanha/${slug}`}
            style={{ justifyContent: "center" }}
          >
            Voltar para a campanha
          </Link>
        </div>
      </section>
    </main>
  );
}
