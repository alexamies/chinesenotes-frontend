"use client";

import { useRouter } from "next/navigation";
import DictionaryLookup from "@/components/DictionaryLookup";

export default function DictionaryLookupNav() {
  const router = useRouter();
  return (
    <DictionaryLookup
      onSearchTextChange={(q) => router.push(`/?q=${encodeURIComponent(q)}`)}
    />
  );
}
