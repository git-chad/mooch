"use client";

import { useGroupStore } from "@mooch/stores";
import type { Group } from "@mooch/types";
import { useEffect } from "react";

type GroupsProviderProps = {
  groups: Group[];
  children: React.ReactNode;
};

export function GroupsProvider({ groups, children }: GroupsProviderProps) {
  const activeGroupId = useGroupStore((state) => state.activeGroupId);
  const setGroups = useGroupStore((state) => state.setGroups);
  const setActiveGroup = useGroupStore((state) => state.setActiveGroup);

  useEffect(() => {
    setGroups(groups);

    if (groups.length === 0) {
      setActiveGroup(null);
      return;
    }

    const hasActive = activeGroupId
      ? groups.some((group) => group.id === activeGroupId)
      : false;

    if (!hasActive) {
      setActiveGroup(groups[0]?.id ?? null);
    }
  }, [groups, activeGroupId, setGroups, setActiveGroup]);

  return <>{children}</>;
}
