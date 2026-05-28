import { test, expect } from '../../fixtures/apiTest';
import { UserApiClient } from '../../clients/UserApiClient';

const maxResponseTimeMs = Number(process.env.API_MAX_RESPONSE_TIME_MS ?? 4000);
const existingUserId = 1;

test.describe.serial('API User CRUD (dummyjson-compatible)', () => {
  let createdUser: Record<string, unknown>;

  test('POST: create a user', async ({ request }, testInfo) => {
    const userClient = new UserApiClient({ request, testInfo });

    const { response, body, metrics } = await userClient.createUser({
      firstName: 'Playwright',
      lastName: 'Automation',
      age: 30
    });

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    expect(responseBody.id).toBeTruthy();
    expect(responseBody.firstName).toBe('Playwright');
    expect(responseBody.lastName).toBe('Automation');
    expect(responseBody.age).toBe(30);
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);

    createdUser = responseBody;
  });

  test('GET: read existing user', async ({ request }, testInfo) => {
    const userClient = new UserApiClient({ request, testInfo });
    const { response, body, metrics } = await userClient.getUser(existingUserId);

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(responseBody.id).toBe(existingUserId);
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);
  });

  test('PUT: update existing user', async ({ request }, testInfo) => {
    const userClient = new UserApiClient({ request, testInfo });
    const { response, body, metrics } = await userClient.updateUser(existingUserId, {
      firstName: 'UpdatedPlaywright'
    });

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(responseBody.firstName).toBe('UpdatedPlaywright');
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);
  });

  test('DELETE: delete existing user', async ({ request }, testInfo) => {
    const userClient = new UserApiClient({ request, testInfo });
    const { response, body, metrics } = await userClient.deleteUser(existingUserId);

    const responseBody = body as Record<string, unknown>;
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    expect(responseBody.id).toBe(existingUserId);
    expect(responseBody.isDeleted).toBeTruthy();
    expect(metrics.finalAttemptDurationMs).toBeLessThan(maxResponseTimeMs);
  });

  test('POST contract: created response remains traceable', async () => {
    expect(createdUser).toBeTruthy();
    expect(createdUser.id).toBeTruthy();
  });
});
