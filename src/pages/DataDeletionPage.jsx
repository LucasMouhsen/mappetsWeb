import { useState } from "react";

const endpoint = "https://formsubmit.co/ajax/equipo@mappets.com.ar";

function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsError(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFeedback("Ingresa tu correo electronico para continuar.");
      setIsError(true);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFeedback("Revisa el formato del correo ingresado.");
      setIsError(true);
      return;
    }

    setSubmitting(true);
    const payload = {
      _subject: "Solicitud de eliminacion de datos personales",
      email: cleanEmail,
      message: [
        "Hola equipo Mappets,",
        "",
        "Solicito la eliminacion definitiva de mis datos personales asociados a este correo.",
        "",
        "Por favor, confirmen cuando el proceso este completo.",
        "",
        "Gracias."
      ].join("\n")
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Invalid response");
      }
      setFeedback("Solicitud enviada. Te responderemos a la brevedad.");
      setEmail("");
    } catch {
      setFeedback("No pudimos enviar la solicitud. Escribenos a equipo@mappets.com.ar.");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero">
        <small>Proteccion de datos</small>
        <h1>Solicita la eliminacion de tu informacion personal</h1>
        <p>
          Completa tu correo electronico para que podamos identificar tu cuenta y confirmar la
          eliminacion dentro de un plazo maximo de 30 dias.
        </p>
      </section>
      <section className="request-card" aria-labelledby="solicitud-titulo">
        <h2 id="solicitud-titulo">Formulario de solicitud</h2>
        <p>
          Al enviar este formulario generamos un mensaje para el equipo de soporte de Mappets con tu
          pedido.
        </p>
        <form className="request-form" id="deletion-form" onSubmit={onSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="deletion-email">Correo registrado</label>
            <input
              id="deletion-email"
              name="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </button>
          <p className={`feedback ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>
        <div className="note">
          <p>
            Si el correo que registres no coincide con una cuenta activa, te pediremos informacion
            adicional para acreditar tu identidad antes de procesar la eliminacion.
          </p>
          <p className="muted">
            El envio se procesa mediante FormSubmit y recibiras un correo de confirmacion para
            completar el pedido.
          </p>
        </div>
      </section>
    </>
  );
}

export default DataDeletionPage;


