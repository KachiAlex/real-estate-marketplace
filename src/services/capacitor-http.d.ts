/**
 * Type declarations for @capacitor/http
 * This is a minimal declaration for the Capacitor HTTP plugin
 */

declare module '@capacitor/http' {
  export interface HttpRequestOptions {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: any;
    connectTimeout?: number;
    readTimeout?: number;
  }

  export interface HttpResponse {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: any;
  }

  export const Http: {
    request(options: HttpRequestOptions): Promise<HttpResponse>;
  };
}
