export function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error &&
    "response" in error &&
    typeof (error as { response?: { data?: { code?: string } } }).response?.data
      ?.code === "string"
  ) {
    return (error as { response: { data: { code: string } } }).response.data.code;
  }
  return undefined;
}
