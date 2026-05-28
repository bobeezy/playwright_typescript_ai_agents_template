import { APIRequestContext, APIResponse, TestInfo } from '@playwright/test';

interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffMs: number;
  retryOnNetworkError: boolean;
}

interface AttemptRecord {
  attempt: number;
  durationMs: number;
  status: number | null;
  ok: boolean;
  retryTriggered: boolean;
  error?: string;
}

export interface ApiCallMetrics {
  attempts: number;
  totalDurationMs: number;
  finalAttemptDurationMs: number;
}

export interface ApiCallResult {
  response: APIResponse;
  body: unknown;
  metrics: ApiCallMetrics;
}

export interface CallApiOptions {
  requestContext: APIRequestContext;
  method: string;
  url: string;
  testInfo: TestInfo;
  name: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: unknown;
  retryPolicy?: RetryPolicy;
}

function getSensitiveValues(): string[] {
  return [
    process.env.WEB_LOGIN_USERNAME,
    process.env.WEB_LOGIN_PASSWORD,
    process.env.API_LOGIN_USERNAME,
    process.env.API_LOGIN_PASSWORD
  ].filter((v): v is string => Boolean(v));
}

function shouldRedactKey(key: unknown): boolean {
  const keyLower = String(key).toLowerCase();
  const sensitiveKeyParts = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'cookie',
    'set-cookie',
    'secret',
    'session',
    'apikey',
    'api-key'
  ];
  return sensitiveKeyParts.some((part) => keyLower.includes(part));
}

function redactTokenLikeStrings(value: string): string {
  let output = value;
  output = output.replace(/bearer\s+[a-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
  output = output.replace(/\beyJ[A-Za-z0-9._-]+\b/g, '[REDACTED_JWT]');
  return output;
}

function sanitizeValue(value: unknown, sensitiveValues: string[], parentKey = ''): unknown {
  if (shouldRedactKey(parentKey)) {
    return '[REDACTED]';
  }

  if (typeof value === 'string') {
    let sanitized = redactTokenLikeStrings(value);
    for (const secret of sensitiveValues) {
      sanitized = sanitized.split(secret).join('[REDACTED]');
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, sensitiveValues, parentKey));
  }

  if (value !== null && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = sanitizeValue(nested, sensitiveValues, key);
    }
    return output;
  }

  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

function toInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRetryPolicy(): RetryPolicy {
  const testEnv = String(process.env.TEST_ENV ?? 'local').toLowerCase();
  const isProd = testEnv === 'prod' || testEnv === 'production';

  const explicitlyEnabled = String(process.env.API_RETRY_ENABLED ?? '').toLowerCase() === 'true';
  const maxAttempts = Math.max(1, toInt(process.env.API_RETRY_MAX_ATTEMPTS, 2));
  const backoffMs = Math.max(0, toInt(process.env.API_RETRY_BACKOFF_MS, 300));

  return {
    enabled: !isProd && explicitlyEnabled,
    maxAttempts,
    backoffMs,
    retryOnNetworkError: true
  };
}

export async function callApiWithReport({
  requestContext,
  method,
  url,
  testInfo,
  name,
  headers,
  params,
  data,
  retryPolicy
}: CallApiOptions): Promise<ApiCallResult> {
  const policy = retryPolicy ?? getRetryPolicy();
  const attemptsLimit = policy.enabled ? policy.maxAttempts : 1;

  const startedAt = Date.now();
  const sensitiveValues = getSensitiveValues();
  const attempts: AttemptRecord[] = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    const attemptStart = Date.now();

    try {
      const response = await requestContext.fetch(url, {
        method,
        headers,
        params,
        data: data as Record<string, unknown> | undefined
      });

      const durationMs = Date.now() - attemptStart;
      attempts.push({
        attempt,
        durationMs,
        status: response.status(),
        ok: response.ok(),
        retryTriggered: isRetryableStatus(response.status()) && attempt < attemptsLimit
      });

      if (isRetryableStatus(response.status()) && attempt < attemptsLimit) {
        await sleep(policy.backoffMs * attempt);
        continue;
      }

      const fullUrl = response.url();
      const requestPayload = {
        method,
        url: fullUrl,
        relativeUrl: url,
        headers: sanitizeValue(headers ?? {}, sensitiveValues),
        params: sanitizeValue(params ?? {}, sensitiveValues),
        body: sanitizeValue(data ?? {}, sensitiveValues),
        retryPolicy: policy
      };

      const responseBodyText = await response.text();
      let parsedBody: unknown = responseBodyText;
      try {
        parsedBody = JSON.parse(responseBodyText);
      } catch {
        // Keep raw text when response is not JSON.
      }

      const responsePayload = {
        url: fullUrl,
        status: response.status(),
        statusText: response.statusText(),
        ok: response.ok(),
        headers: sanitizeValue(response.headers(), sensitiveValues),
        body: sanitizeValue(parsedBody, sensitiveValues),
        metrics: {
          attempts,
          totalDurationMs: Date.now() - startedAt,
          finalAttemptDurationMs: durationMs
        }
      };

      await testInfo.attach(`${name}-request.json`, {
        body: Buffer.from(JSON.stringify(requestPayload, null, 2)),
        contentType: 'application/json'
      });

      await testInfo.attach(`${name}-response.json`, {
        body: Buffer.from(JSON.stringify(responsePayload, null, 2)),
        contentType: 'application/json'
      });

      return {
        response,
        body: parsedBody,
        metrics: {
          attempts: attempts.length,
          totalDurationMs: Date.now() - startedAt,
          finalAttemptDurationMs: durationMs
        }
      };
    } catch (error) {
      const durationMs = Date.now() - attemptStart;
      attempts.push({
        attempt,
        durationMs,
        status: null,
        ok: false,
        retryTriggered: policy.retryOnNetworkError && attempt < attemptsLimit,
        error: String(error instanceof Error ? error.message : error)
      });

      lastError = error;

      if (!(policy.retryOnNetworkError && attempt < attemptsLimit)) {
        break;
      }

      await sleep(policy.backoffMs * attempt);
    }
  }

  const failPayload = {
    method,
    relativeUrl: url,
    retryPolicy: policy,
    attempts,
    error: String(lastError instanceof Error ? lastError.message : lastError ?? 'Unknown network error')
  };

  await testInfo.attach(`${name}-failure.json`, {
    body: Buffer.from(JSON.stringify(failPayload, null, 2)),
    contentType: 'application/json'
  });

  throw lastError;
}
