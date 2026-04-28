import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Sentry error & performance monitoring
Sentry.init({
  dsn: "https://fd6379da784709853c390f687e27b0be@o4511295854542848.ingest.de.sentry.io/4511295863586896",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  environment: import.meta.env.MODE,
});
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
