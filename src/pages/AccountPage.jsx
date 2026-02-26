import { useMemo, useState } from "react";
import { API_BASE_URL } from "../config";

function resolveProfileImage(userPicture) {
  if (!userPicture) return null;
  if (/^https?:\/\//i.test(userPicture)) return userPicture;
  return `${API_BASE_URL}/public/images/${encodeURIComponent(userPicture)}`;
}

function AccountPage({ auth }) {
  const [imageError, setImageError] = useState(false);
  const user = auth?.user || null;
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

  if (auth.loading) {
    return (
      <section className="request-card auth-card">
        <h1>Cargando cuenta...</h1>
      </section>
    );
  }

  if (!auth.user) {
    return (
      <section className="request-card auth-card">
        <h1>Sin sesion activa</h1>
        <p>Para ver tu cuenta primero debes iniciar sesion ingresando manualmente a `/admin/login`.</p>
      </section>
    );
  }

  return (
    <>
      <section className="hero">
        <small>Mi cuenta</small>
        <h1>Sesion activa</h1>
        <p>Esta informacion se obtiene desde `DogWalker-backend` usando tu token JWT.</p>
      </section>

      <section className="request-card auth-card account-card" aria-labelledby="cuenta-titulo">
        <h2 id="cuenta-titulo">Datos de perfil</h2>
        <div className="account-grid account-grid--profile">
          <div className="card-inline account-avatar-card">
            <div className="account-avatar-wrap">
              {!imageError && pictureUrl ? (
                <img
                  className="account-avatar"
                  src={pictureUrl}
                  alt={`Foto de perfil de ${fullName || auth.user.email}`}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="account-avatar account-avatar--fallback" aria-hidden="true">
                  {initials}
                </div>
              )}
            </div>
            <p className="account-name">{fullName || "Usuario Mappets"}</p>
          </div>
          <div className="card-inline account-data-card">
            <p>
              <strong>Nombre:</strong> {auth.user.firstName || "-"}
            </p>
            <p>
              <strong>Apellido:</strong> {auth.user.lastName || "-"}
            </p>
            <p>
              <strong>Email:</strong> {auth.user.email || "-"}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default AccountPage;
