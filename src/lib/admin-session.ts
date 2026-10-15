const encoder = new TextEncoder();
const TTL_MS = 8 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 60 * 1000;

async function keyFor(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createAdminSession(secret: string): Promise<string> {
  if (secret.length < 24) throw new Error('APP_ADMIN_TOKEN deve ter pelo menos 24 caracteres.');
  const expires = Date.now() + TTL_MS;
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const payload = ['v1', expires, nonce].join('.');
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await keyFor(secret), encoder.encode(payload)));
  const signature = Array.from(mac, byte => byte.toString(16).padStart(2, '0')).join('');
  return payload + '.' + signature;
}

export async function validAdminSession(cookie: string | null, secret?: string): Promise<boolean> {
  if (!secret || secret.length < 24 || !cookie || cookie.length > 200) return false;
  const match = /^(v1\.([0-9]{13})\.([a-f0-9]{32}))\.([a-f0-9]{64})$/.exec(cookie);
  if (!match) return false;
  const expires = Number(match[2]);
  const now = Date.now();
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + TTL_MS + MAX_CLOCK_SKEW_MS) return false;
  try {
    const hex = match[4];
    const sig = Uint8Array.from(hex.match(/../g) || [], x => parseInt(x, 16));
    return crypto.subtle.verify('HMAC', await keyFor(secret), sig, encoder.encode(match[1]));
  } catch {
    return false;
  }
}
