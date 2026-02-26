import { useCallback, useEffect, useMemo, useState } from "react";
import CommerceMap from "../components/CommerceMap";
import {
  createAdminCommerce,
  deleteAdminCommerce,
  denormalizePhoneFrom54,
  fetchAdminCommerceById,
  fetchAdminCommerces,
  fetchCommerceTypes,
  normalizePhoneTo54,
  resolveAdminCommerceImageUrl,
  updateAdminCommerce
} from "../services/adminCommerceApi";

const WEEK_DAYS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo"
];

const INITIAL_FORM = {
  name: "",
  typeId: "",
  description: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  instagram: "",
  facebook: "",
  address: "",
  locationGoogle: "",
  latitude: "",
  longitude: "",
  logo: null,
  banner: null,
  photos: []
};

function defaultOpeningHours() {
  return WEEK_DAYS.reduce((acc, day) => {
    acc[day] = {
      closed: true,
      split: false,
      start: "09:00",
      end: "12:30",
      start2: "16:30",
      end2: "19:30"
    };
    return acc;
  }, {});
}

function parseHourRange(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "cerrado") {
    return { closed: true };
  }

  const splitMatch = normalized.match(
    /^(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})\s*y\s*(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})$/
  );
  if (splitMatch) {
    return {
      closed: false,
      split: true,
      start: splitMatch[1],
      end: splitMatch[2],
      start2: splitMatch[3],
      end2: splitMatch[4]
    };
  }

  const singleMatch = normalized.match(/^(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})$/);
  if (singleMatch) {
    return {
      closed: false,
      split: false,
      start: singleMatch[1],
      end: singleMatch[2]
    };
  }

  const legacySingleMatch = normalized.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (legacySingleMatch) {
    return {
      closed: false,
      split: false,
      start: legacySingleMatch[1],
      end: legacySingleMatch[2]
    };
  }

  return null;
}

function openingHoursFromApi(raw) {
  const base = defaultOpeningHours();
  if (!raw || typeof raw !== "object") return base;

  WEEK_DAYS.forEach((day) => {
    const parsed = parseHourRange(raw[day]);
    if (!parsed) {
      base[day].closed = true;
      return;
    }

    if (parsed.closed) {
      base[day].closed = true;
      return;
    }

    base[day] = {
      ...base[day],
      ...parsed,
      closed: false,
      split: Boolean(parsed.split)
    };
  });

  return base;
}

function formatSingleRange(start, end) {
  return `${start || "09:00"} a ${end || "12:30"}`;
}

function openingHoursToPayload(openingHours) {
  return WEEK_DAYS.reduce((acc, day) => {
    const item = openingHours[day];
    if (!item || item.closed) {
      acc[day] = null;
      return acc;
    }

    const firstRange = formatSingleRange(item.start, item.end);
    if (!item.split) {
      acc[day] = firstRange;
      return acc;
    }

    const secondRange = formatSingleRange(item.start2, item.end2);
    acc[day] = `${firstRange} y ${secondRange}`;
    return acc;
  }, {});
}

function openingHoursLabel(value) {
  if (!value) return "Cerrado";
  return String(value);
}

function initialFromCommerce(commerce) {
  return {
    name: commerce?.name || "",
    typeId: commerce?.typeId ? String(commerce.typeId) : "",
    description: commerce?.description || "",
    email: commerce?.email || "",
    phone: denormalizePhoneFrom54(commerce?.phone || ""),
    whatsapp: denormalizePhoneFrom54(commerce?.whatsapp || ""),
    website: commerce?.website || "",
    instagram: String(commerce?.instagram || "").replace(/^@+/, ""),
    facebook: commerce?.facebook || "",
    address: commerce?.address || "",
    locationGoogle: commerce?.locationGoogle || "",
    latitude: commerce?.latitude ? String(commerce.latitude) : "",
    longitude: commerce?.longitude ? String(commerce.longitude) : "",
    logo: null,
    banner: null,
    photos: []
  };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatTypeLabel(commerce, types) {
  const direct = commerce?.types?.name || commerce?.type?.name || "";
  if (direct) return direct;
  const typeId = commerce?.typeId;
  if (!typeId) return "-";
  const found = types.find((item) => String(item.typeId) === String(typeId));
  return found?.name || `Tipo ${typeId}`;
}

function toPreviewFromFiles(files = []) {
  return files.map((file) => ({
    key: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file),
    existing: false
  }));
}

function readExistingPhotos(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return [];
    }
  }
  return [];
}

function AdminCommercesPage({ adminAuth }) {
  const [commerces, setCommerces] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours());
  const [existingMedia, setExistingMedia] = useState({
    logoUrl: "",
    bannerUrl: "",
    photos: []
  });

  const logoPreview = useMemo(() => {
    if (!form.logo) return "";
    return URL.createObjectURL(form.logo);
  }, [form.logo]);

  const bannerPreview = useMemo(() => {
    if (!form.banner) return "";
    return URL.createObjectURL(form.banner);
  }, [form.banner]);

  const photosPreview = useMemo(() => toPreviewFromFiles(form.photos), [form.photos]);

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

  const selectedCommerce = useMemo(
    () => commerces.find((commerce) => String(commerce.commerceId) === String(editingId)) || null,
    [commerces, editingId]
  );

  const filteredCommerces = useMemo(() => {
    const needle = normalizeText(search.trim());
    if (!needle) return commerces;
    return commerces.filter((commerce) => {
      const haystack = normalizeText(
        [
          commerce.name,
          commerce.description,
          commerce.address,
          commerce.email,
          commerce.phone,
          commerce.whatsapp,
          commerce.website,
          formatTypeLabel(commerce, types)
        ].join(" ")
      );
      return haystack.includes(needle);
    });
  }, [commerces, search, types]);

  const openingHoursPayload = useMemo(() => openingHoursToPayload(openingHours), [openingHours]);

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!adminAuth?.token) return;
      if (!silent) setLoading(true);
      setError("");

      try {
        const [typesData, commercesData] = await Promise.all([
          fetchCommerceTypes(adminAuth.token),
          fetchAdminCommerces(adminAuth.token)
        ]);
        setTypes(typesData);
        setCommerces(commercesData);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los comercios.");
      } finally {
        setLoading(false);
      }
    },
    [adminAuth?.token]
  );

  useEffect(() => {
    if (!adminAuth?.token) return;
    loadData();
  }, [adminAuth?.token, loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const clearForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setOpeningHours(defaultOpeningHours());
    setExistingMedia({ logoUrl: "", bannerUrl: "", photos: [] });
    setEditingId("");
    setError("");
  }, []);

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onFileChange = (event) => {
    const { name, files } = event.target;
    if (name === "photos") {
      setForm((current) => ({ ...current, photos: Array.from(files || []) }));
      return;
    }
    setForm((current) => ({ ...current, [name]: files?.[0] || null }));
  };

  const removeExistingPhoto = useCallback((photoKey) => {
    setExistingMedia((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.key !== photoKey)
    }));
  }, []);

  const removeNewPhoto = useCallback((photoKey) => {
    setForm((current) => ({
      ...current,
      photos: current.photos.filter(
        (photo) => `${photo.name}-${photo.size}-${photo.lastModified}` !== photoKey
      )
    }));
  }, []);

  const onPointSelected = useCallback((lat, lng) => {
    setForm((current) => ({
      ...current,
      latitude: Number(lat).toFixed(7),
      longitude: Number(lng).toFixed(7)
    }));
  }, []);

  const onHoursChange = (day, patch) => {
    setOpeningHours((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...patch
      }
    }));
  };

  const onEdit = async (commerceId) => {
    if (!adminAuth?.token || !commerceId || loadingEdit) return;
    setLoadingEdit(true);
    setError("");
    setNotice("");

    try {
      const commerce = await fetchAdminCommerceById(adminAuth.token, commerceId);
      const parsedPhotos = readExistingPhotos(commerce?.photos);
      setEditingId(String(commerce.commerceId));
      setForm(initialFromCommerce(commerce));
      setOpeningHours(openingHoursFromApi(commerce.openingHours));
      setExistingMedia({
        logoUrl: resolveAdminCommerceImageUrl(commerce?.logoUrl),
        bannerUrl: resolveAdminCommerceImageUrl(commerce?.bannerUrl),
        photos: parsedPhotos.map((photo, index) => ({
          key: `existing-${index}-${photo}`,
          name: `Foto ${index + 1}`,
          raw: photo,
          url: resolveAdminCommerceImageUrl(photo),
          existing: true
        }))
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (editError) {
      setError(editError.message || "No se pudo cargar el comercio para editar.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const toFormData = () => {
    const payload = new FormData();
    payload.append("name", form.name.trim());
    if (form.typeId) payload.append("typeId", String(form.typeId));
    if (form.description.trim()) payload.append("description", form.description.trim());
    if (form.email.trim()) payload.append("email", form.email.trim());
    if (form.phone.trim()) payload.append("phone", normalizePhoneTo54(form.phone));
    if (form.whatsapp.trim()) payload.append("whatsapp", normalizePhoneTo54(form.whatsapp));
    if (form.website.trim()) payload.append("website", form.website.trim());
    if (form.instagram.trim()) payload.append("instagram", form.instagram.replace(/^@+/, "").trim());
    if (form.facebook.trim()) payload.append("facebook", form.facebook.trim());
    if (form.address.trim()) payload.append("address", form.address.trim());
    if (form.locationGoogle.trim()) payload.append("locationGoogle", form.locationGoogle.trim());
    if (form.latitude.trim()) payload.append("latitude", form.latitude.trim());
    if (form.longitude.trim()) payload.append("longitude", form.longitude.trim());
    payload.append("openingHours", JSON.stringify(openingHoursToPayload(openingHours)));

    if (editingId) {
      const currentPhotos = existingMedia.photos.map((photo) => photo.raw).filter(Boolean);
      payload.append("photos", JSON.stringify(currentPhotos));
    }

    if (form.logo) payload.append("logo", form.logo);
    if (form.banner) payload.append("banner", form.banner);
    form.photos.forEach((photo) => payload.append("photos", photo));

    return payload;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!adminAuth?.token || saving) return;
    if (!form.name.trim()) {
      setError("El nombre del comercio es obligatorio.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = toFormData();
      if (editingId) {
        await updateAdminCommerce(adminAuth.token, editingId, payload);
        setNotice("Comercio actualizado correctamente.");
      } else {
        await createAdminCommerce(adminAuth.token, payload);
        setNotice("Comercio creado correctamente.");
      }
      clearForm();
      await loadData({ silent: true });
    } catch (submitError) {
      setError(submitError.message || "No se pudo guardar el comercio.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!adminAuth?.token || !editingId || deleting) return;
    const confirmed = window.confirm("Se eliminara el comercio seleccionado. Deseas continuar?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setNotice("");
    try {
      await deleteAdminCommerce(adminAuth.token, editingId);
      setNotice("Comercio eliminado correctamente.");
      clearForm();
      await loadData({ silent: true });
    } catch (deleteError) {
      setError(deleteError.message || "No se pudo eliminar el comercio.");
    } finally {
      setDeleting(false);
    }
  };

  if (adminAuth?.loading) {
    return (
      <section className="request-card auth-card">
        <h1>Cargando modulo de comercios...</h1>
      </section>
    );
  }

  if (!adminAuth?.token) {
    return (
      <section className="request-card auth-card">
        <h1>Sesion administrativa requerida</h1>
        <p>Este modulo solo esta disponible para sesion admin activa en `/admin/login`.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <small>Administracion</small>
        <h1>Gestion de comercios</h1>
        <p>
          Crea, edita o elimina comercios aliados. Este panel replica el flujo operativo de
          `mappets-form` dentro de `mappetsWeb`.
        </p>
        <div className="actions">
          <a className="button secondary" href="/admin/reports">
            Ir a reportes
          </a>
        </div>
      </section>

      <section className="section">
        <form className="request-form admin-commerce-form" onSubmit={onSubmit} noValidate>
          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-name-admin">Nombre *</label>
              <input
                id="commerce-name-admin"
                name="name"
                type="text"
                placeholder="Ej: Veterinaria San Martin"
                required
                value={form.name}
                onChange={onInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-type-admin">Tipo de comercio</label>
              <select
                id="commerce-type-admin"
                name="typeId"
                value={form.typeId}
                onChange={onInputChange}
              >
                <option value="">Selecciona tipo</option>
                {types.map((type) => (
                  <option key={type.typeId} value={String(type.typeId)}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="commerce-description-admin">Descripcion</label>
            <textarea
              id="commerce-description-admin"
              name="description"
              placeholder="Ej: Clinica veterinaria con guardia y pet shop"
              value={form.description}
              onChange={onInputChange}
            />
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-email-admin">Email</label>
              <input
                id="commerce-email-admin"
                name="email"
                type="email"
                placeholder="contacto@comercio.com"
                value={form.email}
                onChange={onInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-phone-admin">Telefono (+54)</label>
              <input
                id="commerce-phone-admin"
                name="phone"
                type="tel"
                inputMode="numeric"
                placeholder="91112345678"
                value={form.phone}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-whatsapp-admin">WhatsApp (+54)</label>
              <input
                id="commerce-whatsapp-admin"
                name="whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="91112345678"
                value={form.whatsapp}
                onChange={onInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-website-admin">Website</label>
              <input
                id="commerce-website-admin"
                name="website"
                type="url"
                placeholder="https://www.comercio.com"
                value={form.website}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-instagram-admin">Instagram</label>
              <input
                id="commerce-instagram-admin"
                name="instagram"
                type="text"
                placeholder="usuario"
                value={form.instagram}
                onChange={onInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-facebook-admin">Facebook</label>
              <input
                id="commerce-facebook-admin"
                name="facebook"
                type="text"
                placeholder="https://facebook.com/pagina"
                value={form.facebook}
                onChange={onInputChange}
              />
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-address-admin">Direccion</label>
              <input
                id="commerce-address-admin"
                name="address"
                type="text"
                placeholder="Ej: Av. Corrientes 1234, CABA"
                value={form.address}
                onChange={onInputChange}
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-location-admin">Google Maps URL</label>
              <input
                id="commerce-location-admin"
                name="locationGoogle"
                type="url"
                placeholder="https://maps.google.com/..."
                value={form.locationGoogle}
                onChange={onInputChange}
              />
            </div>
          </div>

          <CommerceMap lat={form.latitude} lng={form.longitude} onPointSelected={onPointSelected} />

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-lat-admin">Latitud</label>
              <input
                id="commerce-lat-admin"
                name="latitude"
                type="text"
                placeholder="Se completa desde el mapa"
                value={form.latitude}
                onChange={onInputChange}
                readOnly
              />
            </div>
            <div className="input-group">
              <label htmlFor="commerce-lng-admin">Longitud</label>
              <input
                id="commerce-lng-admin"
                name="longitude"
                type="text"
                placeholder="Se completa desde el mapa"
                value={form.longitude}
                onChange={onInputChange}
                readOnly
              />
            </div>
          </div>

          <div className="input-group">
            <label>Horarios</label>
            <p className="muted">Formato guardado por dia: Cerrado, 09:00 a 12:30 o 09:30 a 12:00 y 16:30 a 19:30.</p>
            <div className="admin-hours-grid">
              {WEEK_DAYS.map((day) => {
                const item = openingHours[day];
                return (
                  <div key={day} className="admin-hours-row">
                    <span className="admin-hours-day">{day}</span>
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
                      Abierto
                    </label>
                    <label className="checkline admin-hours-check">
                      <input
                        type="checkbox"
                        checked={item.split}
                        disabled={item.closed}
                        onChange={(event) => onHoursChange(day, { split: event.target.checked })}
                      />
                      Dos turnos
                    </label>
                    <input
                      type="time"
                      title="Desde"
                      value={item.start}
                      disabled={item.closed}
                      onChange={(event) => onHoursChange(day, { start: event.target.value })}
                    />
                    <input
                      type="time"
                      title="Hasta"
                      value={item.end}
                      disabled={item.closed}
                      onChange={(event) => onHoursChange(day, { end: event.target.value })}
                    />
                    {item.split ? (
                      <>
                        <input
                          type="time"
                          title="Desde segundo turno"
                          value={item.start2}
                          disabled={item.closed}
                          onChange={(event) => onHoursChange(day, { start2: event.target.value })}
                        />
                        <input
                          type="time"
                          title="Hasta segundo turno"
                          value={item.end2}
                          disabled={item.closed}
                          onChange={(event) => onHoursChange(day, { end2: event.target.value })}
                        />
                      </>
                    ) : null}
                    <span className="muted admin-hours-preview">
                      {openingHoursLabel(openingHoursPayload[day])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="row">
            <div className="input-group">
              <label htmlFor="commerce-logo-admin">Logo</label>
              <input
                id="commerce-logo-admin"
                name="logo"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
              {logoPreview || existingMedia.logoUrl ? (
                <img
                  className="admin-media-preview"
                  src={logoPreview || existingMedia.logoUrl}
                  alt="Preview de logo"
                />
              ) : null}
            </div>
            <div className="input-group">
              <label htmlFor="commerce-banner-admin">Banner</label>
              <input
                id="commerce-banner-admin"
                name="banner"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
              {bannerPreview || existingMedia.bannerUrl ? (
                <img
                  className="admin-media-preview"
                  src={bannerPreview || existingMedia.bannerUrl}
                  alt="Preview de banner"
                />
              ) : null}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="commerce-photos-admin">Fotos</label>
            <input
              id="commerce-photos-admin"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
            />
            {existingMedia.photos.length || photosPreview.length ? (
              <div className="admin-media-grid">
                {existingMedia.photos.map((item) => (
                  <figure key={item.key} className="admin-media-card">
                    <img src={item.url} alt={item.name} className="admin-media-preview" />
                    <figcaption className="muted">Existente: {item.name}</figcaption>
                    <button
                      type="button"
                      className="button secondary admin-media-remove"
                      onClick={() => removeExistingPhoto(item.key)}
                    >
                      Eliminar foto
                    </button>
                  </figure>
                ))}
                {photosPreview.map((item) => (
                  <figure key={item.key} className="admin-media-card">
                    <img src={item.url} alt={item.name} className="admin-media-preview" />
                    <figcaption className="muted">Nueva: {item.name}</figcaption>
                    <button
                      type="button"
                      className="button secondary admin-media-remove"
                      onClick={() => removeNewPhoto(item.key)}
                    >
                      Eliminar foto
                    </button>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>

          {notice ? <p className="feedback">{notice}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}

          <div className="actions">
            <button className="button" type="submit" disabled={saving || deleting || loadingEdit}>
              {saving ? "Guardando..." : editingId ? "Actualizar comercio" : "Crear comercio"}
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={saving || deleting || loadingEdit}
              onClick={clearForm}
            >
              Limpiar formulario
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={!editingId || saving || deleting || loadingEdit}
              onClick={onDelete}
            >
              {deleting ? "Eliminando..." : "Eliminar comercio"}
            </button>
          </div>
        </form>
      </section>

      <section className="section">
        <div className="admin-toolbar">
          <div className="input-group admin-commerce-search">
            <label htmlFor="admin-commerce-search">Buscar</label>
            <input
              id="admin-commerce-search"
              type="search"
              placeholder="Nombre, direccion, tipo, email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="button secondary" type="button" onClick={() => loadData({ silent: true })}>
            <span aria-hidden="true">↻</span>
            <span>Actualizar lista</span>
          </button>
        </div>

        {loading ? (
          <p className="muted">Cargando comercios...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Contacto</th>
                  <th>Direccion</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommerces.map((commerce) => (
                  <tr key={commerce.commerceId}>
                    <td>{commerce.commerceId}</td>
                    <td>
                      <strong>{commerce.name || "-"}</strong>
                      <br />
                      <span className="muted">{commerce.description || "-"}</span>
                    </td>
                    <td>{formatTypeLabel(commerce, types)}</td>
                    <td>
                      <span>{commerce.email || "-"}</span>
                      <br />
                      <span className="muted">{commerce.phone || commerce.whatsapp || "-"}</span>
                    </td>
                    <td>{commerce.address || "-"}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => onEdit(commerce.commerceId)}
                          disabled={loadingEdit}
                          aria-label={`Editar comercio ${commerce.name || commerce.commerceId}`}
                          title="Editar comercio"
                        >
                          {loadingEdit && String(editingId) === String(commerce.commerceId) ? "⏳" : "✏️"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredCommerces.length ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No hay comercios para mostrar.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedCommerce ? (
        <section className="note">
          <p>
            Editando: <strong>{selectedCommerce.name || "-"}</strong> (ID {selectedCommerce.commerceId})
          </p>
        </section>
      ) : null}
    </>
  );
}

export default AdminCommercesPage;
