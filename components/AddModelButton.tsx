"use client";

import { useState } from "react";
import CreateModelModal from "@/components/CreateModelModal";
import LoginPromptModal from "@/components/LoginPromptModal";

export default function AddModelButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => (isLoggedIn ? setModalOpen(true) : setPromptOpen(true))}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-[13px] text-white shrink-0"
        style={{ background: "#db1a6d" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
        Add Model
      </button>
      <CreateModelModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <LoginPromptModal open={promptOpen} onClose={() => setPromptOpen(false)} title="Sign up to add a model" />
    </>
  );
}
