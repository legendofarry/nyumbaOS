// Browser-only stub for the example server function. Use Netlify functions for server logic.
export async function getGreeting(data: { name: string }) {
  const res = await fetch('/.netlify/functions/getGreeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
