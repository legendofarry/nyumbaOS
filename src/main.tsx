import "./lib/error-capture";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";

const router = getRouter();
const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Ensure SW is registered as early as possible in production
if (typeof navigator !== "undefined" && "serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      console.log("Service worker registered:", registration);
    })
    .catch((err) => {
      console.warn("Service worker registration failed:", err);
    });
}

// Register service worker in production builds
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service worker registered:", registration);
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New content is available; you can notify the user here.
                console.log("New content available; please refresh.");
              }
            });
          });
        })
        .catch((err) => {
          console.warn("Service worker registration failed:", err);
        });
    });
  }
}
