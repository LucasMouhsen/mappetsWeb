import { useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

function resolveProfileImage(userPicture) {
  if (!userPicture) return null;
  if (/^https?:\/\//i.test(userPicture)) return userPicture;
  return `${API_BASE_URL}/public/images/${encodeURIComponent(userPicture)}`;
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function AccountPage({ auth, adminAuth }) {
  const [imageError, setImageError] = useState(false);
  const user = auth?.user || null;
  const adminClaims = useMemo(() => decodeJwtPayload(adminAuth?.token), [adminAuth?.token]);
  const adminEmail = adminClaims?.email || adminClaims?.sub || "-";
  const adminRole = adminClaims?.role || adminClaims?.roles || "admin";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const initials = useMemo(() => {
    const name = fullName || user?.email || "M";
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user?.email, fullName]);
  const pictureUrl = resolveProfileImage(user?.userPicture);

  if (auth.loading || adminAuth?.loading) {
    return (
      <section className="request-card auth-card">
        <h1>Cargando cuenta...</h1>
      </section>
    );
  }

  if (!adminAuth?.token) {
    return (
      <section className="request-card auth-card">
        <h1>Sin sesion activa</h1>
        <p>Para ver tu cuenta debes iniciar sesion en `/admin/login`.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <small>Mi cuenta</small>
        <h1>Sesion admin activa</h1>
        <p>Panel de cuenta administrativa para acceso a reportes y comercios.</p>
      </section>

      <section className="request-card auth-card account-card" aria-labelledby="cuenta-titulo">
        <h2 id="cuenta-titulo">Datos de perfil</h2>
        <div className="account-grid account-grid--profile">
          <div className="card-inline account-avatar-card">
            <div className="account-avatar-wrap">
              {!imageError && pictureUrl && user ? (
                <img
                  className="account-avatar"
                  src={pictureUrl}
                  alt={`Foto de perfil de ${fullName || auth.user.email}`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="account-avatar account-avatar--fallback" aria-hidden="true">
                  {user ? initials : "AD"}
                </div>
              )}
            </div>
            <p className="account-name">{fullName || "Administrador Mappets"}</p>
          </div>
          <div className="card-inline account-data-card">
            {user ? (
              <>
                <p>
                  <strong>Nombre:</strong> {user.firstName || "-"}
                </p>
                <p>
                  <strong>Apellido:</strong> {user.lastName || "-"}
                </p>
                <p>
                  <strong>Email:</strong> {user.email || "-"}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Rol:</strong> {Array.isArray(adminRole) ? adminRole.join(", ") : String(adminRole)}
                </p>
                <p>
                  <strong>Email/ID:</strong> {adminEmail}
                </p>
                <p>
                  <strong>Estado:</strong> Activa
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default AccountPage;
