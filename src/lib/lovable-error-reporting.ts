export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  // Lovable integration removed — keep a local console fallback for error visibility.
  console.error('[Lovable removed] Error captured:', error, context);
}
