"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { saveNotes, useNotes } from "@/hooks/useDaily";
import { removeTodoFromNotesContent, useTodos } from "@/hooks/useTodos";

export default function TodosPage() {
  const { data: notes } = useNotes();
  const { todos, stats, addTodo, updateTodo, toggleTodo, deleteTodo, clearCompleted, syncFromNotes } = useTodos();
  const [newTodo, setNewTodo] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    syncFromNotes(notes?.content || "");
  }, [notes?.content, syncFromNotes]);

  const sortedTodos = useMemo(
    () => [...todos].sort((a, b) => Number(a.done) - Number(b.done)),
    [todos]
  );

  const handleToggle = async (id: string) => {
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
  };

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div className="page-title">Todos</div>
          <div className="page-sub">Manage all notes-derived and manual tasks in one place</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={clearCompleted}>
          <Trash2 size={13} /> Clear Completed
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 14 }}>
        {[{ label: "Total", value: stats.total }, { label: "Pending", value: stats.pending }, { label: "Completed", value: stats.completed }].map(card => (
          <div key={card.label} className="metric-card">
            <div className="metric-label">{card.label}</div>
            <div className="metric-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="form-control"
            placeholder="Add a todo..."
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && newTodo.trim()) {
                addTodo(newTodo, "manual");
                setNewTodo("");
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!newTodo.trim()) return;
              addTodo(newTodo, "manual");
              setNewTodo("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>All Todos</div>
        {sortedTodos.length === 0 ? (
          <div className="empty-state-sub" style={{ textAlign: "left" }}>No todos yet. Add manual items or write bullet points in Quick Notes.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedTodos.map(todo => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: todo.done ? "var(--bg-overlay)" : "var(--bg-surface)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button className="btn-icon" onClick={() => handleToggle(todo.id)}>
                  <CheckSquare size={15} color={todo.done ? "var(--success)" : "var(--text-muted)"} />
                </button>

                {editingId === todo.id ? (
                  <input
                    className="form-control"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    style={{ flex: 1 }}
                  />
                ) : (
                  <div style={{ flex: 1, fontSize: 13.5, color: todo.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: todo.done ? "line-through" : "none" }}>
                    {todo.text}
                  </div>
                )}

                <span className="badge" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                  {todo.source}
                </span>

                {editingId === todo.id ? (
                  <>
                    <button
                      className="btn-icon"
                      onClick={() => {
                        if (editingText.trim()) updateTodo(todo.id, editingText);
                        setEditingId(null);
                        setEditingText("");
                      }}
                    >
                      <Save size={14} />
                    </button>
                    <button className="btn-icon" onClick={() => { setEditingId(null); setEditingText(""); }}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <button className="btn-icon" onClick={() => { setEditingId(todo.id); setEditingText(todo.text); }}>
                    <Pencil size={14} />
                  </button>
                )}

                <button className="btn-icon" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
