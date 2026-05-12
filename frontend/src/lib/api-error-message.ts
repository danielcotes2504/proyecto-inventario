import { HttpError } from '#/lib/http';

const STATUS_MESSAGES: Partial<Record<number, string>> = {
  409: 'No se puede completar: existe un conflicto con los datos actuales.',
  422: 'No hay suficiente stock para esta operación.',
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (STATUS_MESSAGES[error.status]) {
      return STATUS_MESSAGES[error.status]!;
    }
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
