import { isR2FeedMediaPath } from "@mooch/db/storage/feed";
import {
  deleteFromR2,
  getSignedR2Url,
  isR2Configured,
} from "@mooch/db/storage/r2";
import { createAdminClient } from "@/lib/supabase-admin";

export async function getSignedFeedMediaUrlForPath(
  mediaPath: string,
  expiresInSeconds = 60 * 30,
): Promise<string | null> {
  if (!mediaPath) return null;

  if (isR2FeedMediaPath(mediaPath)) {
    if (!isR2Configured()) return null;
    return getSignedR2Url(mediaPath, expiresInSeconds);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("feed-media")
    .createSignedUrl(mediaPath, expiresInSeconds);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function deleteFeedMediaForPath(mediaPath: string): Promise<void> {
  if (!mediaPath) return;

  if (isR2FeedMediaPath(mediaPath)) {
    if (!isR2Configured()) return;
    await deleteFromR2(mediaPath);
    return;
  }

  const admin = createAdminClient();
  await admin.storage.from("feed-media").remove([mediaPath]);
}
