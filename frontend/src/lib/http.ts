export class HttpError extends Error {
  readonly status: number;

  readonly body: string;

  constructor(status: number, body: string) {
    super(body.length > 0 ? body : `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}
