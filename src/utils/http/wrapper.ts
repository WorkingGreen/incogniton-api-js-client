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
  private useFormUrlEncoded = false;

  constructor(
    protected instance: AxiosInstance,
    protected config: RequestConfig,
    protected request: Partial<AxiosRequestConfig<RequestData<T>>>
  ) {
    this.request.headers = Object.assign({}, this.request.headers);
  }

  /**
   * Adds asynchronous code to be run just before making a request. This mainly
   * helps to keep the wrapper API consistent by not doing anything async till the request
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

    // Set the form-urlencoded flag when that content type is selected
    this.useFormUrlEncoded = t === 'application/x-www-form-urlencoded';

    return this;
  }

  /**
   * Helper method to convert nested objects in request data to stringified JSON
   * before form URL encoding. This is useful for endpoints that expect stringified
   * JSON values within form URL encoded data.
   */
  toFormUrlEncoded() {
    this.useFormUrlEncoded = true;

    // If the data is an object, stringify the entire object
    if (this.request.data && typeof this.request.data === 'object') {
      const processedData: Record<string, string> = {};

      // Stringify the entire object as a single value
      processedData.profileData = JSON.stringify(this.request.data);

      this.request.data = <RequestData<T>>processedData;
    }

    return this.type('application/x-www-form-urlencoded');
  }

  /**
   * Convert JSON object to form-urlencoded format without external dependencies
   * @param obj the object to convert
   * @param prefix optional key prefix for nested objects
   */
  private jsonToFormUrlEncoded(obj: any, prefix?: string): string {
    const parts: string[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const formKey = prefix ? `${prefix}[${key}]` : key;

        if (value === null || value === undefined) {
          continue;
        } else if (
          typeof value === 'object' &&
          !(value instanceof Date) &&
          !(typeof File !== 'undefined' && value instanceof File)
        ) {
          // Handle nested objects recursively
          const nestedStr = this.jsonToFormUrlEncoded(value, formKey);
          if (nestedStr) {
            parts.push(nestedStr);
          }
        } else {
          // Handle primitive values and special objects like Date
          let formValue = value;
          if (value instanceof Date) {
            formValue = value.toISOString();
          }
          parts.push(`${encodeURIComponent(formKey)}=${encodeURIComponent(String(formValue))}`);
        }
      }
    }

    return parts.join('&');
  }

  /**
   * Set multiple header values at once
   * @param headers header key value pairs
   */
  set(headers: object): this;
  /**
   * Set single header value at once
   * @param key header
   * @param value value of header
   */
  set(key: string, value: string): this;
  set(key: string | object, value?: string) {
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
  async do<R = any>(timeout = 10): Promise<R> {
    await Promise.all(this.asyncActions.map(action => action()));

    // Convert data to form-urlencoded if needed
    if (this.useFormUrlEncoded && this.request.data && typeof this.request.data === 'object') {
      this.request.data = this.jsonToFormUrlEncoded(this.request.data);
    }

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
