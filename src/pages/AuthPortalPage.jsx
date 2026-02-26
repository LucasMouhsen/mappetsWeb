import { useState } from "react";

function AuthPortalPage({ adminAuth, onAdminLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsError(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setFeedback("Completa correo y contrasena para continuar.");
      setIsError(true);
      return;
    }

    setSubmitting(true);
    try {
      await onAdminLogin({ email: normalizedEmail, password });
      setFeedback("Sesion iniciada correctamente.");
      setIsError(false);
    } catch (error) {
      setFeedback(error.message || "No se pudo iniciar sesion.");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero">
        <small>Panel administrativo</small>
        <h1>Acceso de soporte</h1>
        <p>Inicia sesion para gestionar reportes y comercios desde el panel admin.</p>
        {adminAuth?.token ? (
          <p className="muted">
            Ya hay una sesion admin activa. Puedes volver a iniciar sesion con otra cuenta si lo
            necesitas.
          </p>
        ) : null}
      </section>

      <section className="request-card auth-card" aria-labelledby="auth-portal-form-title">
        <h2 id="auth-portal-form-title">Iniciar sesion administrativa</h2>
        <form className="request-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="auth-portal-email">Correo electronico</label>
            <input
              id="auth-portal-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="soporte@ejemplo.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="auth-portal-password">Contrasena</label>
            <input
              id="auth-portal-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Tu contrasena"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
          <p className={`feedback ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>
      </section>
    </>
  );
}

export default AuthPortalPage;
