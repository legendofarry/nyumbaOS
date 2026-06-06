import { renderErrorPage } from "./lib/error-page";

// Server start instance removed for browser-only build. Export a harmless placeholder.
export const startInstance = {
  requestMiddleware: [],
  // Keep the error renderer available for any potential server-side usage elsewhere.
  renderErrorPage,
};
