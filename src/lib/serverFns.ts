async function callApi(path: string, body?: any) {
  const res = await fetch(`/.netlify/functions/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function ensureOwnerClient() {
  return callApi('ensureOwner');
}

export function createTenantClient(data: any) {
  return callApi('createTenant', data);
}

export function deleteTenantClient(data: { tenant_id: string }) {
  return callApi('deleteTenant', data);
}

export function askAssistantClient(data: any) {
  return callApi('askAssistant', data);
}

export default { ensureOwnerClient, createTenantClient, deleteTenantClient, askAssistantClient };
