import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { reportWebVitals } from "./lib/vitals";

// Force service worker update check on every page load
// This ensures users with stale cached chunks get the latest build
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.update();
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Collect Core Web Vitals asynchronously — zero impact on main bundle
reportWebVitals();
