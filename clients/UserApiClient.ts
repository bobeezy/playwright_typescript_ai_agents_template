import { APIRequestContext, TestInfo } from '@playwright/test';
import { callApiWithReport, ApiCallResult } from '../utils/apiReporter';

interface ClientOptions {
  request: APIRequestContext;
  testInfo: TestInfo;
}

export class UserApiClient {
  private readonly request: APIRequestContext;
  private readonly testInfo: TestInfo;

  constructor({ request, testInfo }: ClientOptions) {
    this.request = request;
    this.testInfo = testInfo;
  }

  async createUser(data: Record<string, unknown>): Promise<ApiCallResult> {
    return callApiWithReport({
      requestContext: this.request,
      method: 'POST',
      url: '/users/add',
      headers: { 'Content-Type': 'application/json' },
      data,
      testInfo: this.testInfo,
      name: 'api-user-create'
    });
  }

  async getUser(id: number): Promise<ApiCallResult> {
    return callApiWithReport({
      requestContext: this.request,
      method: 'GET',
      url: `/users/${id}`,
      testInfo: this.testInfo,
      name: 'api-user-read'
    });
  }

  async updateUser(id: number, data: Record<string, unknown>): Promise<ApiCallResult> {
    return callApiWithReport({
      requestContext: this.request,
      method: 'PUT',
      url: `/users/${id}`,
      headers: { 'Content-Type': 'application/json' },
      data,
      testInfo: this.testInfo,
      name: 'api-user-update'
    });
  }

  async deleteUser(id: number): Promise<ApiCallResult> {
    return callApiWithReport({
      requestContext: this.request,
      method: 'DELETE',
      url: `/users/${id}`,
      testInfo: this.testInfo,
      name: 'api-user-delete'
    });
  }
}
