import fs from "fs";
import path from "path";

function loadResourcesHtml(): string {
  const filePath = path.join(process.cwd(), "assets", "resources.html");
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export default function ResourcesPage() {
  const html = loadResourcesHtml();

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      {html ? (
        <div
          className="references-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Resources</h2>
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-8 py-12 text-center text-gray-400">
            <p className="text-lg font-medium">No resources available</p>
          </div>
        </>
      )}
    </main>
  );
}
