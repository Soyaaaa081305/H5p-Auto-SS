import { readArchive } from "../lib/archive";
self.onmessage = async (
  event: MessageEvent<{ bytes: ArrayBuffer; fileName: string }>,
) => {
  try {
    self.postMessage({
      result: await readArchive(
        new Uint8Array(event.data.bytes),
        event.data.fileName,
      ),
    });
  } catch (error) {
    self.postMessage({
      error:
        error instanceof Error && !/JSON/.test(error.message)
          ? error.message
          : "Invalid package data.",
    });
  }
};
