import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { RequestWrapper } from './wrapper.js';

const defaultAxiosConfig: Partial<AxiosRequestConfig> = {
  transitional: { clarifyTimeoutError: true },
  transformResponse: [
    data => {
      if (data === '') {
        return {};
      }
      return JSON.parse(data);
    },
  ],
};

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Configuration for the agent.
 */
export interface AgentConfig {
  /**
   * name of the service that'll be making these requests
   */
  service: string;
}

export class HttpAgent {
  private readonly instance: AxiosInstance;
  private readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
    this.instance = axios.create(defaultAxiosConfig);
  }

  /**
   * Create and wrapper an HTTP request for easy configuration.
   * @param method HTTP method of API
   * @param url absolute URL of API
   * @param data request body payload
   */
  makeRequest<T extends object>(method: HttpMethod, url: string, data?: T) {
    const httpRequest: Partial<AxiosRequestConfig> = { method, url };

    switch (method) {
      case HttpMethod.GET:
      case HttpMethod.DELETE:
        httpRequest.params = data;
        break;
      default:
        httpRequest.data = data;
    }

    return new RequestWrapper<T>(this.instance, this.config, httpRequest);
  }

  /**
   * Makes a get request
   * @param url absolute URL
   * @param params query parameters
   */
  get<T extends object>(url: string, params?: T) {
    return this.makeRequest<T>(HttpMethod.GET, url, params);
  }

  /**
   * Makes a post request
   * @param url absolute URL
   * @param body request body payload
   */
  post<T extends object>(url: string, body?: T) {
    return this.makeRequest<T>(HttpMethod.POST, url, body);
  }

  /**
   * Makes a put request
   * @param url absolute URL
   * @param body request body payload
   */
  put<T extends object>(url: string, body?: T) {
    return this.makeRequest<T>(HttpMethod.PUT, url, body);
  }

  /**
   * Makes a patch request
   * @param url absolute URL
   * @param body request body payload
   */
  patch<T extends object>(url: string, body?: T) {
    return this.makeRequest<T>(HttpMethod.PATCH, url, body);
  }

  /**
   * Makes a delete request
   * @param url absolute URL
   * @param params query parameters
   */
  del<T extends object>(url: string, params?: T) {
    return this.makeRequest<T>(HttpMethod.DELETE, url, params);
  }
}

export class HttpAgentBuilder {
  private readonly agent: HttpAgent;

  constructor(
    private readonly baseUrl: string,
    serviceName: string = 'http-client'
  ) {
    this.agent = new HttpAgent({ service: serviceName });
  }

  get(endpoint: string) {
    return this.agent.get(`${this.baseUrl}${endpoint}`);
  }

  post(endpoint: string) {
    return this.agent.post(`${this.baseUrl}${endpoint}`);
  }

  put(endpoint: string) {
    return this.agent.put(`${this.baseUrl}${endpoint}`);
  }

  delete(endpoint: string) {
    return this.agent.del(`${this.baseUrl}${endpoint}`);
  }

  patch(endpoint: string) {
    return this.agent.patch(`${this.baseUrl}${endpoint}`);
  }
}
