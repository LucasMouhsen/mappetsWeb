import { useCallback, useEffect, useMemo, useState } from "react";
import CommerceMap from "../components/CommerceMap";
import {
  approveAdminCommerceRequest,
  denormalizePhoneFrom54,
  fetchAdminCommerceRequestById,
  fetchAdminCommerceRequests,
  fetchCommerceTypes,
  normalizePhoneTo54,
  rejectAdminCommerceRequest,
  resolveAdminCommerceImageUrl,
  suspendAdminCommerceRequest,
  updateAdminCommerce
} from "../services/adminCommerceApi";
import {
  WEEK_DAYS,
  defaultOpeningHours,
  openingHoursFromApi,
  openingHoursLabel,
  openingHoursToPayload
} from "../utils/commerceHours";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "SUSPENDED", label: "Suspendidos" }
];

const INITIAL_FORM = {
  name: "",
  contactName: "",
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
  photos: [],
  reviewNotes: ""
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatDate(dateLike) {
  if (!dateLike) return "-";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function statusLabel(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PENDING") return "Pendiente";
  if (normalized === "APPROVED") return "Aprobado";
  if (normalized === "REJECTED") return "Rechazado";
  if (normalized === "SUSPENDED") return "Suspendido";
  return normalized || "-";
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "APPROVED") return "resolved";
  if (normalized === "REJECTED" || normalized === "SUSPENDED") return "rejected";
  return "pending";
}

function initialFromCommerce(commerce) {
  return {
    name: commerce?.name || "",
    contactName: commerce?.contactName || "",
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
    photos: [],
    reviewNotes: commerce?.reviewNotes || ""
  };
}

function toPreviewFromFiles(files = []) {
  return files.map((file) => ({
    key: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file)
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

function formatTypeLabel(commerce, types) {
  const direct = commerce?.types?.name || "";
  if (direct) return direct;
  const typeId = commerce?.typeId;
  if (!typeId) return "-";
  const found = types.find((item) => String(item.typeId) === String(typeId));
  return found?.name || `Tipo ${typeId}`;
}

function AdminCommercesPage({ adminAuth }) {
  const [activeStatus, setActiveStatus] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState("");
  const [selectedCommerce, setSelectedCommerce] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [openingHours, setOpeningHours] = useState(defaultOpeningHours());
  const [existingMedia, setExistingMedia] = useState({
    logoUrl: "",
    bannerUrl: "",
    photos: []
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const logoPreview = useMemo(() => (form.logo ? URL.createObjectURL(form.logo) : ""), [form.logo]);
  const bannerPreview = useMemo(() => (form.banner ? URL.createObjectURL(form.banner) : ""), [form.banner]);
  const photosPreview = useMemo(() => toPreviewFromFiles(form.photos), [form.photos]);
  const openingHoursPayload = useMemo(() => openingHoursToPayload(openingHours), [openingHours]);

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

  const loadData = useCallback(
    async ({ silent = false } = {}) => {
      if (!adminAuth?.token) return;
      if (!silent) setLoading(true);
      setError("");

      try {
        const [typesData, requestsData] = await Promise.all([
          fetchCommerceTypes(),
          fetchAdminCommerceRequests(adminAuth.token, activeStatus)
        ]);
        setTypes(typesData);
        setRequests(requestsData);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar las solicitudes.");
      } finally {
        setLoading(false);
      }
    },
    [adminAuth?.token, activeStatus]
  );

  useEffect(() => {
    if (!adminAuth?.token) return;
    loadData();
  }, [adminAuth?.token, loadData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const filteredRequests = useMemo(() => {
    const needle = normalizeText(search.trim());
    if (!needle) return requests;

    return requests.filter((item) => {
      const haystack = normalizeText(
        [
          item?.name,
          item?.contactName,
          item?.description,
          item?.address,
          item?.email,
          item?.phone,
          item?.whatsapp,
          item?.website,
          item?.status,
          formatTypeLabel(item, types)
        ].join(" ")
      );
      return haystack.includes(needle);
    });
  }, [requests, search, types]);

  const clearSelection = useCallback(() => {
    setSelectedCommerce(null);
    setForm(INITIAL_FORM);
    setOpeningHours(defaultOpeningHours());
    setExistingMedia({ logoUrl: "", bannerUrl: "", photos: [] });
  }, []);

  const onEdit = useCallback(
    async (commerceId) => {
      if (!adminAuth?.token || !commerceId || loadingEdit) return;
      setLoadingEdit(true);
      setError("");
      setNotice("");

      try {
        const commerce = await fetchAdminCommerceRequestById(adminAuth.token, commerceId);
        const parsedPhotos = readExistingPhotos(commerce?.photos);
        setSelectedCommerce(commerce);
        setForm(initialFromCommerce(commerce));
        setOpeningHours(openingHoursFromApi(commerce?.openingHours));
        setExistingMedia({
          logoUrl: resolveAdminCommerceImageUrl(commerce?.logoUrl),
          bannerUrl: resolveAdminCommerceImageUrl(commerce?.bannerUrl),
          photos: parsedPhotos.map((photo, index) => ({
            key: `existing-${index}-${photo}`,
            raw: photo,
            name: `Foto ${index + 1}`,
            url: resolveAdminCommerceImageUrl(photo)
          }))
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (editError) {
        setError(editError.message || "No se pudo cargar la solicitud.");
      } finally {
        setLoadingEdit(false);
      }
    },
    [adminAuth?.token, loadingEdit]
  );

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

  const toFormData = () => {
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("contactName", form.contactName.trim());
    payload.append("typeId", String(form.typeId || ""));
    payload.append("description", form.description.trim());
    payload.append("email", form.email.trim().toLowerCase());
    payload.append("phone", normalizePhoneTo54(form.phone));
    if (form.whatsapp.trim()) payload.append("whatsapp", normalizePhoneTo54(form.whatsapp));
    if (form.website.trim()) payload.append("website", form.website.trim());
    if (form.instagram.trim()) payload.append("instagram", form.instagram.replace(/^@+/, "").trim());
    if (form.facebook.trim()) payload.append("facebook", form.facebook.trim());
    payload.append("address", form.address.trim());
    if (form.locationGoogle.trim()) payload.append("locationGoogle", form.locationGoogle.trim());
    payload.append("latitude", form.latitude.trim());
    payload.append("longitude", form.longitude.trim());
    payload.append("openingHours", JSON.stringify(openingHoursPayload));
    payload.append(
      "photos",
      JSON.stringify(existingMedia.photos.map((photo) => photo.raw).filter(Boolean))
    );

    if (form.logo) payload.append("logo", form.logo);
    if (form.banner) payload.append("banner", form.banner);
    form.photos.forEach((photo) => payload.append("photos", photo));

    return payload;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!adminAuth?.token || !selectedCommerce?.commerceId || saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateAdminCommerce(adminAuth.token, selectedCommerce.commerceId, toFormData());
      setNotice("Comercio actualizado correctamente.");
      await onEdit(selectedCommerce.commerceId);
      await loadData({ silent: true });
    } catch (submitError) {
      setError(submitError.message || "No se pudo actualizar el comercio.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (commerce, action) => {
    if (!adminAuth?.token || !commerce?.commerceId) return;

    setResolvingId(String(commerce.commerceId));
    setError("");
    setNotice("");

    try {
      const notes = String(form.reviewNotes || "").trim();
      if (action === "approve") {
        await approveAdminCommerceRequest(adminAuth.token, commerce.commerceId, notes);
        setNotice("Solicitud aprobada.");
      } else if (action === "reject") {
        await rejectAdminCommerceRequest(adminAuth.token, commerce.commerceId, notes);
        setNotice("Solicitud rechazada.");
      } else {
        await suspendAdminCommerceRequest(adminAuth.token, commerce.commerceId, notes);
        setNotice("Comercio suspendido.");
      }

      await loadData({ silent: true });
      if (selectedCommerce?.commerceId === commerce.commerceId) {
        await onEdit(commerce.commerceId);
      }
    } catch (actionError) {
      setError(actionError.message || "No se pudo actualizar la solicitud.");
    } finally {
      setResolvingId("");
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
        <h1>Moderacion de comercios</h1>
        <p>
          Revisa solicitudes, corrige la informacion si hace falta y cambia el estado a aprobado,
          rechazado o suspendido.
        </p>
        <div className="actions">
          <a className="button secondary" href="/admin/reports">
            Ir a reportes
          </a>
          <a className="button secondary" href="/admin/encuestas">
            Ir a encuestas
          </a>
          <a className="button secondary" href="/admin/refugios">
            Ir a refugios
          </a>
        </div>
      </section>

      {selectedCommerce ? (
        <section className="section">
          <form className="request-form admin-commerce-form" onSubmit={onSubmit} noValidate>
            <div className="actions">
              <h2>Editar solicitud #{selectedCommerce.commerceId}</h2>
              <button className="button secondary" type="button" onClick={clearSelection}>
                Cerrar edicion
              </button>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-name-admin">Nombre</label>
                <input id="commerce-name-admin" name="name" type="text" value={form.name} onChange={onInputChange} />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-contact-admin">Persona de contacto</label>
                <input
                  id="commerce-contact-admin"
                  name="contactName"
                  type="text"
                  value={form.contactName}
                  onChange={onInputChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-type-admin">Tipo de comercio</label>
                <select id="commerce-type-admin" name="typeId" value={form.typeId} onChange={onInputChange}>
                  <option value="">Selecciona tipo</option>
                  {types.map((type) => (
                    <option key={type.typeId} value={String(type.typeId)}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="commerce-email-admin">Email</label>
                <input id="commerce-email-admin" name="email" type="email" value={form.email} onChange={onInputChange} />
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-phone-admin">Telefono</label>
                <input id="commerce-phone-admin" name="phone" type="tel" value={form.phone} onChange={onInputChange} />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-whatsapp-admin">WhatsApp</label>
                <input
                  id="commerce-whatsapp-admin"
                  name="whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={onInputChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-website-admin">Website</label>
                <input id="commerce-website-admin" name="website" type="url" value={form.website} onChange={onInputChange} />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-instagram-admin">Instagram</label>
                <input
                  id="commerce-instagram-admin"
                  name="instagram"
                  type="text"
                  value={form.instagram}
                  onChange={onInputChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-facebook-admin">Facebook</label>
                <input
                  id="commerce-facebook-admin"
                  name="facebook"
                  type="url"
                  value={form.facebook}
                  onChange={onInputChange}
                />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-address-admin">Direccion</label>
                <input id="commerce-address-admin" name="address" type="text" value={form.address} onChange={onInputChange} />
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-location-admin">Google Maps URL</label>
                <input
                  id="commerce-location-admin"
                  name="locationGoogle"
                  type="url"
                  value={form.locationGoogle}
                  onChange={onInputChange}
                />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-description-admin">Descripcion</label>
                <textarea
                  id="commerce-description-admin"
                  name="description"
                  value={form.description}
                  onChange={onInputChange}
                />
              </div>
            </div>

            <CommerceMap lat={form.latitude} lng={form.longitude} onPointSelected={onPointSelected} />

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-lat-admin">Latitud</label>
                <input id="commerce-lat-admin" name="latitude" type="text" value={form.latitude} readOnly />
              </div>
              <div className="input-group">
                <label htmlFor="commerce-lng-admin">Longitud</label>
                <input id="commerce-lng-admin" name="longitude" type="text" value={form.longitude} readOnly />
              </div>
            </div>

            <div className="input-group">
              <label>Horarios</label>
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
                          onChange={(event) => onHoursChange(day, { closed: !event.target.checked })}
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
                      <input type="time" value={item.start} disabled={item.closed} onChange={(event) => onHoursChange(day, { start: event.target.value })} />
                      <input type="time" value={item.end} disabled={item.closed} onChange={(event) => onHoursChange(day, { end: event.target.value })} />
                      {item.split ? (
                        <>
                          <input type="time" value={item.start2} disabled={item.closed} onChange={(event) => onHoursChange(day, { start2: event.target.value })} />
                          <input type="time" value={item.end2} disabled={item.closed} onChange={(event) => onHoursChange(day, { end2: event.target.value })} />
                        </>
                      ) : null}
                      <span className="muted admin-hours-preview">{openingHoursLabel(openingHoursPayload[day])}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="row">
              <div className="input-group">
                <label htmlFor="commerce-logo-admin">Logo</label>
                <input id="commerce-logo-admin" name="logo" type="file" accept="image/*" onChange={onFileChange} />
                {logoPreview || existingMedia.logoUrl ? <img className="admin-media-preview" src={logoPreview || existingMedia.logoUrl} alt="Preview de logo" /> : null}
              </div>
              <div className="input-group">
                <label htmlFor="commerce-banner-admin">Banner</label>
                <input id="commerce-banner-admin" name="banner" type="file" accept="image/*" onChange={onFileChange} />
                {bannerPreview || existingMedia.bannerUrl ? <img className="admin-media-preview" src={bannerPreview || existingMedia.bannerUrl} alt="Preview de banner" /> : null}
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="commerce-photos-admin">Fotos</label>
              <input id="commerce-photos-admin" name="photos" type="file" accept="image/*" multiple onChange={onFileChange} />
              {existingMedia.photos.length || photosPreview.length ? (
                <div className="admin-media-grid">
                  {existingMedia.photos.map((item) => (
                    <figure key={item.key} className="admin-media-card">
                      <img src={item.url} alt={item.name} className="admin-media-preview" />
                      <figcaption className="muted">Existente: {item.name}</figcaption>
                      <button type="button" className="button secondary admin-media-remove" onClick={() => removeExistingPhoto(item.key)}>
                        Quitar foto
                      </button>
                    </figure>
                  ))}
                  {photosPreview.map((item) => (
                    <figure key={item.key} className="admin-media-card">
                      <img src={item.url} alt={item.name} className="admin-media-preview" />
                      <figcaption className="muted">Nueva: {item.name}</figcaption>
                      <button type="button" className="button secondary admin-media-remove" onClick={() => removeNewPhoto(item.key)}>
                        Quitar foto
                      </button>
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="input-group">
              <label htmlFor="commerce-review-notes">Notas internas</label>
              <textarea
                id="commerce-review-notes"
                name="reviewNotes"
                value={form.reviewNotes}
                onChange={onInputChange}
                placeholder="Motivo de aprobacion, rechazo o suspension"
                maxLength={500}
              />
            </div>

            {notice ? <p className="feedback">{notice}</p> : null}
            {error ? <p className="feedback error">{error}</p> : null}

            <div className="actions">
              <button className="button" type="submit" disabled={saving || loadingEdit}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              {selectedCommerce.status !== "APPROVED" ? <button className="button" type="button" disabled={resolvingId === String(selectedCommerce.commerceId)} onClick={() => updateStatus(selectedCommerce, "approve")}>Aprobar</button> : null}
              {selectedCommerce.status !== "REJECTED" ? <button className="button secondary" type="button" disabled={resolvingId === String(selectedCommerce.commerceId)} onClick={() => updateStatus(selectedCommerce, "reject")}>Rechazar</button> : null}
              {selectedCommerce.status !== "SUSPENDED" ? <button className="button secondary" type="button" disabled={resolvingId === String(selectedCommerce.commerceId)} onClick={() => updateStatus(selectedCommerce, "suspend")}>Suspender</button> : null}
            </div>
          </form>
        </section>
      ) : null}

      <section className="section">
        <div className="admin-toolbar">
          <button className="button secondary" type="button" onClick={() => loadData({ silent: true })}>
            <span aria-hidden="true">↻</span>
            <span>Actualizar lista</span>
          </button>
        </div>

        <div className="admin-filters">
          <div className="input-group">
            <label htmlFor="filter-commerce-status">Estado</label>
            <select id="filter-commerce-status" value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group admin-commerce-search">
            <label htmlFor="filter-commerce-search">Buscar</label>
            <input id="filter-commerce-search" type="search" placeholder="Nombre, tipo, contacto, email o direccion" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>

        {!selectedCommerce && notice ? <p className="feedback">{notice}</p> : null}
        {!selectedCommerce && error ? <p className="feedback error">{error}</p> : null}
      </section>

      <section className="section">
        {loading ? (
          <p className="muted">Cargando solicitudes...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Comercio</th>
                  <th>Tipo</th>
                  <th>Contacto</th>
                  <th>Solicitado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((commerce) => (
                  <tr key={commerce.commerceId}>
                    <td>
                      <span className={`admin-status-badge ${statusClass(commerce.status)}`}>
                        {statusLabel(commerce.status)}
                      </span>
                    </td>
                    <td>
                      <strong>{commerce.name || "-"}</strong>
                      <br />
                      <span className="muted">{commerce.description || "-"}</span>
                    </td>
                    <td>{formatTypeLabel(commerce, types)}</td>
                    <td>
                      <span>{commerce.contactName || "-"}</span>
                      <br />
                      <span className="muted">{commerce.email || commerce.phone || "-"}</span>
                    </td>
                    <td>{formatDate(commerce.submittedAt || commerce.createdAt)}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="button secondary" type="button" onClick={() => onEdit(commerce.commerceId)} disabled={loadingEdit}>
                          Editar
                        </button>
                        {commerce.status !== "APPROVED" ? <button className="button" type="button" disabled={resolvingId === String(commerce.commerceId)} onClick={() => updateStatus(commerce, "approve")}>Aprobar</button> : null}
                        {commerce.status !== "REJECTED" ? <button className="button secondary" type="button" disabled={resolvingId === String(commerce.commerceId)} onClick={() => updateStatus(commerce, "reject")}>Rechazar</button> : null}
                        {commerce.status !== "SUSPENDED" ? <button className="button secondary" type="button" disabled={resolvingId === String(commerce.commerceId)} onClick={() => updateStatus(commerce, "suspend")}>Suspender</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredRequests.length ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      No hay solicitudes para los filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default AdminCommercesPage;
