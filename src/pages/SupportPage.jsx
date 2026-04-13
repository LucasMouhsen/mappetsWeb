import { useState } from "react";

const endpoint = "https://formsubmit.co/ajax/equipo@mappets.com.ar";

function SupportPage() {
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    nombre: "",
    email: "",
    motivo: "Consulta general",
    ios: "",
    app: "",
    dispositivo: "",
    mensaje: ""
  });

  const onFieldChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const email = formValues.email.trim();
    const message = formValues.mensaje.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { ok: false, message: "Ingresa un correo valido para continuar." };
    }
    if (!message) {
      return { ok: false, message: "Cuentanos brevemente tu consulta." };
    }
    return { ok: true };
  };

  const resetForm = () => {
    setFormValues({
      nombre: "",
      email: "",
      motivo: "Consulta general",
      ios: "",
      app: "",
      dispositivo: "",
      mensaje: ""
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsError(false);
    const validation = validate();
    if (!validation.ok) {
      setFeedback(validation.message);
      setIsError(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        _subject: "Consulta de soporte - Mappets (iOS)",
        nombre: formValues.nombre.trim(),
        email: formValues.email.trim(),
        motivo: formValues.motivo,
        ios_version: formValues.ios.trim(),
        app_version: formValues.app.trim(),
        device: formValues.dispositivo.trim(),
        message: formValues.mensaje.trim()
      };

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

      setFeedback("Consulta enviada. Te responderemos por correo.");
      setIsError(false);
      resetForm();
      setModalOpen(true);
    } catch (error) {
      setFeedback("No pudimos enviar el formulario. Escribenos a equipo@mappets.com.ar.");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero hero--compact">
        <small>Soporte de Mappets</small>
        <h1>Centro de ayuda y contacto</h1>
        <p>
          Necesitas ayuda con la app? Encuentra respuestas rapidas y contactanos. Respondemos dentro
          de 1 a 3 dias habiles (Lun-Vie, 9-18 h AR).
        </p>
      </section>

      <section className="grid" aria-label="Opciones de contacto">
        <article className="card">
          <h2>Escribenos por correo</h2>
          <p>Envia tu consulta a nuestro equipo de soporte.</p>
          <div className="support-actions">
            <a
              className="button"
              href="mailto:equipo@mappets.com.ar?subject=Soporte%20Mappets%20(iOS)&body=Contanos%20tu%20consulta%3A%0A-%20Describi%20el%20problema%3A%0A-%20Version%20de%20iOS%3A%0A-%20Version%20de%20la%20app%3A%0A-%20Capturas%20(opcional)%3A%0A"
            >
              Abrir correo
            </a>
            <a className="button secondary" href="#contacto">
              Usar formulario
            </a>
          </div>
          <p className="note">
            Correo de soporte: <strong>equipo@mappets.com.ar</strong>
          </p>
        </article>

        <article className="card" aria-labelledby="faq-title">
          <h2 id="faq-title">Preguntas frecuentes</h2>
          <details className="faq">
            <summary>No recibo el correo de verificacion</summary>
            <p>
              Revisa la carpeta de spam o promociones. Si no aparece en 10 minutos, intenta
              reenviar desde la app. Si persiste, escribenos incluyendo tu correo registrado.
            </p>
          </details>
          <details className="faq">
            <summary>La app no se abre o se cierra</summary>
            <p>
              Actualiza a la ultima version disponible en App Store y reinicia tu iPhone. Si
              continua, indicanos tu modelo de dispositivo, version de iOS y los pasos para
              reproducir el problema.
            </p>
          </details>
          <details className="faq">
            <summary>Quiero eliminar mis datos</summary>
            <p>
              Puedes solicitarlo desde <a href="/solicitud-eliminacion">Eliminar datos</a>.
              Procesamos tu solicitud conforme a nuestra{" "}
              <a href="/privacidad">Politica de privacidad</a>.
            </p>
          </details>
          <details className="faq">
            <summary>Como reporto un error</summary>
            <p>
              Desde el formulario de soporte, elige &quot;Reporte de bug&quot; e incluye capturas y
              el horario aproximado en que ocurrio.
            </p>
          </details>
        </article>
      </section>

      <section
        id="contacto"
        className="request-card request-card--support"
        aria-labelledby="contacto-titulo"
      >
        <h2 id="contacto-titulo">Formulario de contacto</h2>
        <p>
          Completa el formulario para que podamos ayudarte. Guardamos tu informacion solo para
          gestionar tu consulta.
        </p>
        <form className="request-form" onSubmit={onSubmit} noValidate>
          <div className="row">
            <div className="input-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                placeholder="Tu nombre"
                autoComplete="name"
                value={formValues.nombre}
                onChange={onFieldChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">Correo electronico</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                autoComplete="email"
                inputMode="email"
                required
                value={formValues.email}
                onChange={onFieldChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="input-group">
              <label htmlFor="motivo">Motivo</label>
              <select id="motivo" name="motivo" value={formValues.motivo} onChange={onFieldChange}>
                <option>Consulta general</option>
                <option>Problema tecnico</option>
                <option>Reporte de bug</option>
                <option>Donacion</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="ios">Version de iOS (opcional)</label>
              <input
                id="ios"
                name="ios"
                type="text"
                placeholder="Ej: iOS 18.0"
                autoComplete="off"
                value={formValues.ios}
                onChange={onFieldChange}
              />
            </div>
          </div>
          <div className="row">
            <div className="input-group">
              <label htmlFor="app">Version de la app (opcional)</label>
              <input
                id="app"
                name="app"
                type="text"
                placeholder="Ej: 1.0.0"
                autoComplete="off"
                value={formValues.app}
                onChange={onFieldChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="dispositivo">Dispositivo (opcional)</label>
              <input
                id="dispositivo"
                name="dispositivo"
                type="text"
                placeholder="Ej: iPhone 13"
                autoComplete="off"
                value={formValues.dispositivo}
                onChange={onFieldChange}
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              name="mensaje"
              placeholder="Describe tu consulta o problema con el mayor detalle posible"
              required
              value={formValues.mensaje}
              onChange={onFieldChange}
            />
          </div>
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar consulta"}
          </button>
          <p
            className={`feedback ${isError ? "error" : ""}`}
            id="form-feedback"
            role="status"
            aria-live="polite"
          >
            {feedback}
          </p>
        </form>
        <div className="note">
          <p>
            Tiempo de respuesta estimado: 1 a 3 dias habiles. Si tienes urgencia, escribe directo a{" "}
            <strong>equipo@mappets.com.ar</strong>.
          </p>
          <p>
            Consulta nuestra <a href="/privacidad">Politica de privacidad</a>. Para eliminacion
            de datos, visita <a href="/solicitud-eliminacion">esta pagina</a>.
          </p>
        </div>
      </section>

      <div
        id="success-modal"
        className="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-description"
        hidden={!modalOpen}
        onClick={(event) => {
          if (event.target.id === "success-modal") {
            setModalOpen(false);
          }
        }}
      >
        <div className="modal">
          <header>
            <h3 id="success-title">Consulta enviada</h3>
          </header>
          <div className="content">
            <p id="success-description">
              Gracias por escribirnos. Recibimos tu mensaje y te responderemos por correo dentro de
              1 a 3 dias habiles.
            </p>
          </div>
          <div className="actions">
            <button type="button" className="button" onClick={() => setModalOpen(false)}>
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SupportPage;


