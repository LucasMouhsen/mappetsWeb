import { useMemo, useState } from "react";
import CommerceMap from "../components/CommerceMap";

const endpoint = "https://formsubmit.co/ajax/equipo@mappets.com.ar";

const initialState = {
  commerce_name: "",
  commerce_type: "",
  contact_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  location_google: "",
  website: "",
  instagram: "",
  facebook: "",
  description: "",
  opening_hours: "",
  latitude: "",
  longitude: "",
  policy: false
};

function toFixedCoord(value) {
  return Number(value).toFixed(7);
}

function CommerceSignupPage() {
  const [form, setForm] = useState(initialState);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const onPointSelected = (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      latitude: toFixedCoord(lat),
      longitude: toFixedCoord(lng)
    }));
  };

  const validationMessage = useMemo(() => {
    if (!form.commerce_name.trim()) return "Ingresa el nombre del comercio.";
    if (!form.commerce_type.trim()) return "Selecciona el rubro del comercio.";
    if (!form.contact_name.trim()) return "Ingresa una persona de contacto.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) {
      return "Ingresa un correo de contacto valido.";
    }
    if (!form.phone.trim()) return "Ingresa un telefono de contacto.";
    if (!form.address.trim()) return "Ingresa la direccion del comercio.";
    if (!form.description.trim()) return "Describe brevemente el comercio y sus servicios.";
    if (!form.latitude.trim() || !form.longitude.trim()) {
      return "Selecciona la ubicacion en el mapa para cargar latitud y longitud.";
    }
    if (!form.policy) return "Debes aceptar la validacion de datos para continuar.";
    return "";
  }, [form]);

  const buildMessage = () => {
    return [
      "Nueva solicitud de alta de comercio en Mappets",
      "",
      `Nombre: ${form.commerce_name}`,
      `Rubro: ${form.commerce_type}`,
      `Contacto: ${form.contact_name}`,
      `Email: ${form.email}`,
      `Telefono: ${form.phone}`,
      `WhatsApp: ${form.whatsapp}`,
      `Direccion: ${form.address}`,
      `Google Maps: ${form.location_google}`,
      `Latitud: ${form.latitude}`,
      `Longitud: ${form.longitude}`,
      `Website: ${form.website}`,
      `Instagram: ${form.instagram}`,
      `Facebook: ${form.facebook}`,
      `Horarios: ${form.opening_hours}`,
      "Imagenes: se solicitaran por correo durante la validacion.",
      "",
      "Descripcion:",
      form.description
    ].join("\n");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsError(false);

    if (validationMessage) {
      setFeedback(validationMessage);
      setIsError(true);
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append("_subject", "Solicitud de alta de comercio - Mappets");
    payload.append("form_type", "commerce_signup_request");
    payload.append("commerce_name", form.commerce_name.trim());
    payload.append("commerce_type", form.commerce_type.trim());
    payload.append("contact_name", form.contact_name.trim());
    payload.append("email", form.email.trim());
    payload.append("phone", form.phone.trim());
    payload.append("whatsapp", form.whatsapp.trim());
    payload.append("website", form.website.trim());
    payload.append("instagram", form.instagram.trim());
    payload.append("facebook", form.facebook.trim());
    payload.append("address", form.address.trim());
    payload.append("location_google", form.location_google.trim());
    payload.append("latitude", form.latitude.trim());
    payload.append("longitude", form.longitude.trim());
    payload.append("opening_hours", form.opening_hours.trim());
    payload.append("description", form.description.trim());
    payload.append("message", buildMessage());

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: payload
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || String(result?.success || "").toLowerCase() !== "true") {
        throw new Error(result?.message || "FORMSUBMIT_REJECTED");
      }

      setFeedback(
        "Solicitud enviada. El equipo revisara los datos y te contactara por correo."
      );
      setForm(initialState);
      window.alert("Solicitud enviada correctamente. Te contactaremos por correo.");
    } catch (error) {
      const externalMessage = String(error?.message || "");
      if (/needs Activation|Activate Form|actived/i.test(externalMessage)) {
        setFeedback(
          'El formulario requiere activacion en FormSubmit. Revisa el correo de equipo@mappets.com.ar y confirma "Activate Form".'
        );
      } else {
        setFeedback("No pudimos enviar la solicitud. Escribenos a equipo@mappets.com.ar.");
      }
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero" aria-labelledby="alta-comercio-titulo">
        <small>Comercios aliados</small>
        <h1 id="alta-comercio-titulo">Solicita el alta de tu comercio en Mappets</h1>
        <p>
          Si tienes una veterinaria, petshop, guarderia u otro servicio para mascotas, puedes
          postularte desde este formulario. El alta no es automatica: nuestro equipo revisa cada
          solicitud antes de activarla.
        </p>
      </section>

      <section className="request-card" aria-labelledby="formulario-comercio-titulo">
        <h2 id="formulario-comercio-titulo">Formulario de solicitud</h2>
        <p>
          Pedimos esta informacion para poder crear el comercio con los datos necesarios en el
          sistema una vez aprobado.
        </p>
        <form className="request-form" id="commerce-request-form" noValidate onSubmit={onSubmit}>
          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-name">Nombre del comercio</label>
              <input
                id="commerce-name"
                name="commerce_name"
                type="text"
                autoComplete="organization"
                placeholder="Ej: Veterinaria San Martin"
                required
                value={form.commerce_name}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-type">Rubro</label>
              <select
                id="commerce-type"
                name="commerce_type"
                required
                value={form.commerce_type}
                onChange={onChange}
              >
                <option value="">Selecciona un rubro</option>
                <option value="Veterinaria">Veterinaria</option>
                <option value="Petshop">Petshop</option>
                <option value="Peluqueria">Peluqueria</option>
                <option value="Guarderia">Guarderia</option>
                <option value="Servicios">Servicios</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="contact-name">Persona de contacto</label>
              <input
                id="contact-name"
                name="contact_name"
                type="text"
                autoComplete="name"
                placeholder="Nombre y apellido"
                required
                value={form.contact_name}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-email">Correo de contacto</label>
              <input
                id="commerce-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="equipo@tucomercio.com"
                required
                value={form.email}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-phone">Telefono</label>
              <input
                id="commerce-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Ej: +54 11 1234 5678"
                required
                value={form.phone}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-whatsapp">WhatsApp (opcional)</label>
              <input
                id="commerce-whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel-national"
                placeholder="Ej: +54 11 1234 5678"
                value={form.whatsapp}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-address">Direccion</label>
              <input
                id="commerce-address"
                name="address"
                type="text"
                autoComplete="street-address"
                placeholder="Calle, altura, localidad"
                required
                value={form.address}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-location">Link de Google Maps (opcional)</label>
              <input
                id="commerce-location"
                name="location_google"
                type="url"
                placeholder="https://maps.google.com/..."
                value={form.location_google}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-website">Sitio web (opcional)</label>
              <input
                id="commerce-website"
                name="website"
                type="url"
                placeholder="https://tucomercio.com"
                value={form.website}
                onChange={onChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-instagram">Instagram (opcional)</label>
              <input
                id="commerce-instagram"
                name="instagram"
                type="text"
                placeholder="@tucomercio"
                value={form.instagram}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-facebook">Facebook (opcional)</label>
              <input
                id="commerce-facebook"
                name="facebook"
                type="text"
                placeholder="facebook.com/tucomercio"
                value={form.facebook}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="commerce-description">Descripcion del comercio</label>
            <textarea
              id="commerce-description"
              name="description"
              placeholder="Contanos que servicios ofrecen, zona de cobertura y valor diferencial"
              required
              value={form.description}
              onChange={onChange}
            />
          </div>

          <div className="input-group">
            <label htmlFor="commerce-hours">Horarios de atencion</label>
            <textarea
              id="commerce-hours"
              name="opening_hours"
              placeholder="Ej: Lun a Vie 9:00 a 19:00 | Sab 9:00 a 13:00"
              value={form.opening_hours}
              onChange={onChange}
            />
          </div>

          <CommerceMap lat={form.latitude} lng={form.longitude} onPointSelected={onPointSelected} />

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-latitude">Latitud</label>
              <input
                id="commerce-latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                readOnly
                required
                value={form.latitude}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-longitude">Longitud</label>
              <input
                id="commerce-longitude"
                name="longitude"
                type="text"
                inputMode="decimal"
                readOnly
                required
                value={form.longitude}
              />
            </div>
          </div>

          <label className="checkline" htmlFor="commerce-policy">
            <input
              id="commerce-policy"
              name="policy"
              type="checkbox"
              checked={form.policy}
              onChange={onChange}
              required
            />
            Confirmo que la informacion enviada es real y autorizo a Mappets a contactarme para
            validar la solicitud.
          </label>

          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar solicitud de alta"}
          </button>
          <p className={`feedback ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>

        <div className="note">
          <p>
            <strong>Importante:</strong> completar este formulario no activa el comercio
            automaticamente.
          </p>
          <p>
            <strong>Costo actual:</strong> la solicitud de alta es gratuita. Este esquema puede
            cambiar en el futuro y, si sucede, lo comunicaremos previamente.
          </p>
          <ul>
            <li>Revision del equipo de Mappets.</li>
            <li>Contacto para validar datos y categoria.</li>
            <li>Alta manual en la app una vez aprobada la solicitud.</li>
            <li>
              Las imagenes del comercio (logo, banner y fotos) se solicitaran por mail durante la
              validacion.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}

export default CommerceSignupPage;


