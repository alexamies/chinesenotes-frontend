import DictionaryApp from "@/components/DictionaryApp";

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6">
      <DictionaryApp initialQuery={q} />
    </main>
  );
}
