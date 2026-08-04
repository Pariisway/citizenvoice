"use client";

// app/citizen-chat/page.tsx
//
// This route used to host the video feed and is kept only so old links
// and bookmarks don't dead-end. Videos moved to /academy (Video Library
// section); live discussion moved to /community-chat.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CitizenChatRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/community-chat");
  }, [router]);
  return null;
}
