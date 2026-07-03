"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordInteraction } from "@/lib/recaptcha";

// Fires once per navigated path, unlike TrackedLink which only fires on a
// link click. Depends on pathname (not an empty array) because this is
// rendered from a shared layout that persists across nested route
// navigations in the App Router — without that dependency it would only
// fire once, on the layout's first mount, and miss every subsequent
// Library page visited in the same session. Used on Library routes so that
// direct navigation (typed URL, back button, or a bot/crawler rendering
// pages without simulating clicks) still counts toward the session's
// interaction total.
export default function PageViewInteraction() {
  const pathname = usePathname();

  useEffect(() => {
    recordInteraction("page_view");
  }, [pathname]);

  return null;
}
