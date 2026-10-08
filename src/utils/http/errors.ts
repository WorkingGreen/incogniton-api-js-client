import { AxiosError } from 'axios';

export class NoAuthorizationTokenError extends Error {
  constructor(url: string) {
    super(`Request to ${url} requires an authorization token`);
    this.name = 'NoAuthorizationTokenError';
  }
}

export class HttpError extends Error {
  readonly axios_code: string;
  readonly axios_message: string;
  constructor(url: string, rawError: AxiosError) {
    super(`Request to ${url} failed: ${rawError.message}`);
    this.axios_code = rawError.code as string;
    this.axios_message = rawError.message;
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(url: string, timeout: number) {
    super(`Request to ${url} failed: request timed out after ${Math.floor(timeout / 1000)}`);
    this.name = 'TimeoutError';
  }
}

export class APIError extends Error {
  constructor(
    url: string,
    readonly status: number,
    readonly data: unknown
  ) {
    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? (data as { message: string }).message
        : `Request to ${url} failed with status ${status}`;
    super(message);
    this.name = 'APIError';
  }
}
