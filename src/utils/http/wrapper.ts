/* eslint-disable @typescript-eslint/no-explicit-any */
import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { APIError, HttpError, TimeoutError } from './errors';
// import { encode } from './jwt';

export interface RequestConfig {
  service: string;
}

/**
 * Any type of async code to be run. Not the actions will not be bound to the
 * request wrapper.
 */
export type Action = () => Promise<void>;
/**
 * A function that can configure an axios request. Use the `defer` function
 * to push async work till the end of configuration
 */
export type Plugin<T = any> = (
  req: Partial<AxiosRequestConfig<T>>,
  defer: (action: Action) => void
) => void;

export type RequestData<T extends object> = T | string;

export class RequestWrapper<T extends object> {
  private asyncActions: Action[] = [];

  constructor(
    protected instance: AxiosInstance,
    protected config: RequestConfig,
    protected request: Partial<AxiosRequestConfig<RequestData<T>>>
  ) {
    this.request.headers = Object.assign({}, this.request.headers);
  }

  /**
   * Adds asynchronous code to be run just before making a request. This mainly
   * helps to keep the wrapper API consisten by not doing anything async till the requeust
   * is made
   * @param action asynchronous action.
   */
  protected defer(action: Action) {
    this.asyncActions.push(action);
    return this;
  }

  /**
   * Use a plugin
   * @param plugin any function that wants to configure an axios request
   */
  use(plugin: Plugin<RequestData<T>>) {
    plugin(this.request, (action: Action) => {
      this.defer(action);
    });

    return this;
  }

  /**
   * Set the content-type of the request
   * @param t type of request body
   */
  type(
    t:
      | 'application/json'
      | 'application/x-www-form-urlencoded'
      | 'text/plain'
      | 'text/html'
      | 'application/xml' = 'application/json'
  ) {
    Object.assign(this.request.headers as object, {
      'Content-Type': t,
    });

    return this;
  }

  /**
   * Set multiple header values at once
   * @param headers header key value pairs
   */
  /**
   * Set multiple headers at once
   * @param headers Header key-value pairs
   */
  set(headers: Record<string, string>): this;
  /**
   * Set a single header value
   * @param key Header name
   * @param value Header value
   */
  set(
    key:
      | 'Accept'
      | 'Content-Type'
      | 'Authorization'
      | 'X-Custom-Header'
      | 'X-Request-ID'
      | 'X-Origin-Service',
    value:
      | 'application/json'
      | 'application/x-www-form-urlencoded'
      | 'text/plain'
      | 'text/html'
      | 'application/xml'
      | 'Bearer'
  ): this;
  set(key: Record<string, string> | string, value?: string) {
    let headers = {};
    if (typeof key === 'string') {
      (headers as Record<string, string>)[key] = value as string;
    } else {
      headers = key;
    }

    Object.assign(this.request.headers as object, typeof key === 'string' ? { [key]: value } : key);

    return this;
  }

  /**
   * Enable distributed tracing on the request
   * @param req source request if there's any
   */
  track() {
    Object.assign(this.request.headers as object, {
      'X-Origin-Service': this.config.service,
    });

    return this;
  }

  /**
   * Set the request body
   * @param data request body data
   */
  setBody(data: T) {
    this.request.data = data;
    return this;
  }

  /**
   * Runs the API request and handles errors.
   * @param timeout timeout for request in seconds
   */
  async do<T = any>(timeout = 15): Promise<T> {
    await Promise.all(this.asyncActions.map(action => action()));

    try {
      const response = await this.instance({
        timeout: timeout * 1000,
        ...this.request,
      });
      return response.data;
    } catch (err: any) {
      if (err.response) {
        throw new APIError(err.config?.url || '', err.response.status, err.response.data);
      }
      if (err.code === AxiosError.ETIMEDOUT || err.code === AxiosError.ECONNABORTED) {
        throw new TimeoutError(err.config?.url || '', err.config?.timeout || 0);
      }
      if (err.request) {
        throw new HttpError(err.config?.url || '', err);
      }
      throw err;
    }
  }
}
