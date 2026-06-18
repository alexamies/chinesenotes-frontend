"use client";

import Link from "next/link";

interface TrackedLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export default function TrackedLink({ href, className, children }: TrackedLinkProps) {
  function handleClick() {
    // Fire-and-forget: record the link interaction server-side without blocking navigation.
    fetch("/api/interact", { method: "POST" }).catch(() => {});
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
