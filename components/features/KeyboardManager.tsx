"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShortcutsModal } from "./ShortcutsModal";

export function KeyboardManager() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Focus search using raw DOM (not ideal in React, but fast for global shortcut)
  const focusSearch = () => {
    const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (input) input.focus();
  };

  useKeyboardShortcuts({
    'd': () => router.push('/dashboard'),
    'l': () => router.push('/leads'),
    'p': () => router.push('/pipeline'),
    'j': () => router.push('/projects'),
    'c': () => router.push('/calendar'),
    'a': () => router.push('/ai-studio'),
    'f': focusSearch,
    '?': () => setShowModal(true),
  });

  return (
    <>
      {showModal && <ShortcutsModal onClose={() => setShowModal(false)} />}
    </>
  );
}
