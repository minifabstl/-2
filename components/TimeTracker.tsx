"use client";

import { useEffect } from "react";
import { TRACK_TICK_SECONDS } from "@/lib/gift";

/**
 * Invisible heartbeat that reports active site time toward the "100 hours = $50 OnlyFans
 * account" gift program. Only counts time while the tab is actually visible and focused,
 * so it's a rough (not adversarially hardened) measure of real usage — see app/api/track-time.
 */
export default function TimeTracker() {
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        fetch("/api/track-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seconds: TRACK_TICK_SECONDS }),
          keepalive: true,
        }).catch(() => {});
      }
    }, TRACK_TICK_SECONDS * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
