import { useEffect } from "react";

function DonationsRedirectPage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace("/#donaciones");
    }, 600);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="hero" aria-labelledby="redirect-title">
      <small>Donaciones</small>
      <h1 id="redirect-title">Te estamos redirigiendo a Inicio</h1>
      <p>La seccion de donaciones ahora esta integrada en la pagina principal.</p>
      <div className="actions">
        <a className="button" href="/#donaciones">
          Ir a donaciones
        </a>
        <a className="text-link" href="/">
          Volver al inicio
        </a>
      </div>
    </section>
  );
}

export default DonationsRedirectPage;


