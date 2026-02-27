function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="kicker">Comunidad para mascotas y familias</p>
        <h1>Encuentra, protege y conecta con quienes aman a los animales.</h1>
        <p className="intro">
          Mappets te ayuda a compartir alertas de mascotas perdidas, coordinar busquedas en
          tiempo real y apoyar a rescatistas con herramientas simples y colaborativas.
        </p>
        <div className="actions">
          <a className="button" href="#donaciones">
            Apoyar con una donacion
          </a>
          <a className="text-link" href="/privacidad">
            Consulta nuestras politicas de privacidad
          </a>
        </div>
      </section>

      <section className="store-downloads" aria-labelledby="descarga-app-titulo">
        <p className="kicker">Disponible ahora</p>
        <h2 id="descarga-app-titulo">Descarga Mappets en Android y iPhone</h2>
        <p className="intro">
          Ya podes instalar la app desde Google Play o App Store y sumarte a la comunidad desde tu
          celular.
        </p>
        <div className="store-buttons" role="list" aria-label="Tiendas disponibles">
          <a
            className="store-button"
            href="https://play.google.com/store/apps/details?id=com.lucasmouhsen.mappets"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Descargar Mappets en Google Play"
            role="listitem"
          >
            <img src="/badges/google-play-badge.svg" alt="Disponible en Google Play" />
          </a>
          <a
            className="store-button"
            href="https://apps.apple.com/ar/app/mappets/id6753775813"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Descargar Mappets en App Store"
            role="listitem"
          >
            <img src="/badges/app-store-badge.svg" alt="Descargar en App Store" />
          </a>
        </div>
      </section>

      <section className="highlights" aria-label="Funciones principales de Mappets">
        <article>
          <h2>Mapas en tiempo real</h2>
          <p>
            Sigue reportes recientes y organiza rutas seguras para reencontrar mascotas con sus
            familias.
          </p>
        </article>
        <article>
          <h2>Red de cuidadores</h2>
          <p>Conecta con rescatistas, hogares temporales y voluntarios dispuestos a ayudar.</p>
        </article>
        <article>
          <h2>Herramientas colaborativas</h2>
          <p>
            Comparte actualizaciones, fotos y mensajes que mantienen informada a toda la
            comunidad.
          </p>
        </article>
      </section>

      <section id="donaciones" className="hero hero--donations" aria-labelledby="donaciones-titulo">
        <p className="kicker">Apoyo a la comunidad</p>
        <h2 id="donaciones-titulo">Conocenos</h2>
        <p className="intro">Seguinos para conocernos y ayudarnos a seguir creciendo.</p>
        <div className="hero-actions">
          <a
            className="button"
            href="https://instagram.com/mappets"
            target="_blank"
            rel="noopener noreferrer"
          >
            Seguir en Instagram
          </a>
          <a
            className="button secondary"
            href="https://cafecito.app/mappets"
            target="_blank"
            rel="noopener noreferrer"
          >
            Invitarnos un Cafecito
          </a>
          <a className="text-link" href="mailto:equipo@mappets.com.ar">
            Escribir al equipo
          </a>
        </div>
      </section>

      <section className="info-grid" aria-label="Formas de apoyo a Mappets">
        <article className="card">
          <h2>Instagram</h2>
          <p>Encontranos como:</p>
          <p className="handle">@mappets</p>
          <p>Comparti nuestras publicaciones y etiqueta a quienes puedan ayudar en cada alerta.</p>
          <div className="card-actions">
            <a
              className="button secondary"
              href="https://instagram.com/mappets"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Instagram
            </a>
          </div>
        </article>
        <article className="card">
          <h2>Sobre Mappets</h2>
          <p>
            Trabajamos para que mas mascotas vuelvan a casa. Tu apoyo siguiendo y compartiendo nos
            ayuda a llegar a mas personas.
          </p>
          <p>
            Sumate comentando, guardando y difundiendo las historias de rescate de nuestra
            comunidad.
          </p>
        </article>
        <article className="card">
          <h2>Otras formas de apoyar</h2>
          <ul>
            <li>Invita a cuidadores y rescatistas a unirse a la app.</li>
            <li>Reporta cuando veas una mascota perdida para activar la red.</li>
            <li>
              Si podes, invitanos un cafecito en{" "}
              <a href="https://cafecito.app/mappets" target="_blank" rel="noopener noreferrer">
                cafecito.app/mappets
              </a>
              .
            </li>
            <li>Acerca datos de organizaciones amigas que quieran colaborar.</li>
          </ul>
        </article>
      </section>
      <section className="note">
        <p className="muted">
          iOS y Android: se abrira la app de Instagram si esta instalada; si no, se usara la
          version web.
        </p>
      </section>
    </>
  );
}

export default HomePage;


