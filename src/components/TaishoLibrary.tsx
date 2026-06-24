import Link from "next/link";
import { parseTaishoIndex, TaishoSection } from "@/lib/taisho";

function SectionGroup({ section }: { section: TaishoSection }) {
  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
        {section.heading}
      </h3>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {section.volumes.map((vol) => (
          <div key={vol.volumeId || vol.volumeTitle} className="p-4">
            {vol.volumeId ? (
              <Link
                href={`/library/taisho/${vol.volumeId}`}
                className="text-base font-semibold text-primary hover:underline"
              >
                {vol.volumeTitle}
              </Link>
            ) : (
              <span className="text-base font-semibold text-gray-700">
                {vol.volumeTitle}
              </span>
            )}
            {vol.descriptionText && (
              <p className="mt-1 text-sm text-gray-500 leading-snug">
                {vol.descriptionText.replace(/\s*Popular titles:\s*/, "")}
              </p>
            )}
            {vol.popularTexts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {vol.popularTexts.map((t) => (
                  <Link
                    key={t.id}
                    href={`/library/${t.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function TaishoLibrary() {
  const index = await parseTaishoIndex();

  return (
    <div>
      <p className="text-gray-600 mb-6 text-sm">
        Taishō shinshū daizōkyō 《大正新脩大藏經》 — Chinese Buddhist Canon.
        Browse by section below or use the search above.
      </p>
      {index.sections.map((section) => (
        <SectionGroup key={section.heading} section={section} />
      ))}
    </div>
  );
}
