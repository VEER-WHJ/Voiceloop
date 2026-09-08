export async function readApiJson<T>(response: Response): Promise<T> {
  let result: T & { message?: string };
  try {
    result = (await response.json()) as T & { message?: string };
  } catch {
    throw new Error("Circuit received an invalid server response.");
  }

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.replace("/login");
  }
  if (!response.ok) {
    throw new Error(result.message ?? "Circuit could not complete the request.");
  }
  return result;
}
