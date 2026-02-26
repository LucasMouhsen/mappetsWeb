function LegalNoticePage() {
  return (
    <>
      <section className="hero">
        <small>Legales</small>
        <h1>Aviso Legal</h1>
        <p>
          Este aviso identifica al responsable de Mappets y brinda la informacion exigida por la
          normativa aplicable en materia de servicios digitales y proteccion de datos personales.
        </p>
      </section>

      <section className="section" id="titular">
        <h2>Titular del servicio</h2>
        <p>
          Mappets es administrado por Lucas Diaz Mouhsen. Para comunicaciones formales, pedidos de
          autoridades o solicitudes vinculadas a la proteccion de datos, escribe a{" "}
          <a href="mailto:equipo@mappets.com.ar">equipo@mappets.com.ar</a>.
        </p>
      </section>

      <section className="section" id="propiedad">
        <h2>Propiedad intelectual</h2>
        <p>
          El software, disenos, logotipos, contenidos y demas elementos de la plataforma estan
          protegidos por derechos de propiedad intelectual. Su reproduccion, distribucion o
          modificacion sin autorizacion esta prohibida.
        </p>
      </section>

      <section className="section" id="responsabilidad">
        <h2>Responsabilidad</h2>
        <p>
          El titular vela por la seguridad y disponibilidad del servicio, pero no es responsable por
          danos derivados de un uso indebido, interrupciones provocadas por terceros o casos de
          fuerza mayor. Los acuerdos alcanzados entre personas usuarias fuera de la plataforma quedan
          bajo su exclusiva responsabilidad.
        </p>
      </section>

      <section className="section" id="reclamos">
        <h2>Reclamos y autoridades de control</h2>
        <p>
          Si consideras que se vulneraron tus derechos, puedes presentar un reclamo ante la Agencia
          de Acceso a la Informacion Publica de Argentina o la autoridad de proteccion de datos que
          corresponda a tu jurisdiccion.
        </p>
      </section>

      <section className="section" aria-labelledby="relacionados">
        <h2 id="relacionados">Documentos relacionados</h2>
        <div className="related">
          <a href="/terminos">Terminos y Condiciones</a>
          <a href="/privacidad">Politica de Privacidad</a>
          <span>Politica de Cookies</span>
        </div>
      </section>
    </>
  );
}

export default LegalNoticePage;


