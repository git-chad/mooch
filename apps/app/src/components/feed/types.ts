import type { FeedItemWithMeta } from "@mooch/db";

export type FeedItemUI = FeedItemWithMeta & {
  media_url: string | null;
  optimistic?: boolean;
  local_object_url?: string | null;
};

export type FeedLinkOption = {
  id: string;
  label: string;
  tabId?: string;
};
