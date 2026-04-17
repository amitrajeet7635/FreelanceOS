"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { saveNotes, useNotes } from "@/hooks/useDaily";
import { removeTodoFromNotesContent, useTodos } from "@/hooks/useTodos";
import { TodoQuickPanel } from "@/components/features/TodoQuickPanel";

export function GlobalTodoQuickPanel() {
  const pathname = usePathname();
  const { data: notes } = useNotes();
  const { todos, toggleTodo, syncFromNotes } = useTodos();

  useEffect(() => {
    syncFromNotes(notes?.content || "");
  }, [notes?.content, syncFromNotes]);

  const handleToggle = useCallback(async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const isCompleting = !todo.done;

    if (todo.source === "notes" && isCompleting) {
      toggleTodo(id);
      const nextContent = removeTodoFromNotesContent(notes?.content || "", todo.text);
      await saveNotes(nextContent);
      syncFromNotes(nextContent);
      return;
    }

    toggleTodo(id);
  }, [notes?.content, syncFromNotes, todos, toggleTodo]);

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return null;
  }

  return <TodoQuickPanel todos={todos} onToggle={handleToggle} />;
}
