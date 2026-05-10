import DictionaryApp from "@/components/DictionaryApp";

export default function DictionaryPage() {
  return (
    <>
      <header className="bg-primary text-white px-8 py-4">
        <h1 className="text-2xl font-semibold tracking-wide">Chinese Notes 中文笔记</h1>
      </header>

      <main className="max-w-2xl mx-auto mt-12 px-6">
        <DictionaryApp />
      </main>
    </>
  );
}
