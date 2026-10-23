import * as ImageManipulator from "expo-image-manipulator";

export async function compressImage(uri: string, maxWidth = 1600) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function uploadWithRetry<T>(
  task: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastError;
}
