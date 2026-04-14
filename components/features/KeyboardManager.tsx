"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShortcutsModal } from "./ShortcutsModal";
import { useFocusTimer } from "./FocusContext";

export function KeyboardManager() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const { isActive, isMinimized, startSession, setMinimized } = useFocusTimer();

  // Focus search using raw DOM (not ideal in React, but fast for global shortcut)
  const focusSearch = () => {
    const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    if (input) input.focus();
  };

  const handleEnergyShortcut = () => {
    if (!isActive) {
      startSession();
      return;
    }

    setMinimized(!isMinimized);
  };

  useKeyboardShortcuts({
    'd': () => router.push('/dashboard'),
    'l': () => router.push('/leads'),
    'p': () => router.push('/pipeline'),
    'j': () => router.push('/projects'),
    'c': () => router.push('/calendar'),
    'a': () => router.push('/ai-studio'),
    'e': handleEnergyShortcut,
    'f': focusSearch,
    '?': () => setShowModal(true),
  });

  return (
    <>
      {showModal && <ShortcutsModal onClose={() => setShowModal(false)} />}
    </>
  );
}
