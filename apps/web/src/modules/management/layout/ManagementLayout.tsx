import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../../../app/providers/AuthContext";
import { BrandLogo } from "../../../shared/components/BrandLogo";

const navItems = [
  { to: "/gestao/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/gestao/pacientes", label: "Pacientes", icon: Users },
  { to: "/gestao/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/gestao/prontuarios", label: "Prontuários", icon: Activity, disabled: true },
  { to: "/gestao/configuracoes", label: "Configurações", icon: Settings, disabled: true },
];

export function ManagementLayout() {
  const { session, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.replace("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="management-app-shell">
      <header className="management-global-header">
        <div className="management-global-left">
          <button
            className="icon-button mobile-menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? "Fechar navegação" : "Abrir navegação"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <BrandLogo compact subtitle="" />
        </div>

        <div className="management-global-right">
          <div className="header-clinic-pill">
            <Shield size={18} />
            <span>Clínica Vida &amp; Saúde</span>
          </div>

          <div className="header-user-card">
            <div className="header-user-avatar">DR</div>
            <div>
              <strong>{session?.name}</strong>
              <span>Administrador</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <div className="management-shell">
        <aside className={`management-sidebar${mobileMenuOpen ? " management-sidebar-open" : ""}`}>
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " sidebar-link-active" : ""}${item.disabled ? " sidebar-link-disabled" : ""}`
                }
                onClick={(event) => {
                  if (item.disabled) {
                    event.preventDefault();
                  } else {
                    closeMobileMenu();
                  }
                }}
                to={item.to}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-support-card">
            <BadgeCheck size={18} />
            <div>
              <strong>Ajuda e suporte</strong>
              <span>Canal da operação clínica</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={handleLogout} type="button">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </aside>

        <div className="management-content">
          <div className="management-page">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
