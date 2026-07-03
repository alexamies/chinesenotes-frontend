"use client";

import Link from "next/link";
import { recordInteraction } from "@/lib/recaptcha";

interface TrackedLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function TrackedLink({ href, className, children }: TrackedLinkProps) {
  function handleClick() {
    // Fire-and-forget: record the link interaction server-side without blocking navigation.
    recordInteraction("link_click");
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
