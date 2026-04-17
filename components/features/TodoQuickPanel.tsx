"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, ListTodo, X } from "lucide-react";
import type { TodoItem } from "@/hooks/useTodos";

export function TodoQuickPanel({
  todos,
  onToggle,
}: {
  todos: TodoItem[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const pendingTodos = useMemo(() => todos.filter(t => !t.done), [todos]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Open todos"
        style={{
          position: "fixed",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 12000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "1px solid var(--border-default)",
          background: "linear-gradient(180deg, var(--bg-elevated), var(--bg-surface))",
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-lg)",
          cursor: "pointer",
        }}
      >
        <ListTodo size={20} />
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 20,
            height: 20,
            borderRadius: 999,
            background: "var(--accent)",
            color: "var(--text-inverse)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 6px",
          }}
        >
          {pendingTodos.length}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 13000,
            }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: "absolute",
                right: 24,
                top: "50%",
                transform: "translateY(-50%)",
                width: 360,
                maxWidth: "calc(100vw - 32px)",
                maxHeight: "70vh",
                overflowY: "auto",
                borderRadius: 16,
                border: "1px solid var(--border-default)",
                background: "var(--bg-surface)",
                boxShadow: "var(--shadow-lg)",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Quick Todos</div>
                <button className="btn-icon" onClick={() => setOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todos.length === 0 ? (
                  <div
                    style={{
                      border: "1px dashed var(--border-subtle)",
                      borderRadius: 10,
                      padding: "12px 10px",
                      color: "var(--text-muted)",
                      fontSize: 12.5,
                      textAlign: "center",
                    }}
                  >
                    No todos yet. Add bullets in Quick Notes or create one in the Todos page.
                  </div>
                ) : (
                  todos.map(todo => (
                    <button
                      key={todo.id}
                      type="button"
                      onClick={() => onToggle(todo.id)}
                      style={{
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-overlay)",
                        borderRadius: 10,
                        padding: "10px 11px",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <CheckSquare size={16} color={todo.done ? "var(--success)" : "var(--text-muted)"} />
                      <div style={{ flex: 1, fontSize: 13, color: todo.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: todo.done ? "line-through" : "none" }}>
                        {todo.text}
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, border: "1px solid var(--border-subtle)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {todo.source}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
