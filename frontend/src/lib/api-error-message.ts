import { HttpError } from '#/lib/http';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    try {
      const parsed = JSON.parse(error.body) as { message?: unknown };
      if (typeof parsed.message === 'string') {
        return parsed.message;
      }
      if (Array.isArray(parsed.message)) {
        return parsed.message.map(String).join(', ');
      }
    } catch {
      if (error.body.length > 0) {
        return error.body;
      }
      return `No se pudo completar la operación (${error.status}).`;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Algo salió mal. Inténtalo de nuevo.';
}
