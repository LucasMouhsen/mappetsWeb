import { useState } from "react";

function LoginPage({ auth, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (auth.user) {
    return (
      <section className="request-card auth-card" aria-labelledby="login-titulo">
        <h1 id="login-titulo">Sesion iniciada</h1>
        <p>
          Ya iniciaste sesion como <strong>{auth.user.email}</strong>.
        </p>
        <div className="actions">
          <a className="button" href="/mi-cuenta">
            Ir a mi cuenta
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
      await onLogin({ email: normalizedEmail, password });
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
        <small>Acceso</small>
        <h1>Inicia sesion en Mappets</h1>
        <p>Accede con tu correo y contrasena de la cuenta creada en la app.</p>
      </section>

      <section className="request-card auth-card" aria-labelledby="login-form-titulo">
        <h2 id="login-form-titulo">Formulario de inicio de sesion</h2>
        <form className="request-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="login-email">Correo electronico</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nombre@ejemplo.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Contrasena</label>
            <input
              id="login-password"
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

export default LoginPage;

