import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminPetReports, resolveAdminPetReport } from "../services/adminReportsApi";

const INITIAL_FILTERS = {
  status: "all",
  user: "",
  pet: ""
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

function statusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "pending") return "Pendiente";
  if (normalized === "confirmed" || normalized === "approved") return "Aprobado";
  if (normalized === "rejected") return "Rechazado";
  return normalized || "Pendiente";
}

function statusClass(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "rejected") return "rejected";
  if (normalized === "confirmed" || normalized === "approved") return "resolved";
  return "pending";
}

function AdminReportsPage({ adminAuth }) {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolvingId, setResolvingId] = useState("");

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (!adminAuth?.token) return;
    if (!silent) setLoading(true);
    setError("");

    try {
      const data = await fetchAdminPetReports(adminAuth.token);
      setReports(data);
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [adminAuth?.token]);

  useEffect(() => {
    if (!adminAuth?.token) return;
    loadReports();
  }, [adminAuth?.token, loadReports]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const filteredReports = useMemo(() => {
    const userNeedle = normalizeText(filters.user.trim());
    const petNeedle = normalizeText(filters.pet.trim());

    return reports.filter((report) => {
      if (filters.status === "pending" && report.resolved) return false;
      if (filters.status === "resolved" && !report.resolved) return false;

      if (userNeedle) {
        const haystack = normalizeText(
          `${report.reporterName || ""} ${report.reporterEmail || ""} ${report.ownerName || ""} ${report.ownerEmail || ""}`
        );
        if (!haystack.includes(userNeedle)) return false;
      }

      if (petNeedle) {
        const haystack = normalizeText(`${report.petName || ""} ${report.petBreed || ""}`);
        if (!haystack.includes(petNeedle)) return false;
      }

      return true;
    });
  }, [reports, filters]);

  const pendingCount = useMemo(
    () => reports.filter((report) => !report.resolved).length,
    [reports]
  );

  const handleResolve = async (reportId, decision) => {
    if (!adminAuth?.token) return;
    setResolvingId(String(reportId));
    setError("");
    try {
      await resolveAdminPetReport(adminAuth.token, reportId, decision);
      setNotice(decision === "reject" ? "Reporte rechazado." : "Reporte aprobado.");
      await loadReports({ silent: true });
      setSelectedReport((current) =>
        current?.reportId === reportId
          ? {
              ...current,
              status: decision === "reject" ? "rejected" : "confirmed",
              resolved: true
            }
          : current
      );
    } catch (resolveError) {
      setError(resolveError.message || "No se pudo resolver el reporte.");
    } finally {
      setResolvingId("");
    }
  };

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
        <p>Para acceder a reportes debes iniciar sesion en `/admin/login`.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <small>Administracion</small>
        <h1>Gestion de reportes de mascotas</h1>
        <p>
          {pendingCount} pendientes de {reports.length} reportes registrados en la plataforma.
        </p>
        <div className="actions">
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
          <button className="button secondary" type="button" onClick={() => loadReports({ silent: true })}>
            <span aria-hidden="true">↻</span>
            <span>Actualizar lista</span>
          </button>
        </div>
        <div className="admin-filters">
          <div className="input-group">
            <label htmlFor="filter-status">Estado</label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="resolved">Resueltos</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="filter-user">Usuario</label>
            <input
              id="filter-user"
              type="search"
              placeholder="Nombre o email"
              value={filters.user}
              onChange={(event) => setFilters((current) => ({ ...current, user: event.target.value }))}
            />
          </div>
          <div className="input-group">
            <label htmlFor="filter-pet">Mascota</label>
            <input
              id="filter-pet"
              type="search"
              placeholder="Nombre o raza"
              value={filters.pet}
              onChange={(event) => setFilters((current) => ({ ...current, pet: event.target.value }))}
            />
          </div>
        </div>

        {notice ? <p className="feedback">{notice}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
      </section>

      <section className="section">
        {loading ? (
          <p className="muted">Cargando reportes...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Mascota</th>
                  <th>Reportado por</th>
                  <th>Dueno</th>
                  <th>Motivo</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const isResolving = resolvingId === String(report.reportId);
                  return (
                    <tr key={report.id}>
                      <td>
                        <span className={`admin-status-badge ${statusClass(report.status)}`}>
                          {statusLabel(report.status)}
                        </span>
                      </td>
                      <td>
                        <strong>{report.petName}</strong>
                        <br />
                        <span className="muted">{report.petBreed || "-"}</span>
                      </td>
                      <td>
                        {report.reporterName}
                        <br />
                        <span className="muted">{report.reporterEmail || "-"}</span>
                      </td>
                      <td>
                        {report.ownerName || "-"}
                        <br />
                        <span className="muted">{report.ownerEmail || "-"}</span>
                      </td>
                      <td>{report.reason || "-"}</td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setSelectedReport(report)}
                            aria-label={`Ver reporte de ${report.petName}`}
                            title="Ver reporte"
                          >
                            👁️
                          </button>
                          {!report.resolved ? (
                            <>
                              <button
                                type="button"
                                className="button"
                                disabled={isResolving}
                                onClick={() => handleResolve(report.reportId, "approve")}
                              >
                                Aprobar
                              </button>
                              <button
                                type="button"
                                className="button secondary"
                                disabled={isResolving}
                                onClick={() => handleResolve(report.reportId, "reject")}
                              >
                                Rechazar
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredReports.length ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No hay reportes para los filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="modal-backdrop" hidden={!selectedReport}>
        {selectedReport ? (
          <article className="modal admin-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <header>
              <h2 id="report-title">{selectedReport.petName}</h2>
            </header>
            <div className="content">
              <div className="card-inline">
                <p>
                  <strong>Estado:</strong> {statusLabel(selectedReport.status)}
                </p>
                <p>
                  <strong>Mascota:</strong> {selectedReport.petName} {selectedReport.petBreed ? `(${selectedReport.petBreed})` : ""}
                </p>
                <p>
                  <strong>Motivo:</strong> {selectedReport.reason || "-"}
                </p>
                <p>
                  <strong>Reportado por:</strong> {selectedReport.reporterName} ({selectedReport.reporterEmail || "-"})
                </p>
                <p>
                  <strong>Dueno:</strong> {selectedReport.ownerName || "-"} ({selectedReport.ownerEmail || "-"})
                </p>
                <p>
                  <strong>Fecha:</strong> {formatDate(selectedReport.createdAt)}
                </p>
                {selectedReport.imageUrl ? (
                  <img
                    className="admin-report-image"
                    src={selectedReport.imageUrl}
                    alt={`Mascota reportada: ${selectedReport.petName}`}
                  />
                ) : null}
              </div>
            </div>
            <div className="actions">
              {!selectedReport.resolved ? (
                <>
                  <button
                    type="button"
                    className="button"
                    disabled={resolvingId === String(selectedReport.reportId)}
                    onClick={() => handleResolve(selectedReport.reportId, "approve")}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={resolvingId === String(selectedReport.reportId)}
                    onClick={() => handleResolve(selectedReport.reportId, "reject")}
                  >
                    Rechazar
                  </button>
                </>
              ) : null}
              <button type="button" className="button secondary" onClick={() => setSelectedReport(null)}>
                Cerrar
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </>
  );
}

export default AdminReportsPage;
