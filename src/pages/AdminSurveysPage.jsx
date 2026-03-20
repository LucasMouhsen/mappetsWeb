import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminSurveys } from "../services/adminSurveysApi";

const INITIAL_FILTERS = {
  resolution: "all",
  pet: "",
  user: "",
  helper: ""
};

function normalizeText(value) {
  return (value || "")
    .toString()
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

function resolutionMeta(selected) {
  if (Number(selected) === 1) return { label: "Por la app", className: "resolved" };
  if (Number(selected) === 2) return { label: "Por fuera", className: "pending" };
  return { label: "Otro", className: "rejected" };
}

function imageUrl(file) {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  return `${window.location.origin.replace(/\/$/, "")}/public/images/${file}`;
}

function AdminSurveysPage({ adminAuth }) {
  const [surveys, setSurveys] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const loadSurveys = useCallback(async ({ silent = false } = {}) => {
    if (!adminAuth?.token) return;
    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await fetchAdminSurveys(adminAuth.token);
      setSurveys(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las encuestas.");
    } finally {
      setLoading(false);
    }
  }, [adminAuth?.token]);

  useEffect(() => {
    if (!adminAuth?.token) return;
    loadSurveys();
  }, [adminAuth?.token, loadSurveys]);

  const filteredSurveys = useMemo(() => {
    const petNeedle = normalizeText(filters.pet.trim());
    const userNeedle = normalizeText(filters.user.trim());
    const helperNeedle = normalizeText(filters.helper.trim());

    return surveys.filter((survey) => {
      if (filters.resolution !== "all" && String(survey.selected) !== filters.resolution) {
        return false;
      }

      if (petNeedle) {
        const haystack = normalizeText(`${survey.petName} ${survey.petOwnerName} ${survey.petOwnerEmail}`);
        if (!haystack.includes(petNeedle)) return false;
      }

      if (userNeedle) {
        const haystack = normalizeText(`${survey.userName} ${survey.userEmail}`);
        if (!haystack.includes(userNeedle)) return false;
      }

      if (helperNeedle) {
        const haystack = normalizeText(`${survey.helperName} ${survey.helperEmail}`);
        if (!haystack.includes(helperNeedle)) return false;
      }

      return true;
    });
  }, [filters, surveys]);

  if (adminAuth?.loading) {
    return (
      <section className="request-card auth-card">
        <h1>Cargando panel administrativo...</h1>
      </section>
    );
  }

  if (!adminAuth?.token) {
    return (
      <section className="request-card auth-card">
        <h1>Sesion administrativa requerida</h1>
        <p>Para acceder a encuestas debes iniciar sesion en `/admin/login`.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <small>Administracion</small>
        <h1>Encuestas de cierre</h1>
        <p>
          {surveys.length} encuestas registradas para revisar como se cerraron las publicaciones.
        </p>
        <div className="actions">
          <a className="button secondary" href="/admin/reports">
            Ir a reportes
          </a>
          <a className="button secondary" href="/admin/comercios">
            Ir a comercios
          </a>
          <a className="button secondary" href="/admin/refugios">
            Ir a refugios
          </a>
        </div>
      </section>

      <section className="section">
        <div className="admin-toolbar">
          <button className="button secondary" type="button" onClick={() => loadSurveys({ silent: true })}>
            <span aria-hidden="true">↻</span>
            <span>Actualizar lista</span>
          </button>
        </div>
        <div className="admin-filters">
          <div className="input-group">
            <label htmlFor="survey-resolution">Resolucion</label>
            <select
              id="survey-resolution"
              value={filters.resolution}
              onChange={(event) => setFilters((current) => ({ ...current, resolution: event.target.value }))}
            >
              <option value="all">Todas</option>
              <option value="1">Por la app</option>
              <option value="2">Por fuera</option>
              <option value="3">Otro</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="survey-pet">Mascota / dueño</label>
            <input
              id="survey-pet"
              type="search"
              placeholder="Mascota o dueño"
              value={filters.pet}
              onChange={(event) => setFilters((current) => ({ ...current, pet: event.target.value }))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="survey-user">Respondio</label>
            <input
              id="survey-user"
              type="search"
              placeholder="Usuario que respondio"
              value={filters.user}
              onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="survey-helper">Helper</label>
            <input
              id="survey-helper"
              type="search"
              placeholder="Ayudante o contacto"
              value={filters.helper}
              onChange={(event) => setFilters((current) => ({ ...current, helper: event.target.value }))}
            />
          </div>
        </div>

        {error ? <p className="feedback error">{error}</p> : null}
      </section>

      <section className="section">
        {loading ? (
          <p className="muted">Cargando encuestas...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Resolucion</th>
                  <th>Mascota</th>
                  <th>Respondio</th>
                  <th>Helper</th>
                  <th>Detalle</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveys.map((survey) => {
                  const meta = resolutionMeta(survey.selected);
                  return (
                    <tr key={survey.surveyId}>
                      <td>
                        <span className={`admin-status-badge ${meta.className}`}>{meta.label}</span>
                      </td>
                      <td>
                        <strong>{survey.petName}</strong>
                        <br />
                        <span className="muted">{survey.petOwnerName || survey.petOwnerEmail || "-"}</span>
                      </td>
                      <td>
                        {survey.userName || "-"}
                        <br />
                        <span className="muted">{survey.userEmail || "-"}</span>
                      </td>
                      <td>
                        {survey.helperName || "-"}
                        <br />
                        <span className="muted">{survey.helperEmail || "-"}</span>
                      </td>
                      <td>{survey.description || "-"}</td>
                      <td>{formatDate(survey.createdAt)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setSelectedSurvey(survey)}
                            aria-label={`Ver encuesta ${survey.surveyId}`}
                            title="Ver encuesta"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredSurveys.length ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No hay encuestas para los filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="modal-backdrop" hidden={!selectedSurvey}>
        {selectedSurvey ? (
          <article className="modal admin-modal" role="dialog" aria-modal="true" aria-labelledby="survey-title">
            <header>
              <h2 id="survey-title">{selectedSurvey.petName}</h2>
            </header>
            <div className="content">
              <div className="card-inline">
                <p>
                  <strong>Resolucion:</strong> {resolutionMeta(selectedSurvey.selected).label}
                </p>
                <p>
                  <strong>Mascota:</strong> {selectedSurvey.petName}
                </p>
                <p>
                  <strong>Dueño:</strong> {selectedSurvey.petOwnerName || selectedSurvey.petOwnerEmail || "-"}
                </p>
                <p>
                  <strong>Respondio:</strong> {selectedSurvey.userName || selectedSurvey.userEmail || "-"}
                </p>
                <p>
                  <strong>Helper:</strong> {selectedSurvey.helperName || selectedSurvey.helperEmail || "-"}
                </p>
                <p>
                  <strong>Fecha:</strong> {formatDate(selectedSurvey.createdAt)}
                </p>
                <p>
                  <strong>Detalle:</strong> {selectedSurvey.description || "-"}
                </p>
                {selectedSurvey.imageUrl ? (
                  <img
                    className="admin-report-image"
                    src={imageUrl(selectedSurvey.imageUrl)}
                    alt={`Mascota ${selectedSurvey.petName}`}
                  />
                ) : null}
              </div>
            </div>
            <div className="actions">
              <button type="button" className="button secondary" onClick={() => setSelectedSurvey(null)}>
                Cerrar
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );
}

export default AdminSurveysPage;
