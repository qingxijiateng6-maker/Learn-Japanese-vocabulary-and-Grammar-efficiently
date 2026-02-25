"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
} from "react";
import {
  createLocalProgressRepo,
  type LocalProgressRepoOptions,
} from "@/repo/progressRepo.local";
import type { ProgressRepo } from "@/repo/progressRepo";

type ProgressRepoProviderProps = PropsWithChildren<{
  repo?: ProgressRepo;
  localOptions?: LocalProgressRepoOptions;
}>;

const ProgressRepoContext = createContext<ProgressRepo | null>(null);

let defaultProgressRepo: ProgressRepo | null = null;

function getDefaultProgressRepo(localOptions?: LocalProgressRepoOptions): ProgressRepo {
  if (!defaultProgressRepo) {
    defaultProgressRepo = createLocalProgressRepo(localOptions);
  }
  return defaultProgressRepo;
}

export function ProgressRepoProvider({
  children,
  repo,
  localOptions,
}: ProgressRepoProviderProps) {
  const value = repo ?? getDefaultProgressRepo(localOptions);

  return (
    <ProgressRepoContext.Provider value={value}>
      {children}
    </ProgressRepoContext.Provider>
  );
}

export function useProgressRepo(): ProgressRepo {
  const repo = useContext(ProgressRepoContext);
  if (!repo) {
    throw new Error("useProgressRepo must be used within a ProgressRepoProvider");
  }
  return repo;
}
