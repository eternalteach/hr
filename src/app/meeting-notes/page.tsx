"use client";

import { BoardPage } from "@/components/board/BoardPage";
import { MEETING_NOTES_CONFIG } from "@/lib/boards/config";

export default function MeetingNotesPage() {
  return <BoardPage config={MEETING_NOTES_CONFIG} />;
}
