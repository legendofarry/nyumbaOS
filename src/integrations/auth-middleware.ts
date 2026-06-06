// Server middleware removed for browser-only build. Export a placeholder function to avoid bundling server-only APIs.
export function requireSupabaseAuth() {
  throw new Error('Server middleware removed. This project is configured as a static frontend; move auth checks to Netlify/Firebase functions.');
}
