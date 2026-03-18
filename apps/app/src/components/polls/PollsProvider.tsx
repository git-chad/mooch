"use client";

import { createBrowserClient, getPolls } from "@mooch/db";
import type { PollWithOptions } from "@mooch/stores";
import { usePollStore } from "@mooch/stores";
import { useCallback, useEffect, useRef } from "react";

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
  const realtimeSubscribedRef = useRef(false);

  const refreshPolls = useCallback(
    async (supabase = createBrowserClient()) => {
      const fresh = await getPolls(supabase, groupId);
      setPolls(fresh as PollWithOptions[]);
    },
    [groupId, setPolls],
  );

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
          await refreshPolls(supabase);
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
          await refreshPolls(supabase);
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
          await refreshPolls(supabase);
        },
      )
      .subscribe((status) => {
        realtimeSubscribedRef.current = status === "SUBSCRIBED";
      });

    return () => {
      realtimeSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, refreshPolls]);

  useEffect(() => {
    const supabase = createBrowserClient();
    let inFlight = false;

    const shouldRefreshByTimer = () => {
      if (document.visibilityState === "hidden") return false;

      const now = Date.now();
      const hasOpenTimedPoll = usePollStore
        .getState()
        .polls.some((poll) => {
          if (poll.is_closed || !poll.closes_at) return false;
          return new Date(poll.closes_at).getTime() > now;
        });

      // When realtime is healthy and there are no open timed polls,
      // skip periodic polling to avoid unnecessary backend load.
      if (realtimeSubscribedRef.current && !hasOpenTimedPoll) {
        return false;
      }

      return true;
    };

    const tick = async () => {
      if (inFlight || !shouldRefreshByTimer()) return;
      inFlight = true;
      try {
        await refreshPolls(supabase);
      } finally {
        inFlight = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };

    const handleOnline = () => {
      void tick();
    };

    const id = window.setInterval(() => {
      void tick();
    }, 30_000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [refreshPolls]);

  return <>{children}</>;
}
