function TermsPage() {
  return (
    <>
      <section className="hero">
        <small>Legales</small>
        <h1>Terminos y Condiciones de Uso</h1>
        <p>
          Estos terminos regulan el acceso y uso de la plataforma Mappets. Al crear una cuenta o
          utilizar la aplicacion, aceptas las politicas descriptas aqui y las reglas
          complementarias. Si no estas de acuerdo, debes abstenerte de usar el servicio.
        </p>
      </section>

      <section className="section" id="alcance">
        <h2>1. Alcance del servicio</h2>
        <p>
          Mappets conecta a personas interesadas en el cuidado y la proteccion de animales mediante
          fichas de mascotas perdidas, encontradas, en adopcion o transito compartidas por la
          comunidad. Podemos actualizar las funcionalidades sin previo aviso para mejorar la
          experiencia o cumplir con requisitos legales.
        </p>
      </section>

      <section className="section" id="registro">
        <h2>2. Registro y cuenta</h2>
        <ul>
          <li>Debes proporcionar datos veraces y mantenerlos actualizados.</li>
          <li>
            Las credenciales son personales e intransferibles; eres responsable del uso que se haga
            de tu cuenta.
          </li>
          <li>
            Puedes solicitar la baja desde la aplicacion o escribiendo a{" "}
            <a href="mailto:equipo@mappets.com.ar">equipo@mappets.com.ar</a>.
          </li>
        </ul>
      </section>

      <section className="section" id="contenido">
        <h2>3. Contenido generado por personas usuarias</h2>
        <p>
          Garantizas que tienes derechos suficientes sobre textos e imagenes que compartas. No
          publiques contenido ilegal, ofensivo ni que vulnere derechos de terceros. Podemos moderar,
          editar o eliminar publicaciones que incumplan estas reglas o la normativa vigente.
        </p>
      </section>

      <section className="section" id="uso-aceptable">
        <h2>4. Uso aceptable</h2>
        <p>
          Esta prohibido emplear Mappets para actividades fraudulentas, enviar spam, distribuir
          software malicioso, interferir con la operacion de la plataforma o afectar la experiencia
          de otras personas. Podemos limitar funciones cuando detectemos riesgos de seguridad.
        </p>
      </section>

      <section className="section" id="terceros">
        <h2>5. Servicios y enlaces de terceros</h2>
        <p>
          Podemos ofrecer enlaces o integraciones con proveedores externos. Cada tercero define sus
          propios terminos y politicas, por lo que te recomendamos revisarlos antes de usarlos.
          Mappets no se responsabiliza por sus prestaciones.
        </p>
      </section>

      <section className="section" id="propiedad-intelectual">
        <h2>6. Propiedad intelectual</h2>
        <p>
          El software, disenos, logotipos y materiales propios de Mappets estan protegidos. Solo
          puedes utilizarlos dentro de la plataforma y de acuerdo con estos terminos.
        </p>
      </section>

      <section className="section" id="responsabilidad">
        <h2>7. Limitacion de responsabilidad</h2>
        <p>
          Mappets es un intermediario que facilita la comunicacion entre personas. No garantizamos
          resultados especificos ni asumimos responsabilidad por acuerdos celebrados fuera de la
          aplicacion. El servicio puede verse interrumpido por tareas de mantenimiento o causas
          ajenas al titular.
        </p>
      </section>

      <section className="section" id="suspension">
        <h2>8. Suspension o cierre de cuentas</h2>
        <p>
          Podemos suspender o cancelar cuentas que infrinjan estos terminos, la ley o generen
          riesgos para la comunidad. En la medida de lo posible, notificaremos el motivo y los pasos
          para regularizar la situacion.
        </p>
      </section>

      <section className="section" aria-labelledby="relacionados">
        <h2 id="relacionados">Documentos relacionados</h2>
        <div className="related">
          <a href="/privacidad">Politica de Privacidad</a>
          <a href="/aviso-legal">Aviso Legal</a>
          <span>Politica de Cookies</span>
        </div>
      </section>
    </>
  );
}

export default TermsPage;


