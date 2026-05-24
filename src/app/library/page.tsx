export default function LibraryPage() {
  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Library</h2>
      <p className="text-gray-500 mb-8">Browse texts available for reading and vocabulary lookup.</p>

      {/* TODO: replace with a real list of texts fetched from the backend */}
      <div className="rounded-lg border border-dashed border-gray-300 bg-white px-8 py-12 text-center text-gray-400">
        <p className="text-lg font-medium">No texts yet</p>
        <p className="mt-1 text-sm">The library will display a list of classical and modern Chinese texts here.</p>
      </div>
    </main>
  );
}
