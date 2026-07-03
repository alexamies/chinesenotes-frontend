import PageViewInteraction from "@/components/PageViewInteraction";

// Applies to every route under /library (list, book, chapter, taisho volume).
// See PageViewInteraction for why this counts page views, not just clicks.
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewInteraction />
      {children}
    </>
  );
}
