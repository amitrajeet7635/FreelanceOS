"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TodoSource = "manual" | "notes";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  source: TodoSource;
  createdAt: string;
}

const STORAGE_KEY = "freelanceos_todos_v1";
const TODOS_SYNC_EVENT = "freelanceos:todos-sync";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parseNoteTodos(content: string): string[] {
  return content
    .split("\n")
    .map(line => line.trim())
    .filter(line => /^[-*•]\s+/.test(line))
    .map(line => line.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
}

export function removeTodoFromNotesContent(content: string, todoText: string): string {
  const target = todoText.trim().toLowerCase();
  if (!target) return content;

  return content
    .split("\n")
    .filter(line => {
      const trimmed = line.trim();
      if (!/^[-*•]\s+/.test(trimmed)) return true;

      const bulletText = trimmed.replace(/^[-*•]\s+/, "").trim().toLowerCase();
      return bulletText !== target;
    })
    .join("\n");
}

function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistTodos(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  window.dispatchEvent(new Event(TODOS_SYNC_EVENT));
}

export function useTodos() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => setTodos(loadTodos());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(TODOS_SYNC_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(TODOS_SYNC_EVENT, syncFromStorage);
    };
  }, []);

  const commitTodos = useCallback((updater: (prev: TodoItem[]) => TodoItem[]) => {
    setTodos(prev => {
      const next = updater(prev);
      persistTodos(next);
      return next;
    });
  }, []);

  const addTodo = useCallback((text: string, source: TodoSource = "manual") => {
    const cleaned = text.trim();
    if (!cleaned) return;

    commitTodos(prev => {
      const exists = prev.some(t => t.text.toLowerCase() === cleaned.toLowerCase());
      if (exists) return prev;
      return [
        {
          id: uid(),
          text: cleaned,
          done: false,
          source,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, [commitTodos]);

  const updateTodo = useCallback((id: string, text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    commitTodos(prev => prev.map(t => (t.id === id ? { ...t, text: cleaned } : t)));
  }, [commitTodos]);

  const toggleTodo = useCallback((id: string) => {
    commitTodos(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }, [commitTodos]);

  const deleteTodo = useCallback((id: string) => {
    commitTodos(prev => prev.filter(t => t.id !== id));
  }, [commitTodos]);

  const clearCompleted = useCallback(() => {
    commitTodos(prev => prev.filter(t => !t.done));
  }, [commitTodos]);

  const syncFromNotes = useCallback((content: string) => {
    const extracted = parseNoteTodos(content);
    const extractedSet = new Set(extracted.map(t => t.toLowerCase()));

    commitTodos(prev => {
      const manual = prev.filter(t => t.source === "manual");
      const existingNotes = prev.filter(t => t.source === "notes");

      const nextNotes: TodoItem[] = extracted.map(text => {
        const match = existingNotes.find(n => n.text.toLowerCase() === text.toLowerCase());
        if (match) return match;
        return {
          id: uid(),
          text,
          done: false,
          source: "notes",
          createdAt: new Date().toISOString(),
        };
      });

      const archivedCompletedNotes = existingNotes.filter(
        n => n.done && !extractedSet.has(n.text.toLowerCase())
      );

      return [...manual, ...nextNotes, ...archivedCompletedNotes].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [commitTodos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.done).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [todos]);

  return {
    todos,
    stats,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    syncFromNotes,
  };
}
