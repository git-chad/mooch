import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTO_MAX_WIDTH = 1080;
const PHOTO_QUALITY = 0.82;

function safeFileExtensionFromMime(mime: string): string | null {
  const normalized = mime.toLowerCase();
  if (normalized === "image/jpeg" || normalized === "image/jpg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/heic") return "heic";
  if (normalized === "audio/webm") return "webm";
  if (normalized === "audio/mpeg") return "mp3";
  if (normalized === "audio/mp4") return "m4a";
  if (normalized === "audio/wav" || normalized === "audio/x-wav") return "wav";
  if (normalized === "audio/ogg") return "ogg";
  return null;
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0) return name;
  return name.slice(0, idx);
}

async function compressImageIfPossible(file: File): Promise<Blob> {
  // Server/runtime fallback: keep original file when browser canvas APIs are unavailable.
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof createImageBitmap === "undefined"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_WIDTH / bitmap.width);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType =
      file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, PHOTO_QUALITY);
    });

    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadFeedPhoto(
  supabase: SupabaseClient,
  groupId: string,
  file: File,
): Promise<string> {
  const processed = await compressImageIfPossible(file);
  const contentType =
    file.type && file.type.startsWith("image/")
      ? file.type
      : "application/octet-stream";
  const extension =
    safeFileExtensionFromMime(contentType) ??
    safeFileExtensionFromMime(file.type) ??
    "jpg";
  const baseName = stripExtension(safeFileName(file.name || "photo"));

  const path = `${groupId}/photos/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;

  const { error } = await supabase.storage.from("feed-media").upload(path, processed, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function uploadFeedVoice(
  supabase: SupabaseClient,
  groupId: string,
  blob: Blob,
): Promise<string> {
  const contentType = blob.type || "audio/webm";
  const extension = safeFileExtensionFromMime(contentType) ?? "webm";
  const path = `${groupId}/voice/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("feed-media").upload(path, blob, {
    contentType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return path;
}

export async function deleteFeedMedia(
  supabase: SupabaseClient,
  mediaPath: string,
): Promise<void> {
  if (!mediaPath) return;

  const { error } = await supabase.storage.from("feed-media").remove([mediaPath]);
  if (error) {
    throw new Error(error.message);
  }
}
