import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  approveAdminShelterRequest,
  fetchAdminShelterRequests,
  rejectAdminShelterRequest,
  resolveAdminUserImageUrl,
  suspendAdminShelterRequest
} from "../services/adminShelterApi";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendientes" },
  { value: "APPROVED", label: "Aprobados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "SUSPENDED", label: "Suspendidos" }
];

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

function AdminSheltersPage({ adminAuth }) {
  const [activeStatus, setActiveStatus] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notesById, setNotesById] = useState({});
  const [modalError, setModalError] = useState("");

  const loadRequests = useCallback(
    async ({ silent = false } = {}) => {
      if (!adminAuth?.token) return;
      if (!silent) setLoading(true);
      setError("");

      try {
        const data = await fetchAdminShelterRequests(adminAuth.token, activeStatus);
        setRequests(data);
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
    loadRequests();
  }, [adminAuth?.token, loadRequests]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!selectedRequest) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedRequest]);

  const filteredRequests = useMemo(() => {
    const needle = normalizeText(search.trim());
    if (!needle) return requests;

    return requests.filter((item) => {
      const haystack = normalizeText(
        [
          item?.shelter?.displayName,
          item?.shelter?.address,
          item?.shelter?.phone,
          item?.user?.firstName,
          item?.user?.lastName,
          item?.user?.email,
          item?.statusCode
        ].join(" ")
      );
      return haystack.includes(needle);
    });
  }, [requests, search]);

  const updateStatus = async (item, action) => {
    if (!adminAuth?.token || !item?.userRoleId) return;

    const roleId = String(item.userRoleId);
    const notes = (notesById[roleId] || "").trim();
    if (action === "reject" && !notes) {
      setModalError("Para rechazar debes indicar un motivo en Notas internas.");
      setSelectedRequest(item);
      return;
    }

    setResolvingId(roleId);
    setError("");
    setNotice("");
    setModalError("");

    try {
      if (action === "approve") {
        await approveAdminShelterRequest(adminAuth.token, roleId, notes);
        setNotice("Solicitud aprobada.");
      } else if (action === "reject") {
        await rejectAdminShelterRequest(adminAuth.token, roleId, notes);
        setNotice("Solicitud rechazada.");
      } else {
        await suspendAdminShelterRequest(adminAuth.token, roleId, notes);
        setNotice("Refugio suspendido.");
      }

      await loadRequests({ silent: true });
      setSelectedRequest((current) =>
        current?.userRoleId === item.userRoleId
          ? { ...current, statusCode: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUSPENDED" }
          : current
      );
    } catch (actionError) {
      setError(actionError.message || "No se pudo actualizar la solicitud.");
    } finally {
      setResolvingId("");
    }
  };

  if (adminAuth?.loading) {
    return (
      <section className="request-card auth-card">
        <h1>Cargando modulo de refugios...</h1>
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
        <h1>Gestion de refugios</h1>
        <p>
          Revisa solicitudes de refugios y cambia su estado a aprobado, rechazado o suspendido.
        </p>
        <div className="actions">
          <a className="button secondary" href="/admin/comercios">
            Ir a comercios
          </a>
          <a className="button secondary" href="/admin/reports">
            Ir a reportes
          </a>
        </div>
      </section>

      <section className="section">
        <div className="admin-toolbar">
          <button className="button secondary" type="button" onClick={() => loadRequests({ silent: true })}>
            <span aria-hidden="true">↻</span>
            <span>Actualizar lista</span>
          </button>
        </div>

        <div className="admin-filters">
          <div className="input-group">
            <label htmlFor="filter-shelter-status">Estado</label>
            <select
              id="filter-shelter-status"
              value={activeStatus}
              onChange={(event) => setActiveStatus(event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="filter-shelter-search">Buscar</label>
            <input
              id="filter-shelter-search"
              type="search"
              placeholder="Refugio, usuario, email o direccion"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {notice ? <p className="feedback">{notice}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
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
                  <th>Refugio</th>
                  <th>Usuario</th>
                  <th>Contacto</th>
                  <th>Solicitado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((item) => {
                  const roleId = String(item.userRoleId);
                  const isResolving = resolvingId === roleId;
                  const canApprove = item.statusCode !== "APPROVED";
                  const canReject = item.statusCode !== "REJECTED";
                  const canSuspend = item.statusCode !== "SUSPENDED";

                  return (
                    <tr key={item.userRoleId}>
                      <td>
                        <span className={`admin-status-badge ${statusClass(item.statusCode)}`}>
                          {statusLabel(item.statusCode)}
                        </span>
                      </td>
                      <td>
                        <strong>{item?.shelter?.displayName || "-"}</strong>
                        <br />
                        <span className="muted">{item?.shelter?.address || "-"}</span>
                      </td>
                      <td>
                        {[item?.user?.firstName, item?.user?.lastName].filter(Boolean).join(" ") || "-"}
                        <br />
                        <span className="muted">{item?.user?.email || "-"}</span>
                      </td>
                      <td>{item?.shelter?.phone || "-"}</td>
                      <td>{formatDate(item.requestedAt)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() => setSelectedRequest(item)}
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            Ver
                          </button>
                          {canApprove ? (
                            <button type="button" className="button" disabled={isResolving} onClick={() => updateStatus(item, "approve")}>
                              Aprobar
                            </button>
                          ) : null}
                          {canReject ? (
                            <button
                              type="button"
                              className="button secondary"
                              disabled={isResolving}
                              onClick={() => {
                                setSelectedRequest(item);
                                setModalError("");
                              }}
                            >
                              Rechazar
                            </button>
                          ) : null}
                          {canSuspend ? (
                            <button type="button" className="button secondary" disabled={isResolving} onClick={() => updateStatus(item, "suspend")}>
                              Suspender
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {createPortal(
        <div className="modal-backdrop" hidden={!selectedRequest}>
          {selectedRequest ? (
            <article className="modal admin-modal" role="dialog" aria-modal="true" aria-labelledby="shelter-title">
              <header>
                <h2 id="shelter-title">{selectedRequest?.shelter?.displayName || "Solicitud de refugio"}</h2>
              </header>
              <div className="content">
                <div className="card-inline">
                  <p>
                    <strong>Estado:</strong> {statusLabel(selectedRequest.statusCode)}
                  </p>
                  <p>
                    <strong>Usuario:</strong>{" "}
                    {[selectedRequest?.user?.firstName, selectedRequest?.user?.lastName].filter(Boolean).join(" ") || "-"}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedRequest?.user?.email || "-"}
                  </p>
                  <p>
                    <strong>Direccion:</strong> {selectedRequest?.shelter?.address || "-"}
                  </p>
                  <p>
                    <strong>Telefono:</strong> {selectedRequest?.shelter?.phone || "-"}
                  </p>
                  <p>
                    <strong>Solicitado:</strong> {formatDate(selectedRequest?.requestedAt)}
                  </p>
                  <p>
                    <strong>Revisado:</strong> {formatDate(selectedRequest?.reviewedAt)}
                  </p>
                  {selectedRequest?.user?.userPicture ? (
                    <img
                      className="admin-report-image"
                      src={resolveAdminUserImageUrl(selectedRequest.user.userPicture)}
                      alt="Foto de perfil del usuario"
                    />
                  ) : null}
                  <div className="input-group">
                    <label htmlFor="shelter-review-notes">Notas internas</label>
                    <textarea
                      id="shelter-review-notes"
                      value={notesById[String(selectedRequest.userRoleId)] || ""}
                      onChange={(event) => {
                        setModalError("");
                        setNotesById((current) => ({
                          ...current,
                          [String(selectedRequest.userRoleId)]: event.target.value
                        }));
                      }}
                      placeholder="Motivo/referencia de la decision"
                      maxLength={500}
                    />
                  </div>
                  {modalError ? <p className="feedback error">{modalError}</p> : null}
                </div>
              </div>
              <div className="actions">
                {selectedRequest.statusCode !== "APPROVED" ? (
                  <button
                    type="button"
                    className="button"
                    disabled={resolvingId === String(selectedRequest.userRoleId)}
                    onClick={() => updateStatus(selectedRequest, "approve")}
                  >
                    Aprobar
                  </button>
                ) : null}
                {selectedRequest.statusCode !== "REJECTED" ? (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={resolvingId === String(selectedRequest.userRoleId)}
                    onClick={() => updateStatus(selectedRequest, "reject")}
                  >
                    Rechazar
                  </button>
                ) : null}
                {selectedRequest.statusCode !== "SUSPENDED" ? (
                  <button
                    type="button"
                    className="button secondary"
                    disabled={resolvingId === String(selectedRequest.userRoleId)}
                    onClick={() => updateStatus(selectedRequest, "suspend")}
                  >
                    Suspender
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setSelectedRequest(null);
                    setModalError("");
                  }}
                >
                  Cerrar
                </button>
              </div>
            </article>
          ) : null}
        </div>,
        document.body
      )}
    </>
  );
}

export default AdminSheltersPage;
