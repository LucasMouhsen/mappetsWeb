import { useEffect, useMemo, useState } from "react";

const navLinks = [
  { key: "inicio", label: "Inicio", href: "/" },
  { key: "donaciones", label: "Donaciones", href: "/#donaciones" },
  { key: "privacidad", label: "Politica de privacidad", href: "/privacidad" },
  { key: "terminos", label: "Terminos y condiciones", href: "/terminos" },
  { key: "aviso-legal", label: "Aviso legal", href: "/aviso-legal" },
  { key: "soporte", label: "Soporte", href: "/soporte" },
  { key: "alta-comercio", label: "Alta de comercios", href: "/alta-comercio" },
  {
    key: "solicitud-eliminacion",
    label: "Eliminar datos",
    href: "/solicitud-eliminacion"
  }
];

function SiteLayout({ current, children, auth, adminAuth, onLogout, onAdminLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hash, setHash] = useState(window.location.hash || "");
  const mobileQuery = useMemo(() => window.matchMedia("(max-width: 900px)"), []);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleLinkClick = () => {
    if (mobileQuery.matches) {
      setMenuOpen(false);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <header className="site-header">
        <div className="layout site-header-main">
          <a className="brand" href="/" aria-label="Ir al inicio">
            <img className="brand-logo" src="/logo-app.png" alt="Logo de Mappets" />
          </a>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="nav-toggle-icon" aria-hidden="true" />
          </button>
          <nav id="main-nav" aria-label="Menu principal" data-open={menuOpen}>
            <ul className="nav-list">
              {navLinks.map((link) => {
                const isHome = current === "inicio";
                const donationsActive = isHome && hash === "#donaciones";
                const isCurrent =
                  link.key === "inicio"
                    ? isHome && !donationsActive
                    : link.key === "donaciones"
                      ? donationsActive
                      : Array.isArray(link.activeKeys)
                        ? link.activeKeys.includes(current)
                        : link.key === current;
                return (
                  <li key={link.key}>
                    <a
                      className="nav-link"
                      aria-current={isCurrent ? "page" : undefined}
                      href={link.href}
                      onClick={handleLinkClick}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
      {auth?.user || adminAuth?.token ? (
        <section className="admin-strip" aria-label="Accesos de sesion">
          <div className="layout admin-strip-layout">
            <div className="auth-actions">
              <a className="button secondary auth-link" href="/mi-cuenta">
                <span aria-hidden="true">👤</span>
                <span>Mi cuenta</span>
              </a>
              {adminAuth?.token ? (
                <>
                  <a className="button secondary auth-link" href="/admin/reports">
                    <span aria-hidden="true">📊</span>
                    <span>Reportes</span>
                  </a>
                  <a className="button secondary auth-link" href="/admin/comercios">
                    <span aria-hidden="true">🏪</span>
                    <span>Comercios</span>
                  </a>
                  <a className="button secondary auth-link" href="/admin/encuestas">
                    <span aria-hidden="true">📝</span>
                    <span>Encuestas</span>
                  </a>
                  <a className="button secondary auth-link" href="/admin/refugios">
                    <span aria-hidden="true">🏡</span>
                    <span>Refugios</span>
                  </a>
                  <button type="button" className="button secondary auth-link" onClick={onAdminLogout}>
                    <span aria-hidden="true">⎋</span>
                    <span>Cerrar admin</span>
                  </button>
                </>
              ) : (
                <button type="button" className="button secondary auth-link" onClick={onLogout}>
                  <span aria-hidden="true">⎋</span>
                  <span>Cerrar sesion</span>
                </button>
              )}
            </div>
          </div>
        </section>
      ) : null}
      <main id="main-content" className="page-main">
        {children}
      </main>
      <footer>
        <div className="layout">
          <p>© 2026 Mappets. Cuidando a quienes nos cuidan.</p>
          <div className="footer-links">
            <a href="/#donaciones">Donaciones</a>
            <a href="/privacidad">Politica de privacidad</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default SiteLayout;


