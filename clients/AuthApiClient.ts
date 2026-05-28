import { APIRequestContext, TestInfo } from '@playwright/test';
import { callApiWithReport, ApiCallResult } from '../utils/apiReporter';

interface ClientOptions {
  request: APIRequestContext;
  testInfo: TestInfo;
}

interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthApiClient {
  private readonly request: APIRequestContext;
  private readonly testInfo: TestInfo;

  constructor({ request, testInfo }: ClientOptions) {
    this.request = request;
    this.testInfo = testInfo;
  }

  async login({ username, password }: LoginCredentials): Promise<ApiCallResult> {
    return callApiWithReport({
      requestContext: this.request,
      method: 'POST',
      url: '/auth/login',
      headers: { 'Content-Type': 'application/json' },
      data: { username, password },
      testInfo: this.testInfo,
      name: 'api-login'
    });
  }
}
