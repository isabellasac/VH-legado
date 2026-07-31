import type { ReactNode } from "react";
import { BrandLogo } from "../../../shared/components/BrandLogo";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  highlights,
  children,
}: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <BrandLogo inverse />

        <div className="auth-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <div className="auth-highlight-list">
          {highlights.map((item) => (
            <div className="auth-highlight-row" key={item}>
              <span className="auth-highlight-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          {children}
          <p className="auth-legal-copy">
            Ao clicar em entrar, você concorda com nossos Termos de Uso e Política de Privacidade (LGPD).
          </p>
        </div>
      </section>
    </main>
  );
}
