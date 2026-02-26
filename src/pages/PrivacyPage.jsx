function PrivacyPage() {
  return (
    <>
      <section className="hero">
        <small>Proteccion de datos</small>
        <h1>Politica de Privacidad</h1>
        <p>
          Esta politica describe como tratamos los datos personales cuando usas Mappets.
          Trabajamos con transparencia, aplicamos controles de seguridad acordes al riesgo y te
          avisaremos si realizamos cambios sustanciales.
        </p>
        <p className="muted">Fecha de entrada en vigor: 15 de octubre de 2026.</p>
      </section>

      <section className="section" id="datos" aria-labelledby="datos-titulo">
        <h2 id="datos-titulo">Datos que recopilamos</h2>
        <ul>
          <li>
            <strong>Identificacion y contacto:</strong> nombre, apellido, correo electronico,
            telefono y contrasena cifrada.
          </li>
          <li>
            <strong>Perfil:</strong> fotografia opcional, descripcion breve y preferencias para
            notificaciones.
          </li>
          <li>
            <strong>Informacion de mascotas:</strong> nombre, descripciones, estado, fotos y zona
            aproximada asociada a tus fichas o publicaciones.
          </li>
          <li>
            <strong>Datos tecnicos:</strong> idioma del dispositivo, version del sistema, direccion
            IP, identificadores de sesion y registros necesarios para detectar abusos.
          </li>
          <li>
            <strong>Ubicacion aproximada:</strong> solo cuando la autorizas, para sugerirte
            resultados cercanos y facilitar reencuentros.
          </li>
        </ul>
      </section>

      <section className="section" id="uso" aria-labelledby="uso-titulo">
        <h2 id="uso-titulo">Para que usamos los datos</h2>
        <ol>
          <li>Crear y mantener tu cuenta, responder consultas y personalizar la experiencia.</li>
          <li>
            Publicar fichas de mascotas perdidas, encontradas, en adopcion o transito y gestionar
            esas publicaciones dentro de la comunidad.
          </li>
          <li>
            Mejorar la plataforma con metricas agregadas y comentarios, procurando anonimizar la
            informacion cuando sea posible.
          </li>
          <li>Prevenir abusos, investigar reportes y cumplir obligaciones regulatorias vigentes.</li>
        </ol>
      </section>

      <section className="section" id="base-legal" aria-labelledby="base-titulo">
        <h2 id="base-titulo">Base legal y conservacion</h2>
        <p>
          Procesamos los datos con base en tu consentimiento informado, la ejecucion del contrato
          de uso de Mappets y nuestro interes legitimo en mantener la seguridad del servicio.
          Cuando una norma exige conservar informacion, actuamos segun esa obligacion legal.
        </p>
        <ul>
          <li>Guardamos tu cuenta mientras siga activa o hasta que solicites su eliminacion.</li>
          <li>
            Las publicaciones y mensajes se conservan hasta que los borres o hasta 24 meses despues
            de cerrar la cuenta, salvo obligaciones legales.
          </li>
          <li>Los registros tecnicos se anonimizaran o eliminaran una vez cumplida su finalidad.</li>
        </ul>
      </section>

      <section className="section" id="compartir" aria-labelledby="compartir-titulo">
        <h2 id="compartir-titulo">Comparticion de datos</h2>
        <ul>
          <li>
            <strong>Personas usuarias registradas:</strong> acceden a la informacion que decides
            hacer publica en cada ficha o publicacion.
          </li>
          <li>
            <strong>Proveedores tecnologicos:</strong> alojan datos, envian correos y notifican
            eventos criticos bajo acuerdos de confidencialidad.
          </li>
          <li>
            <strong>Autoridades competentes:</strong> solo ante requisitorias validas o situaciones
            vinculadas al bienestar de personas o animales.
          </li>
        </ul>
        <p>No vendemos tus datos ni realizamos publicidad basada en perfiles.</p>
      </section>

      <section className="section" id="derechos" aria-labelledby="derechos-titulo">
        <h2 id="derechos-titulo">Tus derechos</h2>
        <p>
          Podes solicitar acceso, rectificacion, actualizacion, portabilidad, oposicion, limitacion
          o supresion de tu informacion. Tambien podes revocar el consentimiento sin afectar la
          licitud de los tratamientos previos.
        </p>
        <div className="card-inline">
          <p className="muted">
            Para ejercer tus derechos escribe a{" "}
            <a href="mailto:equipo@mappets.com.ar">equipo@mappets.com.ar</a> indicando nombre
            completo, correo registrado y el pedido concreto. Respondemos dentro de 30 dias habiles
            segun la normativa argentina.
          </p>
        </div>
      </section>

      <section className="section" id="seguridad" aria-labelledby="seguridad-titulo">
        <h2 id="seguridad-titulo">Seguridad y menores</h2>
        <p>
          Aplicamos controles tecnicos y organizativos, limitamos el acceso interno y revisamos
          posibles incidentes. Ninguna plataforma digital es infalible, por lo que notificaremos
          con celeridad cualquier incidente relevante.
        </p>
        <p>
          Mappets esta dirigida a personas mayores de 14 anos. Si detectamos datos de menores sin
          autorizacion, los eliminaremos.
        </p>
      </section>

      <section className="section" id="ubicacion" aria-labelledby="ubicacion-titulo">
        <h2 id="ubicacion-titulo">Ubicacion en segundo plano (solo alertas cercanas)</h2>
        <p>
          Mappets utiliza la ubicacion en segundo plano unicamente para enviarte notificaciones
          cuando hay mascotas perdidas cerca de ti, incluso si la app esta cerrada. No realizamos
          seguimiento continuo para otros fines, no construimos historiales de movimiento ni
          vendemos esta informacion.
        </p>
        <ul>
          <li>
            <strong>Control:</strong> podes activar o desactivar estas alertas desde el perfil o
            los ajustes del sistema en cualquier momento.
          </li>
          <li>
            <strong>iOS:</strong> requiere la opcion &quot;Siempre&quot; para funcionar en segundo
            plano. Si eliges &quot;Al usar la app&quot;, el mapa funcionara igual pero no recibiras
            alertas en segundo plano.
          </li>
          <li>
            <strong>Android:</strong> requiere &quot;Permitir todo el tiempo/Segundo plano&quot;
            para poder avisarte aun con la app cerrada.
          </li>
          <li>
            <strong>Conservacion:</strong> usamos la ubicacion de forma efimera para calcular
            cercania y generar la notificacion; no almacenamos un recorrido continuo.
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="relacionados">
        <h2 id="relacionados">Documentos relacionados</h2>
        <div className="related">
          <a href="/terminos">Terminos y Condiciones</a>
          <a href="/aviso-legal">Aviso Legal</a>
          <span>Politica de Cookies</span>
        </div>
      </section>
    </>
  );
}

export default PrivacyPage;


