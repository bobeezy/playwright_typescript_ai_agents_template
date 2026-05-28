import { test, expect } from '../../fixtures/apiTest';
import { getRequiredEnv } from '../../utils/env';
import { AuthApiClient } from '../../clients/AuthApiClient';
import apiLoginData from '../../data/api/login.json';

const validUsername = getRequiredEnv('API_LOGIN_USERNAME');
const validPassword = getRequiredEnv('API_LOGIN_PASSWORD');
const maxResponseTimeMs = Number(process.env.API_MAX_RESPONSE_TIME_MS ?? 4000);

test.describe('API Login - positive and negative scenarios', () => {
  test('Positive: login returns access token', async ({ request }, testInfo) => {
    const authClient = new AuthApiClient({ request, testInfo });

    const { response, body, metrics } = await authClient.login({
      username: validUsername,
      password: validPassword
    });

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(responseBody.accessToken).toBeTruthy();
    expect(responseBody.refreshToken).toBeTruthy();
    expect(responseBody.username).toBe(validUsername);
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);
  });

  test('Negative: login fails with invalid password', async ({ request }, testInfo) => {
    const authClient = new AuthApiClient({ request, testInfo });

    const { response, body, metrics } = await authClient.login({
      username: validUsername,
      password: apiLoginData.negative.invalidPassword
    });

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(apiLoginData.negative.expectedStatus);
    expect(String(responseBody.message ?? '')).toMatch(
      new RegExp(apiLoginData.negative.expectedMessagePattern, 'i')
    );
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);
  });
});
