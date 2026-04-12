import { useCallback, useEffect, useMemo, useState } from "react";
import CommerceMap from "../components/CommerceMap";
import ImageEditorModal from "../components/ImageEditorModal";
import {
  createCommerceRequest,
  fetchCommerceTypes,
  normalizePhoneTo54
} from "../services/adminCommerceApi";
import {
  WEEK_DAYS,
  defaultOpeningHours,
  openingHoursLabel,
  openingHoursToPayload
} from "../utils/commerceHours";
import {
  createImageEditorSession,
  optimizeImageFile,
  renderCroppedImage,
  revokeImageEditorSession
} from "../utils/imageCrop";

const FIELD_HELPERS = {
  name: "Es el nombre que se mostrara en la app y en el mapa.",
  typeId: "Selecciona el rubro real del comercio.",
  contactName: "Necesitamos una persona responsable para validar la solicitud.",
  email: "Te escribiremos aqui si necesitamos confirmar datos o avisarte el estado.",
  phone: "Usa telefono con codigo de area. Lo normalizamos al formato +54.",
  whatsapp: "Opcional, pero ayuda si necesitamos contactarte rapido.",
  address: "Direccion visible para los usuarios.",
  locationGoogle: "Opcional. Si lo tienes, mejora la precision del acceso al local.",
  website: "Opcional. URL completa con https://",
  instagram: "Opcional. Solo el usuario, sin @ ni URL.",
  facebook: "Opcional. URL completa del perfil o pagina.",
  description: "Cuenta servicios, propuesta y diferencial del comercio.",
  openingHours: "Marca los dias abiertos y los rangos horarios tal como se publicaran.",
  latitude: "Se completa desde el mapa.",
  longitude: "Se completa desde el mapa.",
  logo: "Formato 1:1 obligatorio. Lo optimizamos antes del envio para evitar rechazos por tamano.",
  banner: "Formato horizontal 2:1. Lo comprimimos antes de subirlo, pero conviene usar una foto clara.",
  photos: "Sube al menos una foto real del local, productos o servicios. Las optimizamos antes de enviarlas."
};

const REQUIRED_FIELDS = [
  "name",
  "typeId",
  "contactName",
  "email",
  "phone",
  "address",
  "description",
  "openingHours",
  "latitude",
  "longitude",
  "logo",
  "banner",
  "photos"
];

const FORM_SECTIONS = [
  {
    id: "identity",
    step: "Paso 1",
    title: "Ficha publica",
    description: "Estos datos forman la presentacion principal del comercio dentro de Mappets.",
    requiredFields: ["name", "typeId"],
    fields: ["name", "typeId"]
  },
  {
    id: "contact",
    step: "Paso 2",
    title: "Contacto y canales",
    description: "Usamos estos datos para validar la solicitud y para que los usuarios te encuentren.",
    requiredFields: ["contactName", "email", "phone"],
    fields: ["contactName", "email", "phone", "whatsapp", "website", "instagram", "facebook"]
  },
  {
    id: "operation",
    step: "Paso 3",
    title: "Operacion del local",
    description: "Direccion, acceso y horarios tal como se mostraran luego en la app.",
    requiredFields: ["address", "description", "openingHours"],
    fields: ["address", "locationGoogle", "description", "openingHours"]
  },
  {
    id: "location",
    step: "Paso 4",
    title: "Ubicacion exacta",
    description: "Marca el punto preciso del comercio para que la llegada en mapa sea confiable.",
    requiredFields: ["latitude", "longitude"],
    fields: ["latitude", "longitude"]
  },
  {
    id: "media",
    step: "Paso 5",
    title: "Imagenes",
    description: "Sube archivos listos para revision: logo, portada y fotos reales del comercio.",
    requiredFields: ["logo", "banner", "photos"],
    fields: ["logo", "banner", "photos"]
  }
];

const HERO_CHECKLIST = [
  "Revision manual antes de publicar",
  "Horarios y ubicacion visibles para clientes",
  "Imagenes listas para moderacion"
];

const MAX_MEDIA_TOTAL_BYTES = 900 * 1024;

const MEDIA_PRESETS = {
  logo: {
    maxWidth: 800,
    maxHeight: 800,
    maxBytes: 180 * 1024,
    quality: 0.88
  },
  banner: {
    maxWidth: 1280,
    maxHeight: 640,
    maxBytes: 220 * 1024,
    quality: 0.82,
    outputType: "image/jpeg"
  },
  photos: {
    maxWidth: 1280,
    maxHeight: 1280,
    maxBytes: 240 * 1024,
    quality: 0.8,
    outputType: "image/jpeg"
  }
};

const initialState = {
  name: "",
  typeId: "",
  contactName: "",
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  locationGoogle: "",
  website: "",
  instagram: "",
  facebook: "",
  description: "",
  latitude: "",
  longitude: "",
  logo: null,
  banner: null,
  photos: []
};

function toFixedCoord(value) {
  return Number(value).toFixed(7);
}

function buildPreview(file) {
  if (!file) return "";
  return URL.createObjectURL(file);
}

function buildPreviewList(files = []) {
  return files.map((file) => ({
    key: file.__previewKey || `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file)
  }));
}

function createPreviewKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

function withPreviewKey(file) {
  file.__previewKey = file.__previewKey || createPreviewKey(file);
  return file;
}

function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || "").trim());
}

function isValidUrl(value) {
  if (!String(value || "").trim()) return true;
  try {
    const url = new URL(String(value).trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isValidInstagram(value) {
  if (!String(value || "").trim()) return true;
  return /^@?[a-zA-Z0-9._]{1,30}$/.test(String(value).trim());
}

function hasAnyOpeningHours(openingHoursPayload) {
  return Object.values(openingHoursPayload).some(Boolean);
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 KB";
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function CommerceSignupPage() {
  const [form, setForm] = useState(initialState);
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours());
  const [types, setTypes] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isOptimizingMedia, setIsOptimizingMedia] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [touched, setTouched] = useState({});
  const [imageEditor, setImageEditor] = useState(null);

  const logoPreview = useMemo(() => buildPreview(form.logo), [form.logo]);
  const bannerPreview = useMemo(() => buildPreview(form.banner), [form.banner]);
  const photosPreview = useMemo(() => buildPreviewList(form.photos), [form.photos]);
  const openingHoursPayload = useMemo(() => openingHoursToPayload(openingHours), [openingHours]);
  const mediaBytes = useMemo(
    () => [form.logo, form.banner, ...form.photos].reduce((total, file) => total + (file?.size || 0), 0),
    [form.banner, form.logo, form.photos]
  );
  const fieldErrors = useMemo(() => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Ingresa el nombre del comercio.";
    }
    if (!form.typeId) {
      errors.typeId = "Selecciona el rubro del comercio.";
    }
    if (!form.contactName.trim()) {
      errors.contactName = "Ingresa una persona de contacto.";
    }
    if (!form.email.trim()) {
      errors.email = "Ingresa un correo de contacto.";
    } else if (!isValidEmail(form.email)) {
      errors.email = "El correo no tiene un formato valido.";
    }
    if (!form.phone.trim()) {
      errors.phone = "Ingresa un telefono de contacto.";
    }
    if (form.whatsapp.trim() && !/^\+?[0-9()\-\s]{7,20}$/.test(form.whatsapp.trim())) {
      errors.whatsapp = "El WhatsApp debe tener entre 7 y 20 caracteres numericos.";
    }
    if (!form.address.trim()) {
      errors.address = "Ingresa la direccion del comercio.";
    }
    if (form.locationGoogle.trim() && !isValidUrl(form.locationGoogle)) {
      errors.locationGoogle = "El link de Google Maps debe ser una URL valida.";
    }
    if (form.website.trim() && !isValidUrl(form.website)) {
      errors.website = "El sitio web debe ser una URL valida.";
    }
    if (!isValidInstagram(form.instagram)) {
      errors.instagram = "Usa solo el usuario de Instagram, sin URL.";
    }
    if (form.facebook.trim() && !isValidUrl(form.facebook)) {
      errors.facebook = "Facebook debe ser una URL valida.";
    }
    if (!form.description.trim()) {
      errors.description = "Describe brevemente el comercio y sus servicios.";
    }
    if (!hasAnyOpeningHours(openingHoursPayload)) {
      errors.openingHours = "Selecciona al menos un dia y horario de atencion.";
    }
    if (!form.latitude.trim()) {
      errors.latitude = "Selecciona la ubicacion en el mapa.";
    }
    if (!form.longitude.trim()) {
      errors.longitude = "Selecciona la ubicacion en el mapa.";
    }
    if (!form.logo) {
      errors.logo = "Adjunta el logo del comercio.";
    }
    if (!form.banner) {
      errors.banner = "Adjunta el banner del comercio.";
    }
    if (!form.photos.length) {
      errors.photos = "Adjunta al menos una foto del comercio.";
    }
    if (mediaBytes > MAX_MEDIA_TOTAL_BYTES) {
      errors.photos = `Las imagenes pesan ${formatBytes(mediaBytes)} y el limite actual es ${formatBytes(MAX_MEDIA_TOTAL_BYTES)}. Deja menos fotos o vuelve a recortarlas.`;
    }

    return errors;
  }, [form, mediaBytes, openingHoursPayload]);
  const completedRequiredCount = useMemo(
    () => REQUIRED_FIELDS.filter((fieldName) => !fieldErrors[fieldName]).length,
    [fieldErrors]
  );
  const totalRequiredCount = 13;
  const progressPercent = useMemo(
    () => Math.round((completedRequiredCount / totalRequiredCount) * 100),
    [completedRequiredCount]
  );
  const sectionStatus = useMemo(
    () =>
      Object.fromEntries(
        FORM_SECTIONS.map((section) => {
          const completed = section.requiredFields.filter((fieldName) => !fieldErrors[fieldName]).length;
          const hasErrors = section.fields.some((fieldName) => Boolean(fieldErrors[fieldName]));
          const isComplete = completed === section.requiredFields.length && !hasErrors;

          return [
            section.id,
            {
              completed,
              total: section.requiredFields.length,
              tone: isComplete ? "complete" : hasErrors ? "attention" : "pending",
              badge: isComplete ? "Listo" : hasErrors ? "Revisar" : "En curso"
            }
          ];
        })
      ),
    [fieldErrors]
  );

  useEffect(() => {
    let active = true;
    setLoadingTypes(true);
    fetchCommerceTypes()
      .then((data) => {
        if (active) setTypes(data);
      })
      .catch(() => {
        if (active) {
          setFeedback("No pudimos cargar los rubros de comercio. Recarga la pagina.");
          setIsError(true);
        }
      })
      .finally(() => {
        if (active) setLoadingTypes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
  }, [logoPreview]);

  useEffect(() => () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
  }, [bannerPreview]);

  useEffect(
    () => () => {
      photosPreview.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [photosPreview]
  );

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const optimizeSelectedFile = useCallback(async (file, fieldName) => {
    const optimized = await optimizeImageFile(file, MEDIA_PRESETS[fieldName] || {});
    return withPreviewKey(optimized);
  }, []);

  const onFileChange = async (event) => {
    const input = event.target;
    const { name, files } = input;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setFeedback("");
    setIsError(false);
    setIsOptimizingMedia(true);

    try {
      if (name === "photos") {
        const nextPhotos = await Promise.all(
          Array.from(files || []).map((file) => optimizeSelectedFile(file, "photos"))
        );
        setForm((prev) => ({
          ...prev,
          photos: nextPhotos
        }));
        return;
      }

      const nextFile = files?.[0] ? await optimizeSelectedFile(files[0], name) : null;
      setForm((prev) => ({
        ...prev,
        [name]: nextFile
      }));

      if (nextFile && (name === "logo" || name === "banner")) {
        await openImageEditor({ fieldName: name, file: nextFile });
      }
    } catch (error) {
      setFeedback(error.message || "No pudimos preparar las imagenes para el envio.");
      setIsError(true);
    } finally {
      setIsOptimizingMedia(false);
      input.value = "";
    }
  };

  const removePhoto = useCallback((photoKey) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter(
        (file) => (file.__previewKey || `${file.name}-${file.size}-${file.lastModified}`) !== photoKey
      )
    }));
  }, []);

  const openImageEditor = useCallback(async ({ fieldName, file, index = null }) => {
    if (!file) return;
    try {
      const aspectRatio = fieldName === "logo" ? 1 : fieldName === "banner" ? 2 : undefined;
      const prepared = createImageEditorSession(file, {
        aspectRatio,
        outputWidth: fieldName === "logo" ? 1200 : fieldName === "banner" ? 1600 : undefined,
        outputHeight: fieldName === "logo" ? 1200 : fieldName === "banner" ? 800 : undefined,
        minWidth: fieldName === "logo" ? 220 : fieldName === "banner" ? 320 : 120,
        minHeight: fieldName === "logo" ? 220 : fieldName === "banner" ? 160 : 120
      });

      setImageEditor((current) => {
        if (current) {
          revokeImageEditorSession(current);
        }

        return {
          ...prepared,
          fieldName,
          index,
          title:
            fieldName === "logo"
              ? "Ajustar logo"
              : fieldName === "banner"
                ? "Ajustar banner"
                : `Acomodar foto ${Number(index) + 1}`
        };
      });
    } catch (error) {
      setFeedback(error.message || "No pudimos abrir el editor de imagen.");
      setIsError(true);
    }
  }, []);

  const closeImageEditor = useCallback(() => {
    if (imageEditor) {
      revokeImageEditorSession(imageEditor);
    }
    setImageEditor(null);
  }, [imageEditor]);

  const saveEditedImage = useCallback(
    async (completedCrop) => {
      if (!imageEditor) return;

      const editedFile = withPreviewKey(
        await renderCroppedImage({
          file: imageEditor.file,
          objectUrl: imageEditor.objectUrl,
          crop: completedCrop,
          outputWidth: imageEditor.outputWidth,
          outputHeight: imageEditor.outputHeight,
          outputType: MEDIA_PRESETS[imageEditor.fieldName]?.outputType,
          quality: MEDIA_PRESETS[imageEditor.fieldName]?.quality,
          maxBytes: MEDIA_PRESETS[imageEditor.fieldName]?.maxBytes
        })
      );

      setForm((prev) => {
        if (imageEditor.fieldName === "photos") {
          const nextPhotos = [...prev.photos];
          nextPhotos[imageEditor.index] = editedFile;
          return {
            ...prev,
            photos: nextPhotos
          };
        }

        return {
          ...prev,
          [imageEditor.fieldName]: editedFile
        };
      });

      closeImageEditor();
    },
    [closeImageEditor, imageEditor]
  );

  const onPointSelected = useCallback((lat, lng) => {
    setTouched((prev) => ({
      ...prev,
      latitude: true,
      longitude: true
    }));
    setForm((prev) => ({
      ...prev,
      latitude: toFixedCoord(lat),
      longitude: toFixedCoord(lng)
    }));
  }, []);

  const onHoursChange = (day, patch) => {
    setTouched((prev) => ({ ...prev, openingHours: true }));
    setOpeningHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...patch
      }
    }));
  };

  const validationMessage = useMemo(() => {
    const firstError = Object.values(fieldErrors)[0];
    return firstError || "";
  }, [fieldErrors]);

  const markAllTouched = useCallback(() => {
    setTouched({
      name: true,
      typeId: true,
      contactName: true,
      email: true,
      phone: true,
      whatsapp: true,
      address: true,
      locationGoogle: true,
      website: true,
      instagram: true,
      facebook: true,
      description: true,
      openingHours: true,
      latitude: true,
      longitude: true,
      logo: true,
      banner: true,
      photos: true
    });
  }, []);

  const getFieldState = useCallback(
    (fieldName) => {
      const value = form[fieldName];
      const hasError = Boolean(fieldErrors[fieldName]);
      const isTouched = Boolean(touched[fieldName]);

      if (fieldName === "openingHours") {
        if (!isTouched) return "pending";
        return hasError ? "invalid" : "valid";
      }

      if (fieldName === "photos") {
        if (!isTouched && !form.photos.length) return "pending";
        return hasError ? "invalid" : "valid";
      }

      if (fieldName === "logo" || fieldName === "banner") {
        if (!isTouched && !value) return "pending";
        return hasError ? "invalid" : "valid";
      }

      if (!isTouched && !String(value || "").trim()) return "pending";
      return hasError ? "invalid" : "valid";
    },
    [fieldErrors, form, touched]
  );

  const getFieldHint = useCallback(
    (fieldName) => fieldErrors[fieldName] || FIELD_HELPERS[fieldName] || "",
    [fieldErrors]
  );

  const getFieldDescribedBy = useCallback((fieldName) => `${fieldName}-hint`, []);

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("typeId", String(form.typeId));
    payload.append("contactName", form.contactName.trim());
    payload.append("email", form.email.trim().toLowerCase());
    payload.append("phone", normalizePhoneTo54(form.phone));
    if (form.whatsapp.trim()) payload.append("whatsapp", normalizePhoneTo54(form.whatsapp));
    payload.append("address", form.address.trim());
    payload.append("description", form.description.trim());
    payload.append("latitude", form.latitude.trim());
    payload.append("longitude", form.longitude.trim());
    payload.append("openingHours", JSON.stringify(openingHoursPayload));

    if (form.locationGoogle.trim()) payload.append("locationGoogle", form.locationGoogle.trim());
    if (form.website.trim()) payload.append("website", form.website.trim());
    if (form.instagram.trim()) payload.append("instagram", form.instagram.replace(/^@+/, "").trim());
    if (form.facebook.trim()) payload.append("facebook", form.facebook.trim());

    payload.append("logo", form.logo);
    payload.append("banner", form.banner);
    form.photos.forEach((photo) => payload.append("photos", photo));

    return payload;
  };

  const resetForm = () => {
    setForm(initialState);
    setOpeningHours(defaultOpeningHours());
    setTouched({});
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFeedback("");
    setIsError(false);

    if (isOptimizingMedia) {
      setFeedback("Espera a que terminemos de preparar las imagenes antes de enviar.");
      setIsError(true);
      return;
    }

    if (validationMessage) {
      markAllTouched();
      setFeedback(validationMessage);
      setIsError(true);
      return;
    }

    setSubmitting(true);

    try {
      await createCommerceRequest(buildPayload());
      setFeedback(
        "Solicitud enviada. Revisaremos los datos e imagenes antes de activar el comercio."
      );
      resetForm();
      window.alert("Solicitud enviada correctamente. El comercio quedo pendiente de revision.");
    } catch (error) {
      setFeedback(error.message || "No pudimos enviar la solicitud en este momento.");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="hero hero--commerce" aria-labelledby="alta-comercio-titulo">
        <div className="hero-commerce-copy">
          <small>Comercios aliados</small>
          <h1 id="alta-comercio-titulo">Solicita el alta de tu comercio en Mappets</h1>
          <p>
            Si tienes una veterinaria, petshop, guarderia u otro servicio para mascotas, puedes
            postularte desde este formulario. El alta no es automatica: primero revisamos datos,
            horarios e imagenes para que la ficha salga clara, completa y confiable.
          </p>
          <div className="hero-commerce-chips" aria-label="Aspectos clave del proceso">
            {HERO_CHECKLIST.map((item) => (
              <span key={item} className="hero-commerce-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
        <aside className="hero-commerce-panel" aria-label="Resumen del proceso">
          <p className="hero-commerce-panel-kicker">Que revisamos antes de aprobar</p>
          <ul className="hero-commerce-panel-list">
            <li>Nombre, rubro y descripcion listos para publicarse sin ediciones posteriores.</li>
            <li>Datos de contacto reales y horarios consistentes con la operacion del local.</li>
            <li>Ubicacion exacta y material visual suficiente para moderacion.</li>
          </ul>
        </aside>
      </section>

      <section className="request-card request-card--commerce" aria-labelledby="formulario-comercio-titulo">
        <div className="request-card-header">
          <div>
            <p className="request-kicker">Formulario de solicitud</p>
            <h2 id="formulario-comercio-titulo">Carga la ficha publica de tu comercio</h2>
            <p className="request-card-copy">
              Cargaremos exactamente esta informacion en la app si la solicitud es aprobada.
              Cuanto mas prolija y precisa sea la ficha, mas rapido podremos revisarla.
            </p>
          </div>
          <div className="request-card-summary" aria-label="Resumen del formulario">
            <span className="request-card-summary-label">Completado</span>
            <strong>{progressPercent}%</strong>
            <p>
              {completedRequiredCount} de {totalRequiredCount} requisitos obligatorios completos.
            </p>
          </div>
        </div>
        <div className="form-progress" aria-live="polite">
          <div className="form-progress-head">
            <div>
              <strong>Estado del formulario</strong>
              <p>Completa cada bloque obligatorio antes de enviar la solicitud.</p>
            </div>
            <span className={`form-progress-badge ${validationMessage ? "pending" : "valid"}`}>
              {validationMessage ? "Faltan campos por completar" : "Formulario listo para enviar"}
            </span>
          </div>
          <div
            className="form-progress-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalRequiredCount}
            aria-valuenow={completedRequiredCount}
            aria-label="Progreso del formulario"
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="form-progress-meta">
            <span>{completedRequiredCount} / {totalRequiredCount} campos obligatorios</span>
            <span>{validationMessage || "Sin pendientes criticos. Ya puedes enviar la solicitud."}</span>
          </div>
          <div className="form-progress-sections" aria-label="Progreso por bloques">
            {FORM_SECTIONS.map((section) => {
              const summary = sectionStatus[section.id];
              return (
                <div key={section.id} className={`progress-section-card progress-section-card--${summary.tone}`}>
                  <span>{section.step}</span>
                  <strong>{section.title}</strong>
                  <small>
                    {summary.completed}/{summary.total} obligatorios
                  </small>
                </div>
              );
            })}
          </div>
        </div>

        <form className="request-form" id="commerce-request-form" noValidate onSubmit={onSubmit}>
          <section className="form-section" aria-labelledby="commerce-section-identity">
            <div className="form-section-heading">
              <div>
                <p className="form-section-step">{FORM_SECTIONS[0].step}</p>
                <h3 id="commerce-section-identity">{FORM_SECTIONS[0].title}</h3>
                <p>{FORM_SECTIONS[0].description}</p>
              </div>
              <span className={`form-section-badge form-section-badge--${sectionStatus.identity.tone}`}>
                {sectionStatus.identity.badge}
              </span>
            </div>
          <div className="row">
            <div className={`input-group input-group--${getFieldState("name")}`}>
              <label htmlFor="commerce-name">Nombre del comercio</label>
              <input
                id="commerce-name"
                name="name"
                type="text"
                autoComplete="organization"
                placeholder="Ej: Veterinaria San Martin"
                required
                value={form.name}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                aria-invalid={fieldErrors.name ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("name")}
              />
              <p id={getFieldDescribedBy("name")} className={`field-hint field-hint--${getFieldState("name")}`}>
                {getFieldHint("name")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("typeId")}`}>
              <label htmlFor="commerce-type">Rubro</label>
              <select
                id="commerce-type"
                name="typeId"
                required
                value={form.typeId}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, typeId: true }))}
                disabled={loadingTypes}
                aria-invalid={fieldErrors.typeId ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("typeId")}
              >
                <option value="">{loadingTypes ? "Cargando rubros..." : "Selecciona un rubro"}</option>
                {types.map((type) => (
                  <option key={type.typeId} value={String(type.typeId)}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p id={getFieldDescribedBy("typeId")} className={`field-hint field-hint--${getFieldState("typeId")}`}>
                {getFieldHint("typeId")}
              </p>
            </div>
          </div>

          </section>

          <section className="form-section" aria-labelledby="commerce-section-contact">
            <div className="form-section-heading">
              <div>
                <p className="form-section-step">{FORM_SECTIONS[1].step}</p>
                <h3 id="commerce-section-contact">{FORM_SECTIONS[1].title}</h3>
                <p>{FORM_SECTIONS[1].description}</p>
              </div>
              <span className={`form-section-badge form-section-badge--${sectionStatus.contact.tone}`}>
                {sectionStatus.contact.badge}
              </span>
            </div>
            <div className="row">
            <div className={`input-group input-group--${getFieldState("contactName")}`}>
              <label htmlFor="contact-name">Persona de contacto</label>
              <input
                id="contact-name"
                name="contactName"
                type="text"
                autoComplete="name"
                placeholder="Nombre y apellido"
                required
                value={form.contactName}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, contactName: true }))}
                aria-invalid={fieldErrors.contactName ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("contactName")}
              />
              <p id={getFieldDescribedBy("contactName")} className={`field-hint field-hint--${getFieldState("contactName")}`}>
                {getFieldHint("contactName")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("email")}`}>
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
                onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                aria-invalid={fieldErrors.email ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("email")}
              />
              <p id={getFieldDescribedBy("email")} className={`field-hint field-hint--${getFieldState("email")}`}>
                {getFieldHint("email")}
              </p>
            </div>
          </div>

          <div className="row">
            <div className={`input-group input-group--${getFieldState("phone")}`}>
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
                onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                aria-invalid={fieldErrors.phone ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("phone")}
              />
              <p id={getFieldDescribedBy("phone")} className={`field-hint field-hint--${getFieldState("phone")}`}>
                {getFieldHint("phone")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("whatsapp")}`}>
              <label htmlFor="commerce-whatsapp">WhatsApp (opcional)</label>
              <input
                id="commerce-whatsapp"
                name="whatsapp"
                type="tel"
                autoComplete="tel-national"
                placeholder="Ej: +54 11 1234 5678"
                value={form.whatsapp}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, whatsapp: true }))}
                aria-invalid={fieldErrors.whatsapp ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("whatsapp")}
              />
              <p id={getFieldDescribedBy("whatsapp")} className={`field-hint field-hint--${getFieldState("whatsapp")}`}>
                {getFieldHint("whatsapp")}
              </p>
            </div>
          </div>

          </section>

          <section className="form-section" aria-labelledby="commerce-section-operation">
            <div className="form-section-heading">
              <div>
                <p className="form-section-step">{FORM_SECTIONS[2].step}</p>
                <h3 id="commerce-section-operation">{FORM_SECTIONS[2].title}</h3>
                <p>{FORM_SECTIONS[2].description}</p>
              </div>
              <span className={`form-section-badge form-section-badge--${sectionStatus.operation.tone}`}>
                {sectionStatus.operation.badge}
              </span>
            </div>
          <div className="row">
            <div className={`input-group input-group--${getFieldState("address")}`}>
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
                onBlur={() => setTouched((prev) => ({ ...prev, address: true }))}
                aria-invalid={fieldErrors.address ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("address")}
              />
              <p id={getFieldDescribedBy("address")} className={`field-hint field-hint--${getFieldState("address")}`}>
                {getFieldHint("address")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("locationGoogle")}`}>
              <label htmlFor="commerce-location">Link de Google Maps (opcional)</label>
              <input
                id="commerce-location"
                name="locationGoogle"
                type="url"
                placeholder="https://maps.google.com/..."
                value={form.locationGoogle}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, locationGoogle: true }))}
                aria-invalid={fieldErrors.locationGoogle ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("locationGoogle")}
              />
              <p id={getFieldDescribedBy("locationGoogle")} className={`field-hint field-hint--${getFieldState("locationGoogle")}`}>
                {getFieldHint("locationGoogle")}
              </p>
            </div>
          </div>

          <div className="row">
            <div className={`input-group input-group--${getFieldState("website")}`}>
              <label htmlFor="commerce-website">Sitio web (opcional)</label>
              <input
                id="commerce-website"
                name="website"
                type="url"
                placeholder="https://tucomercio.com"
                value={form.website}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, website: true }))}
                aria-invalid={fieldErrors.website ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("website")}
              />
              <p id={getFieldDescribedBy("website")} className={`field-hint field-hint--${getFieldState("website")}`}>
                {getFieldHint("website")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("instagram")}`}>
              <label htmlFor="commerce-instagram">Instagram (opcional)</label>
              <input
                id="commerce-instagram"
                name="instagram"
                type="text"
                placeholder="tucomercio"
                value={form.instagram}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, instagram: true }))}
                aria-invalid={fieldErrors.instagram ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("instagram")}
              />
              <p id={getFieldDescribedBy("instagram")} className={`field-hint field-hint--${getFieldState("instagram")}`}>
                {getFieldHint("instagram")}
              </p>
            </div>
          </div>

          <div className="row">
            <div className={`input-group input-group--${getFieldState("facebook")}`}>
              <label htmlFor="commerce-facebook">Facebook (opcional)</label>
              <input
                id="commerce-facebook"
                name="facebook"
                type="url"
                placeholder="https://facebook.com/tucomercio"
                value={form.facebook}
                onChange={onChange}
                onBlur={() => setTouched((prev) => ({ ...prev, facebook: true }))}
                aria-invalid={fieldErrors.facebook ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("facebook")}
              />
              <p id={getFieldDescribedBy("facebook")} className={`field-hint field-hint--${getFieldState("facebook")}`}>
                {getFieldHint("facebook")}
              </p>
            </div>
          </div>

          <div className={`input-group input-group--${getFieldState("description")}`}>
            <label htmlFor="commerce-description">Descripcion del comercio</label>
            <textarea
              id="commerce-description"
              name="description"
              placeholder="Contanos que servicios ofrecen, zona de cobertura y valor diferencial"
              required
              value={form.description}
              onChange={onChange}
              onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
              aria-invalid={fieldErrors.description ? "true" : "false"}
              aria-describedby={getFieldDescribedBy("description")}
            />
            <p id={getFieldDescribedBy("description")} className={`field-hint field-hint--${getFieldState("description")}`}>
              {getFieldHint("description")}
            </p>
          </div>

          <div className={`input-group input-group--${getFieldState("openingHours")}`}>
            <label>Horarios de atencion</label>
            <div className="admin-hours-grid">
              {WEEK_DAYS.map((day) => {
                const item = openingHours[day];
                return (
                  <div key={day} className={`admin-hours-row ${item.closed ? "is-closed" : "is-open"}`}>
                    <div className="admin-hours-dayblock">
                      <span className="admin-hours-day">{day}</span>
                      <span className="muted admin-hours-preview">
                        {openingHoursLabel(openingHoursPayload[day])}
                      </span>
                    </div>
                    <div className="admin-hours-controls">
                      <div className="admin-hours-switches">
                        <label className="checkline admin-hours-check">
                          <input
                            type="checkbox"
                            checked={!item.closed}
                            onChange={(event) =>
                              onHoursChange(day, {
                                closed: !event.target.checked
                              })
                            }
                          />
                          <span className="admin-hours-indicator" aria-hidden="true" />
                          Abierto
                        </label>
                        <label className="checkline admin-hours-check">
                          <input
                            type="checkbox"
                            checked={item.split}
                            disabled={item.closed}
                            onChange={(event) => onHoursChange(day, { split: event.target.checked })}
                          />
                          <span className="admin-hours-indicator" aria-hidden="true" />
                          Dos turnos
                        </label>
                      </div>
                      <div className="admin-hours-times" aria-label={`Horarios para ${day}`}>
                        <label className="admin-time-field">
                          <span>Abre</span>
                          <input
                            type="time"
                            value={item.start}
                            disabled={item.closed}
                            onChange={(event) => onHoursChange(day, { start: event.target.value })}
                          />
                        </label>
                        <label className="admin-time-field">
                          <span>Cierra</span>
                          <input
                            type="time"
                            value={item.end}
                            disabled={item.closed}
                            onChange={(event) => onHoursChange(day, { end: event.target.value })}
                          />
                        </label>
                        {item.split ? (
                          <>
                            <label className="admin-time-field">
                              <span>Reabre</span>
                              <input
                                type="time"
                                value={item.start2}
                                disabled={item.closed}
                                onChange={(event) => onHoursChange(day, { start2: event.target.value })}
                              />
                            </label>
                            <label className="admin-time-field">
                              <span>Cierra</span>
                              <input
                                type="time"
                                value={item.end2}
                                disabled={item.closed}
                                onChange={(event) => onHoursChange(day, { end2: event.target.value })}
                              />
                            </label>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p id={getFieldDescribedBy("openingHours")} className={`field-hint field-hint--${getFieldState("openingHours")}`}>
              {getFieldHint("openingHours")}
            </p>
          </div>

          </section>

          <section className="form-section" aria-labelledby="commerce-section-location">
            <div className="form-section-heading">
              <div>
                <p className="form-section-step">{FORM_SECTIONS[3].step}</p>
                <h3 id="commerce-section-location">{FORM_SECTIONS[3].title}</h3>
                <p>{FORM_SECTIONS[3].description}</p>
              </div>
              <span className={`form-section-badge form-section-badge--${sectionStatus.location.tone}`}>
                {sectionStatus.location.badge}
              </span>
            </div>

          <CommerceMap lat={form.latitude} lng={form.longitude} onPointSelected={onPointSelected} />

          <div className="row row--compact">
            <div className={`input-group input-group--${getFieldState("latitude")}`}>
              <label htmlFor="commerce-latitude">Latitud</label>
              <input
                id="commerce-latitude"
                name="latitude"
                type="text"
                inputMode="decimal"
                readOnly
                required
                value={form.latitude}
                aria-invalid={fieldErrors.latitude ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("latitude")}
              />
              <p id={getFieldDescribedBy("latitude")} className={`field-hint field-hint--${getFieldState("latitude")}`}>
                {getFieldHint("latitude")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("longitude")}`}>
              <label htmlFor="commerce-longitude">Longitud</label>
              <input
                id="commerce-longitude"
                name="longitude"
                type="text"
                inputMode="decimal"
                readOnly
                required
                value={form.longitude}
                aria-invalid={fieldErrors.longitude ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("longitude")}
              />
              <p id={getFieldDescribedBy("longitude")} className={`field-hint field-hint--${getFieldState("longitude")}`}>
                {getFieldHint("longitude")}
              </p>
            </div>
          </div>

          </section>

          <section className="form-section" aria-labelledby="commerce-section-media">
            <div className="form-section-heading">
              <div>
                <p className="form-section-step">{FORM_SECTIONS[4].step}</p>
                <h3 id="commerce-section-media">{FORM_SECTIONS[4].title}</h3>
                <p>{FORM_SECTIONS[4].description}</p>
              </div>
              <span className={`form-section-badge form-section-badge--${sectionStatus.media.tone}`}>
                {sectionStatus.media.badge}
              </span>
            </div>
          <div className="media-guidance">
              <strong>Recomendacion visual</strong>
              <p>
                Usa imagenes bien iluminadas, sin texto incrustado ni marcas de agua. El logo se
                ve mejor centrado y el banner funciona mejor con una foto horizontal del local o
                de los servicios.
              </p>
              <p className="muted admin-media-caption">
                Peso actual optimizado: {formatBytes(mediaBytes)} de {formatBytes(MAX_MEDIA_TOTAL_BYTES)}.
                {" "}Si superas ese limite, reduce la cantidad de fotos o vuelve a recortarlas.
              </p>
            </div>
          <div className="row">
            <div className={`input-group input-group--${getFieldState("logo")} upload-group`}>
              <label htmlFor="commerce-logo">Logo 1:1</label>
              <input
                id="commerce-logo"
                name="logo"
                type="file"
                accept="image/*"
                disabled={submitting || isOptimizingMedia}
                onChange={onFileChange}
                onBlur={() => setTouched((prev) => ({ ...prev, logo: true }))}
                aria-invalid={fieldErrors.logo ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("logo")}
              />
              {logoPreview ? <img className="admin-media-preview admin-media-preview--square" src={logoPreview} alt="Preview logo" /> : null}
              {form.logo ? (
                <button type="button" className="button secondary media-edit-button" onClick={() => openImageEditor({ fieldName: "logo", file: form.logo })}>
                  Ajustar logo
                </button>
              ) : null}
              <p id={getFieldDescribedBy("logo")} className={`field-hint field-hint--${getFieldState("logo")}`}>
                {getFieldHint("logo")}
              </p>
            </div>
            <div className={`input-group input-group--${getFieldState("banner")} upload-group`}>
              <label htmlFor="commerce-banner">Banner 2:1</label>
              <input
                id="commerce-banner"
                name="banner"
                type="file"
                accept="image/*"
                disabled={submitting || isOptimizingMedia}
                onChange={onFileChange}
                onBlur={() => setTouched((prev) => ({ ...prev, banner: true }))}
                aria-invalid={fieldErrors.banner ? "true" : "false"}
                aria-describedby={getFieldDescribedBy("banner")}
              />
              {bannerPreview ? <img className="admin-media-preview admin-media-preview--banner" src={bannerPreview} alt="Preview banner" /> : null}
              {form.banner ? (
                <button type="button" className="button secondary media-edit-button" onClick={() => openImageEditor({ fieldName: "banner", file: form.banner })}>
                  Ajustar banner
                </button>
              ) : null}
              <p id={getFieldDescribedBy("banner")} className={`field-hint field-hint--${getFieldState("banner")}`}>
                {getFieldHint("banner")}
              </p>
            </div>
          </div>

          <div className={`input-group input-group--${getFieldState("photos")} upload-group upload-group--gallery`}>
            <label htmlFor="commerce-photos">Fotos del comercio</label>
            <input
              id="commerce-photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              disabled={submitting || isOptimizingMedia}
              onChange={onFileChange}
              onBlur={() => setTouched((prev) => ({ ...prev, photos: true }))}
              aria-invalid={fieldErrors.photos ? "true" : "false"}
              aria-describedby={getFieldDescribedBy("photos")}
            />
            {photosPreview.length ? (
              <div className="admin-media-grid" aria-live="polite">
                {photosPreview.map((item) => (
                  <figure key={item.key} className="admin-media-card">
                    <img src={item.url} alt={item.name} className="admin-media-preview admin-media-preview--gallery" />
                    <figcaption className="muted admin-media-caption" title={item.name}>{item.name}</figcaption>
                    <div className="admin-media-actions">
                      <button
                        type="button"
                        className="button secondary admin-media-remove"
                        onClick={() => {
                          const index = form.photos.findIndex((file) => (file.__previewKey || `${file.name}-${file.size}-${file.lastModified}`) === item.key);
                          if (index >= 0) {
                            openImageEditor({ fieldName: "photos", file: form.photos[index], index });
                          }
                        }}
                      >
                        Acomodar
                      </button>
                      <button
                        type="button"
                        className="button secondary admin-media-remove"
                        onClick={() => removePhoto(item.key)}
                      >
                        Quitar
                      </button>
                    </div>
                  </figure>
                ))}
              </div>
            ) : null}
            {photosPreview.length ? (
              <p className="muted admin-media-caption">
                {photosPreview.length} {photosPreview.length === 1 ? "foto cargada" : "fotos cargadas"}.
                {" "}Las fotos pueden tener cualquier proporcion y luego puedes reencuadrarlas.
              </p>
            ) : null}
            <p id={getFieldDescribedBy("photos")} className={`field-hint field-hint--${getFieldState("photos")}`}>
              {getFieldHint("photos")}
            </p>
          </div>

          </section>

          <div className="form-submit-panel">
          <div className="form-submit-copy">
              <strong>Revision manual de Mappets</strong>
              <p>
                Al enviar, el comercio queda pendiente de validacion. No se publica automaticamente.
              </p>
            </div>
            <button className="button form-submit-button" type="submit" disabled={submitting || loadingTypes || isOptimizingMedia}>
              {isOptimizingMedia ? "Preparando imagenes..." : submitting ? "Enviando..." : "Enviar solicitud de alta"}
            </button>
          </div>
          <p className={`feedback ${isError ? "error" : ""}`} role="status" aria-live="polite">
            {feedback}
          </p>
        </form>

        <div className="note note--commerce">
          <p>
            <strong>Importante:</strong> completar este formulario no activa el comercio
            automaticamente.
          </p>
          <ul>
            <li>Revision del equipo de Mappets.</li>
            <li>Validacion de datos, horarios e imagenes.</li>
            <li>Publicacion del comercio solo si la solicitud es aprobada.</li>
          </ul>
        </div>
      </section>

      <ImageEditorModal editor={imageEditor} onCancel={closeImageEditor} onSave={saveEditedImage} />
    </>
  );
}

export default CommerceSignupPage;
