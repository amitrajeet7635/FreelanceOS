"use client";

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

import { ProjectV2Extensions } from "@/lib/types";

export interface Project extends Partial<ProjectV2Extensions> {
  _id: string;
  client: string;
  service: string;
  budget: number;
  deadline?: string;
  status: string;
  notes?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  const { data, error, isLoading } = useSWR<Project[]>("/api/projects", fetcher);
  return {
    projects: data || [],
    isLoading,
    isError: !!error,
    mutate: () => mutate("/api/projects"),
  };
}

export async function createProject(data: Partial<Project>) {
  await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/projects");
}

export async function updateProject(id: string, data: Partial<Project>) {
  await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/projects");
}

export async function deleteProject(id: string) {
  await fetch(`/api/projects/${id}`, { method: "DELETE" });
  mutate("/api/projects");
}
