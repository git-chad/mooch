import type { SupabaseClient } from "@supabase/supabase-js";

const PHOTO_MAX_WIDTH = 1080;
const PHOTO_QUALITY = 0.72;
export const PHOTO_MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export const FEED_MEDIA_R2_PREFIX = "r2/";

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

function buildFeedMediaPath(
  groupId: string,
  kind: "photos" | "voice",
  name: string,
  mimeType: string,
): string {
  const extension = safeFileExtensionFromMime(mimeType) ?? "bin";
  const baseName =
    kind === "photos" ? stripExtension(safeFileName(name || "photo")) : "voice";

  const suffix =
    kind === "photos" ? `-${baseName}.${extension}` : `.${extension}`;

  return `${FEED_MEDIA_R2_PREFIX}${groupId}/${kind}/${Date.now()}-${crypto.randomUUID()}${suffix}`;
}

export function buildFeedPhotoPath(
  groupId: string,
  name: string,
  mimeType: string,
): string {
  return buildFeedMediaPath(groupId, "photos", name, mimeType);
}

export function buildFeedVoicePath(groupId: string, mimeType: string): string {
  return buildFeedMediaPath(groupId, "voice", "voice", mimeType);
}

export function isR2FeedMediaPath(mediaPath: string): boolean {
  return mediaPath.startsWith(FEED_MEDIA_R2_PREFIX);
}

export function pathMatchesGroup(mediaPath: string, groupId: string): boolean {
  const normalized = isR2FeedMediaPath(mediaPath)
    ? mediaPath.slice(FEED_MEDIA_R2_PREFIX.length)
    : mediaPath;
  return normalized.startsWith(`${groupId}/`);
}

function replaceFileExtension(name: string, extension: string): string {
  const baseName = stripExtension(safeFileName(name || "photo"));
  return `${baseName}.${extension}`;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function compressFeedPhotoIfPossible(file: File): Promise<File> {
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

    // Prefer WebP for smaller files. If the browser cannot encode WebP,
    // fall back to JPEG for older/limited environments.
    const webpBlob = await canvasToBlob(canvas, "image/webp", PHOTO_QUALITY);
    if (webpBlob && webpBlob.type === "image/webp") {
      return new File([webpBlob], replaceFileExtension(file.name, "webp"), {
        type: "image/webp",
        lastModified: file.lastModified,
      });
    }

    const jpegBlob = await canvasToBlob(canvas, "image/jpeg", PHOTO_QUALITY);
    if (jpegBlob) {
      return new File([jpegBlob], replaceFileExtension(file.name, "jpg"), {
        type: "image/jpeg",
        lastModified: file.lastModified,
      });
    }

    return file;
  } catch {
    return file;
  }
}

export async function uploadFeedPhoto(
  supabase: SupabaseClient,
  groupId: string,
  file: File,
): Promise<string> {
  const processed = await compressFeedPhotoIfPossible(file);
  const contentType = processed.type?.startsWith("image/")
    ? processed.type
    : "application/octet-stream";
  const extension =
    safeFileExtensionFromMime(contentType) ??
    safeFileExtensionFromMime(processed.type) ??
    "jpg";
  const baseName = stripExtension(
    safeFileName(processed.name || file.name || "photo"),
  );

  const path = `${groupId}/photos/${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;

  const { error } = await supabase.storage
    .from("feed-media")
    .upload(path, processed, {
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

  const { error } = await supabase.storage
    .from("feed-media")
    .upload(path, blob, {
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

  const { error } = await supabase.storage
    .from("feed-media")
    .remove([mediaPath]);
  if (error) {
    throw new Error(error.message);
  }
}
