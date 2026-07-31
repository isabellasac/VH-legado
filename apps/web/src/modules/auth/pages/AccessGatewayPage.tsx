import { ChevronRight, Stethoscope, HeartPulse, Handshake } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "../../../shared/components/BrandLogo";
import HeroImage from "../../../assets/gateway-hero.png";

export function AccessGatewayPage() {
  return (
    <main className="gateway-shell gateway-split-layout">
      <div className="gateway-hero-section">
        <img src={HeroImage} alt="CareOps Background" className="gateway-hero-image" />
      </div>

      <section className="gateway-content-section">
        <header className="gateway-header">
          <div className="gateway-brand-row">
            <BrandLogo large subtitle="Plataforma de monitoramento clínico e cuidado contínuo" />
          </div>

          <div className="gateway-copy">
            <span className="eyebrow">Entradas do sistema</span>
            <h1>Escolha como deseja acessar</h1>
            <p>
              Cada perfil possui uma entrada própria, com fluxo, permissões e experiência adequados ao uso no dia a dia.
            </p>
          </div>
        </header>

        <div className="gateway-grid gateway-grid-stacked">
          <article className="gateway-option">
            <div className="gateway-option-icon">
              <Stethoscope size={24} />
            </div>
            <div className="gateway-option-copy">
              <span className="gateway-option-kicker">Gestão</span>
              <h2>Clínica e profissionais</h2>
              <p>Dashboard, lista de pacientes, prontuário integrado, acompanhamento e indicadores de ROI.</p>
            </div>
            <Link className="primary-button gateway-button" to="/gestao/login">
              Entrar na gestão
              <ChevronRight size={16} />
            </Link>
          </article>

          <article className="gateway-option">
            <div className="gateway-option-icon gateway-option-icon-patient">
              <HeartPulse size={24} />
            </div>
            <div className="gateway-option-copy">
              <span className="gateway-option-kicker">Paciente</span>
              <h2>Área do paciente</h2>
              <p>Score de saúde, metas do dia, avaliação periódica e visão simples do próprio acompanhamento.</p>
            </div>
            <Link className="primary-button gateway-button" to="/paciente/login">
              Entrar como paciente
              <ChevronRight size={16} />
            </Link>
          </article>

          <article className="gateway-option gateway-option-partner">
            <div className="gateway-option-icon gateway-option-icon-partner">
              <Handshake size={24} />
            </div>
            <div className="gateway-option-copy">
              <span className="gateway-option-kicker">Parceiros</span>
              <h2>Profissionais e terapeutas</h2>
              <p>Cadastro simples, primeiro acesso protegido e visão inicial do vínculo com a VH.</p>
            </div>
            <Link className="primary-button gateway-button" to="/parceiro/login">
              Entrar como parceiro
              <ChevronRight size={16} />
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
