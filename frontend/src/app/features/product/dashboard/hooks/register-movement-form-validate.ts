import type { ZodIssue, ZodSafeParseResult } from 'zod';

function zodIssuesToFormFields(
  issues: ZodIssue[],
): Partial<Record<string, string>> {
  const fields: Partial<Record<string, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && fields[key] === undefined) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export function validationErrorsFromZodSafeParse<T>(
  result: ZodSafeParseResult<T>,
): { fields: Partial<Record<string, string>> } | undefined {
  if (result.success) {
    return undefined;
  }
  return { fields: zodIssuesToFormFields(result.error.issues) };
}
