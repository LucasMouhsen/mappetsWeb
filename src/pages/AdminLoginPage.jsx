import { useState } from "react";

function AdminLoginPage({ adminAuth, onAdminLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (adminAuth?.token) {
    return (
      <section className="request-card auth-card" aria-labelledby="admin-login-on-title">
        <h1 id="admin-login-on-title">Sesion administrativa activa</h1>
        <p>Ya tienes una sesion administrativa iniciada en este navegador.</p>
        <div className="actions">
          <a className="button" href="/admin/reports">
            Ir a reportes
          </a>
        </div>
      </section>
    );
  }

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
      setFeedback(error.message || "No se pudo iniciar sesion administrativa.");
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
        <p>Inicia sesion para revisar y resolver reportes de mascotas desde el panel de Mappets.</p>
      </section>

      <section className="request-card auth-card" aria-labelledby="admin-login-form-title">
        <h2 id="admin-login-form-title">Iniciar sesion administrativa</h2>
        <form className="request-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="admin-login-email">Correo electronico</label>
            <input
              id="admin-login-email"
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
            <label htmlFor="admin-login-password">Contrasena</label>
            <input
              id="admin-login-password"
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
            {submitting ? "Ingresando..." : "Ingresar al panel"}
          </button>
          <p className={`feedback ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>
      </section>
    </>
  );
}

export default AdminLoginPage;
