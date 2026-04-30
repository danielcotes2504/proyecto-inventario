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

export async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    throw new HttpError(res.status, text);
  }
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('La respuesta del servidor no es JSON válido.');
  }
}
