import { Link } from "react-router-dom";
import { BadgeCheck, Clock3, Users } from "lucide-react";

export function PartnerHomePage() {
  return (
    <main className="partner-home">
      <div className="partner-home-container">
        <header className="partner-home-header">
          <span className="eyebrow">Área de parceiros</span>
          <h1>Cadastro simples concluído</h1>
          <p>
            Seu perfil de parceiro está pronto para uso inicial. Essa área mostra apenas o vínculo e os próximos passos da
            rede VH.
          </p>
        </header>

        <section className="partner-home-grid">
          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Status do acesso</span>
                <h3>Conta liberada</h3>
              </div>
              <BadgeCheck size={18} />
            </div>
            <p>Você já pode acessar o cadastro parceiro e acompanhar a ativação da conta.</p>
          </article>

          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Rede VH</span>
                <h3>Perfil profissional</h3>
              </div>
              <Users size={18} />
            </div>
            <p>Terapeutas, médicos e profissionais entram por aqui com acesso simples e protegido.</p>
          </article>

          <article className="panel panel-soft">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Próximo passo</span>
                <h3>Ativação do evento</h3>
              </div>
              <Clock3 size={18} />
            </div>
            <p>O cadastro institucional será ajustado para a etapa de ativação e entrada da rede.</p>
          </article>
        </section>

        <div className="partner-home-actions">
          <Link className="primary-button primary-button-inline" to="/parceiro/login">
            Voltar ao login
          </Link>
          <Link className="secondary-button secondary-button-link" to="/">
            Ver portal VH
          </Link>
        </div>
      </div>
    </main>
  );
}
