import type { SapConfig } from './config';
import { SapServiceLayerError } from './errors';
import type {
  SapLoginRequest,
  SapLoginResponse,
  SapSessionCookies,
  SapSessionRecord,
} from './types';

type PendingLogin = Promise<SapSessionRecord>;

/**
 * Gestiona sesiones Service Layer por CompanyDB (cookies B1SESSION / ROUTEID).
 */
export class SapSessionManager {
  private readonly sessions = new Map<string, SapSessionRecord>();
  private readonly pendingLogins = new Map<string, PendingLogin>();

  constructor(private readonly config: SapConfig) {}

  resolveCompanyDb(companyDb?: string): string {
    return companyDb?.trim() || this.config.defaultCompanyDb;
  }

  async getSession(companyDb?: string): Promise<SapSessionRecord> {
    const db = this.resolveCompanyDb(companyDb);
    const existing = this.sessions.get(db);
    if (existing && existing.expiresAt > Date.now()) {
      return existing;
    }

    const pending = this.pendingLogins.get(db);
    if (pending) return pending;

    const loginPromise = this.login(db).finally(() => {
      this.pendingLogins.delete(db);
    });
    this.pendingLogins.set(db, loginPromise);
    return loginPromise;
  }

  invalidate(companyDb?: string): void {
    const db = this.resolveCompanyDb(companyDb);
    this.sessions.delete(db);
  }

  async logout(companyDb?: string): Promise<void> {
    const db = this.resolveCompanyDb(companyDb);
    const session = this.sessions.get(db);
    if (!session) return;

    try {
      await fetch(`${this.config.baseUrl}/Logout`, {
        method: 'POST',
        headers: this.cookieHeaders(session.cookies),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch {
      // Best-effort logout; la sesión local se elimina igualmente.
    } finally {
      this.sessions.delete(db);
    }
  }

  private async login(companyDb: string): Promise<SapSessionRecord> {
    const body: SapLoginRequest = {
      CompanyDB: companyDb,
      UserName: this.config.userName,
      Password: this.config.password,
    };

    const response = await fetch(`${this.config.baseUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new SapServiceLayerError(
        response.status === 401 ? 'SAP_AUTH_FAILED' : 'SAP_AUTH_FAILED',
        `Login SAP falló para ${companyDb}: HTTP ${response.status}`,
        { companyDb, httpStatus: response.status, sapMessage: text },
        { retryable: response.status >= 500 }
      );
    }

    const cookies = extractSessionCookies(response);
    if (!cookies.B1SESSION) {
      throw new SapServiceLayerError(
        'SAP_AUTH_FAILED',
        'Login SAP exitoso pero sin cookie B1SESSION',
        { companyDb }
      );
    }

    let loginPayload: SapLoginResponse = {};
    try {
      loginPayload = (await response.json()) as SapLoginResponse;
    } catch {
      // Algunos entornos devuelven cuerpo vacío; las cookies bastan.
    }

    const sessionTimeoutMinutes = loginPayload.SessionTimeout ?? 30;
    const ttlMs = Math.min(this.config.sessionTtlMs, sessionTimeoutMinutes * 60 * 1000);

    const record: SapSessionRecord = {
      companyDb,
      cookies,
      expiresAt: Date.now() + ttlMs,
    };

    this.sessions.set(companyDb, record);
    return record;
  }

  cookieHeaders(cookies: SapSessionCookies): Record<string, string> {
    const parts = [`B1SESSION=${cookies.B1SESSION}`];
    if (cookies.ROUTEID) parts.push(`ROUTEID=${cookies.ROUTEID}`);
    return {
      Cookie: parts.join('; '),
      'Content-Type': 'application/json',
    };
  }
}

function extractSessionCookies(response: Response): SapSessionCookies {
  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : ([response.headers.get('set-cookie')].filter(Boolean) as string[]);

  const cookies: SapSessionCookies = { B1SESSION: '' };

  for (const raw of setCookies) {
    const b1 = raw.match(/B1SESSION=([^;]+)/i);
    const route = raw.match(/ROUTEID=([^;]+)/i);
    if (b1) cookies.B1SESSION = b1[1];
    if (route) cookies.ROUTEID = route[1];
  }

  return cookies;
}
