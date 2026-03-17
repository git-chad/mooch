"use client";

import { createBrowserClient, getPolls } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import { usePollStore } from "@mooch/stores";
import { useEffect } from "react";

type PollsProviderProps = {
  groupId: string;
  initialPolls: PollWithOptions[];
  children: React.ReactNode;
};

export function PollsProvider({
  groupId,
  initialPolls,
  children,
}: PollsProviderProps) {
  const setPolls = usePollStore((s) => s.setPolls);
  const clear = usePollStore((s) => s.clear);

  useEffect(() => {
    setPolls(initialPolls);
    return () => clear();
  }, [initialPolls, setPolls, clear]);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Re-fetch all polls whenever votes or token actions change.
    // Individual row deltas for votes are tricky to merge client-side
    // (weighted counts, vetoed state, etc.), so we refetch the full list.
    const channel = supabase
      .channel(`polls-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "polls",
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          const fresh = await getPolls(supabase, groupId);
          setPolls(fresh as PollWithOptions[]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_votes",
        },
        async () => {
          const fresh = await getPolls(supabase, groupId);
          setPolls(fresh as PollWithOptions[]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_token_actions",
        },
        async () => {
          const fresh = await getPolls(supabase, groupId);
          setPolls(fresh as PollWithOptions[]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, setPolls]);

  return <>{children}</>;
}
