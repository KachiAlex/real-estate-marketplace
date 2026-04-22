/**
 * Request Interceptor
 * Handles request/response intercepting for authentication and error handling
 */

export interface RequestInterceptorInterface {
  onRequest(config: any): any;
  onResponse(response: any): any;
  onError(error: any): any;
}

export class RequestInterceptor implements RequestInterceptorInterface {
  /**
   * Intercept outgoing requests
   */
  onRequest(config: any): any {
    throw new Error('Not implemented');
  }

  /**
   * Intercept successful responses
   */
  onResponse(response: any): any {
    throw new Error('Not implemented');
  }

  /**
   * Intercept error responses
   */
  onError(error: any): any {
    throw new Error('Not implemented');
  }
}
