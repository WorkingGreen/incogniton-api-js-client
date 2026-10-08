import { AxiosError } from 'axios';
import { APIError, HttpError, NoAuthorizationTokenError, TimeoutError } from '../utils/http/errors.js';

describe('HTTP error classes', () => {
  it('set a distinguishable name so callers can classify errors without instanceof', () => {
    const raw = new AxiosError('connect ECONNREFUSED 127.0.0.1:35000', 'ECONNREFUSED');
    const http = new HttpError('/alive', raw);
    expect(http.name).toBe('HttpError');
    expect(http.axios_code).toBe('ECONNREFUSED');
    expect(new TimeoutError('/alive', 5000).name).toBe('TimeoutError');
    expect(new NoAuthorizationTokenError('/alive').name).toBe('NoAuthorizationTokenError');
    expect(new APIError('/alive', 500, {}).name).toBe('APIError');
  });

  it('keep instanceof working', () => {
    const err = new HttpError('/alive', new AxiosError('boom', 'ECONNRESET'));
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toBeInstanceOf(Error);
  });
});
