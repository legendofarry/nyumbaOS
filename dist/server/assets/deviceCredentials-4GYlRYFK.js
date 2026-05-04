const CREDENTIAL_SUPPORT = typeof window !== "undefined" && "credentials" in navigator && "PasswordCredential" in window;
function canUseDeviceCredentials() {
  return CREDENTIAL_SUPPORT;
}
async function saveDeviceCredential({
  email,
  password,
  name
}) {
  if (!canUseDeviceCredentials()) return false;
  const PasswordCredentialCtor = window.PasswordCredential;
  const credential = new PasswordCredentialCtor({
    id: email,
    password,
    name: name || email
  });
  await navigator.credentials.store(credential);
  return true;
}
async function getDeviceCredential() {
  if (!canUseDeviceCredentials()) return null;
  const credential = await navigator.credentials.get({
    password: true,
    mediation: "optional"
  });
  if (!credential?.id || !credential?.password) return null;
  return {
    email: String(credential.id),
    password: String(credential.password)
  };
}
export {
  canUseDeviceCredentials as c,
  getDeviceCredential as g,
  saveDeviceCredential as s
};
