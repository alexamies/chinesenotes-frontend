export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">About Chinese Notes</h2>

      <section className="prose prose-gray max-w-none space-y-4 text-gray-700 leading-relaxed">
        <p>
          <strong>Chinese Notes</strong> is a Chinese–English dictionary and reading tool designed to
          help learners and researchers explore classical and modern Chinese texts. It covers
          vocabulary from a wide range of domains, including everyday language, literary Chinese,
          and historical documents.
        </p>

        <p>
          Enter a Chinese word or phrase in the search box and the dictionary will return definitions,
          part-of-speech information, and example usage drawn from a curated corpus of classical and
          contemporary sources.
        </p>

        <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-2">How to use</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Type a Chinese word, phrase, or character into the search field.</li>
          <li>Press <strong>Find</strong> or hit Enter.</li>
          <li>Browse the matching entries, definitions, and example sentences.</li>
        </ol>

        <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-2">Open source</h3>
        <p>
          The dictionary data and application source code are open source. Contributions, corrections,
          and feedback are welcome via the <a href="https://github.com/alexamies/chinesenotes-frontend"
          >project repository</a>.
        </p>
      </section>
    </main>
  );
}
