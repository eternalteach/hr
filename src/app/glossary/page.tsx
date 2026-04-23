"use client";

import { BoardPage } from "@/components/board/BoardPage";
import { GLOSSARY_CONFIG } from "@/lib/boards/config";

export default function GlossaryPage() {
  return <BoardPage config={GLOSSARY_CONFIG} />;
}
