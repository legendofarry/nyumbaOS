const CREDENTIAL_SUPPORT =
  typeof window !== "undefined" &&
  "credentials" in navigator &&
  "PasswordCredential" in window;

export function canUseDeviceCredentials() {
  return CREDENTIAL_SUPPORT;
}

export async function saveDeviceCredential({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}) {
  if (!canUseDeviceCredentials()) return false;

  const PasswordCredentialCtor = (window as any).PasswordCredential;
  const credential = new PasswordCredentialCtor({
    id: email,
    password,
    name: name || email,
  });

  await (navigator.credentials as any).store(credential);
  return true;
}

export async function getDeviceCredential() {
  if (!canUseDeviceCredentials()) return null;

  const credential = await (navigator.credentials as any).get({
    password: true,
    mediation: "optional",
  });

  if (!credential?.id || !credential?.password) return null;

  return {
    email: String(credential.id),
    password: String(credential.password),
  };
}
