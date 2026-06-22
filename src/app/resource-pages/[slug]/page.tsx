import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export default async function ResourcePage({ params }: Props) {
  const { slug } = await params;

  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) notFound();

  const filePath = path.join(process.cwd(), "assets", "resource-pages", `${slug}.html`);
  let html: string;
  try {
    html = fs.readFileSync(filePath, "utf-8");
  } catch {
    notFound();
  }

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <div
        className="references-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
