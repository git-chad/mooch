"use client";

import { Text } from "@mooch/ui";
import { renderMentionText } from "./MentionInput";

const SHORT_TEXT_THRESHOLD = 40;
const LONG_TEXT_THRESHOLD = 80;

export function TextPostBody({ text }: { text: string }) {
  const len = text.length;
  const content = renderMentionText(text);

  // Short punchy text — large Geist Pixel
  if (len <= SHORT_TEXT_THRESHOLD) {
    return (
      <Text variant="web-section" color="default">
        {content}
      </Text>
    );
  }

  // Longer text — blockquote-style left accent bar
  if (len > LONG_TEXT_THRESHOLD) {
    return (
      <div
        className="rounded-r-lg border-l-[3px] pl-3"
        style={{ borderColor: "#C4B5A6" }}
      >
        <Text variant="body" className="text-[15px] leading-[1.55]">
          {content}
        </Text>
      </div>
    );
  }

  // Medium text — standard body
  return (
    <Text variant="body" className="text-[15px] leading-[1.55]">
      {content}
    </Text>
  );
}
