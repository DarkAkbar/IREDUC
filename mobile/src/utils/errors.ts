type ApiErrorBody = {
  message?: string;
  code?: string;
  details?: Array<{ path?: string; message?: string }>;
};

function getAxiosData(error: unknown): ApiErrorBody | undefined {
  if (typeof error !== "object" || !error || !("response" in error)) {
    return undefined;
  }
  const data = (error as { response?: { data?: ApiErrorBody } }).response?.data;
  return data && typeof data === "object" ? data : undefined;
}

export function getErrorMessage(error: unknown, fallback: string) {
  const data = getAxiosData(error);
  if (typeof data?.message === "string" && data.message.length > 0) {
    return data.message;
  }
  if (isNetworkError(error)) {
    return "Impossible de joindre le serveur";
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  return getAxiosData(error)?.code;
}

export function isNetworkError(error: unknown): boolean {
  if (typeof error !== "object" || !error) return false;
  const ax = error as { code?: string; message?: string; response?: unknown };
  if (ax.response) return false;
  return (
    ax.code === "ERR_NETWORK" ||
    ax.code === "ECONNABORTED" ||
    ax.message === "Network Error"
  );
}

/** Erreurs de validation Zod mappées par nom de champ. */
export function getFieldErrors(
  error: unknown
): Partial<Record<string, string>> {
  const data = getAxiosData(error);
  const result: Partial<Record<string, string>> = {};

  if (data?.code === "EMAIL_TAKEN") {
    result.email =
      data.message ?? "Cette adresse e-mail est déjà utilisée";
  }

  if (data?.code === "PHONE_TAKEN") {
    result.phone = data.message ?? "Ce numéro est déjà utilisé";
  }

  if (data?.code === "INVALID_PHONE") {
    result.phone = data.message ?? "Numéro de téléphone invalide";
  }

  if (data?.code === "VALIDATION_ERROR" && Array.isArray(data.details)) {
    for (const issue of data.details) {
      const path = issue.path?.split(".")[0];
      if (path && issue.message && !result[path]) {
        result[path] = issue.message;
      }
    }
  }

  return result;
}
