import { useCallback, useEffect, useMemo, useState } from "react";
import SiteLayout from "./components/SiteLayout";
import HomePage from "./pages/HomePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import LegalNoticePage from "./pages/LegalNoticePage";
import SupportPage from "./pages/SupportPage";
import CommerceSignupPage from "./pages/CommerceSignupPage";
import DataDeletionPage from "./pages/DataDeletionPage";
import DonationsRedirectPage from "./pages/DonationsRedirectPage";
import AuthPortalPage from "./pages/AuthPortalPage";
import AccountPage from "./pages/AccountPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminCommercesPage from "./pages/AdminCommercesPage";
import AdminSheltersPage from "./pages/AdminSheltersPage";
import {
  fetchProfile,
  getStoredToken,
  clearStoredToken
} from "./services/authApi";
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  loginAdminWithEmailPassword,
  storeAdminToken
} from "./services/adminAuthApi";

const routeConfig = {
  "/": {
    key: "inicio",
    title: "Mappets | Comunidad para mascotas",
    description:
      "Mappets es la app que conecta a familias y rescatistas para proteger y reencontrar mascotas.",
    component: HomePage
  },
  "/privacidad": {
    key: "privacidad",
    title: "Mappets | Politica de Privacidad",
    description:
      "Politica de privacidad de Mappets: datos recopilados, uso, derechos y contacto.",
    component: PrivacyPage
  },
  "/terminos": {
    key: "terminos",
    title: "Mappets | Terminos y Condiciones",
    description: "Lee los terminos y condiciones de uso de la plataforma Mappets.",
    component: TermsPage
  },
  "/aviso-legal": {
    key: "aviso-legal",
    title: "Mappets | Aviso Legal",
    description: "Aviso legal de Mappets y datos de contacto del responsable del servicio.",
    component: LegalNoticePage
  },
  "/soporte": {
    key: "soporte",
    title: "Mappets | Soporte",
    description:
      "Centro de ayuda de Mappets: contacto de soporte, preguntas frecuentes y tiempos de respuesta.",
    component: SupportPage
  },
  "/alta-comercio": {
    key: "alta-comercio",
    title: "Mappets | Alta de comercios",
    description:
      "Solicita el alta de tu veterinaria, petshop o comercio aliado en Mappets.",
    component: CommerceSignupPage
  },
  "/solicitud-eliminacion": {
    key: "solicitud-eliminacion",
    title: "Mappets | Solicitud de eliminacion de datos",
    description:
      "Solicita la eliminacion de tus datos personales registrados en Mappets.",
    component: DataDeletionPage
  },
  "/donaciones": {
    key: "donaciones",
    title: "Mappets | Donaciones",
    description: "Redirigiendo a la seccion de donaciones en Inicio.",
    component: DonationsRedirectPage
  },
  "/mi-cuenta": {
    key: "mi-cuenta",
    title: "Mappets | Mi cuenta",
    description: "Perfil autenticado de usuario Mappets.",
    component: AccountPage
  },
  "/admin/login": {
    key: "admin-login",
    title: "Mappets | Admin login",
    description: "Acceso administrativo para gestion de reportes en Mappets.",
    component: AuthPortalPage
  },
  "/admin/reports": {
    key: "admin-reportes",
    title: "Mappets | Panel de reportes",
    description: "Panel administrativo para revisar y resolver reportes de mascotas.",
    component: AdminReportsPage
  },
  "/admin/comercios": {
    key: "admin-comercios",
    title: "Mappets | Panel de comercios",
    description: "Panel administrativo para crear y gestionar comercios aliados.",
    component: AdminCommercesPage
  },
  "/admin/refugios": {
    key: "admin-refugios",
    title: "Mappets | Panel de refugios",
    description: "Panel administrativo para gestionar solicitudes y estados de refugios.",
    component: AdminSheltersPage
  }
};

function resolveRoute() {
  const path = window.location.pathname || "/";
  return routeConfig[path] || routeConfig["/"];
}

function App() {
  const route = useMemo(resolveRoute, []);
  const Page = route.component;
  const [auth, setAuth] = useState({
    token: null,
    user: null,
    loading: true
  });
  const [adminAuth, setAdminAuth] = useState({
    token: null,
    loading: true
  });

  const logout = useCallback(() => {
    clearStoredToken();
    setAuth({
      token: null,
      user: null,
      loading: false
    });
  }, []);

  const logoutAdmin = useCallback(() => {
    clearStoredAdminToken();
    clearStoredToken();
    setAdminAuth({
      token: null,
      loading: false
    });
    setAuth({
      token: null,
      user: null,
      loading: false
    });
  }, []);

  const loadProfileFromToken = useCallback(async (token) => {
    try {
      const profile = await fetchProfile(token);
      setAuth({
        token,
        user: profile,
        loading: false
      });
    } catch {
      clearStoredToken();
      setAuth({
        token: null,
        user: null,
        loading: false
      });
    }
  }, []);

  const loginAdmin = useCallback(async ({ email, password }) => {
    const token = await loginAdminWithEmailPassword(email, password);
    storeAdminToken(token);
    try {
      await loadProfileFromToken(token);
    } catch {
      // Si el backend no permite perfil con token admin, mantenemos el panel admin operativo.
    }
    setAdminAuth({
      token,
      loading: false
    });
    window.location.href = "/mi-cuenta";
  }, [loadProfileFromToken]);

  useEffect(() => {
    document.title = route.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", route.description);
  }, [route]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAuth({
        token: null,
        user: null,
        loading: false
      });
      return;
    }
    loadProfileFromToken(token);
  }, [loadProfileFromToken]);

  useEffect(() => {
    const token = getStoredAdminToken();
    setAdminAuth({
      token: token || null,
      loading: false
    });
  }, []);

  useEffect(() => {
    if (!adminAuth?.token) return;
    if (auth?.user) return;
    loadProfileFromToken(adminAuth.token).catch(() => {});
  }, [adminAuth?.token, auth?.user, loadProfileFromToken]);

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <SiteLayout current={route.key} auth={auth} adminAuth={adminAuth} onLogout={logout} onAdminLogout={logoutAdmin}>
      <Page auth={auth} onLogout={logout} adminAuth={adminAuth} onAdminLogin={loginAdmin} onAdminLogout={logoutAdmin} />
    </SiteLayout>
  );
}

export default App;
