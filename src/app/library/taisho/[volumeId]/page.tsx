import Link from "next/link";
import { notFound } from "next/navigation";
import { parseTaishoIndex, parseTaishoVolume } from "@/lib/taisho";

export const dynamicParams = false;

export async function generateStaticParams() {
  const { sections } = await parseTaishoIndex();
  return sections
    .flatMap((s) => s.volumes)
    .filter((v) => v.volumeId)
    .map((v) => ({ volumeId: v.volumeId }));
}

interface Props {
  params: Promise<{ volumeId: string }>;
}

export default async function TaishoVolumePage({ params }: Props) {
  const { volumeId } = await params;
  const texts = await parseTaishoVolume(volumeId);

  if (texts.length === 0) notFound();

  const volumeLabel = volumeId.replace(/^t/, "Volume ").replace(/-/, "–");

  return (
    <main className="max-w-2xl mx-auto mt-12 px-6 pb-16">
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/library" className="hover:underline text-primary">
          Library
        </Link>
        {" › "}
        <span>{volumeLabel}</span>
      </nav>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Taishō {volumeLabel}
      </h2>
      <p className="text-gray-500 mb-8">
        {texts.length} texts in this volume.
      </p>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {texts.map((text) => (
          <Link
            key={text.id}
            href={`/library/${text.id}`}
            className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group"
          >
            <span className="text-sm text-gray-400 w-8 shrink-0 pt-0.5 text-right">
              {text.number}
            </span>
            <span className="text-base text-primary group-hover:underline leading-snug">
              {text.title}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
