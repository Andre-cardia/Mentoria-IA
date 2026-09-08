import { useState, useEffect, useCallback } from "react";
import AuditoriaLandingPage from "./AuditoriaLandingPage.jsx";
import AuditoriaChecklistPage from "./AuditoriaChecklistPage.jsx";

export { AuditoriaLandingPage, AuditoriaChecklistPage };

function isChecklistRoute(path = "", search = "", hash = "") {
  const normalizedPath = (path || "").toLowerCase().replace(/\/+$/, "");
  return (
    normalizedPath.endsWith("/checklist") ||
    normalizedPath.includes("/checklist") ||
    search.includes("tab=checklist") ||
    search.includes("view=checklist") ||
    hash === "#checklist" ||
    hash === "#checklist-interativo" ||
    hash === "#diagnostico"
  );
}

/**
 * @param {{ initialRoute?: string, defaultView?: string }} [props]
 */
export default function AuditoriaPage({ initialRoute = "", defaultView = "" } = {}) {
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (defaultView === "checklist" || defaultView === "landing") {
      return defaultView;
    }
    if (initialRoute) {
      return isChecklistRoute(initialRoute) ? "checklist" : "landing";
    }
    if (typeof window !== "undefined") {
      return isChecklistRoute(
        window.location.pathname,
        window.location.search,
        window.location.hash
      )
        ? "checklist"
        : "landing";
    }
    return "landing";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const isChecklist = isChecklistRoute(
        window.location.pathname,
        window.location.search,
        window.location.hash
      );
      setCurrentRoute(isChecklist ? "checklist" : "landing");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToChecklist = useCallback(() => {
    setCurrentRoute("checklist");
    if (typeof window !== "undefined") {
      const targetUrl = window.location.pathname.startsWith("/auditoria")
        ? "/auditoria/checklist"
        : "/auditoria/checklist";
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, "", targetUrl);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const navigateToLanding = useCallback(() => {
    setCurrentRoute("landing");
    if (typeof window !== "undefined") {
      const targetUrl = "/auditoria";
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, "", targetUrl);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  if (currentRoute === "checklist") {
    return <AuditoriaChecklistPage onNavigateToLanding={navigateToLanding} />;
  }

  return <AuditoriaLandingPage onNavigateToChecklist={navigateToChecklist} />;
}
