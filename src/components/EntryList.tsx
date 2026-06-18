import TrackedLink from "@/components/TrackedLink";
import type { Segment } from "@/types/dictionary";

interface EntryListProps {
  segments: Segment[];
}

export default function EntryList({ segments }: EntryListProps) {
  return (
    <div className="mt-6">
      <table className="w-full text-left border-collapse">
        <tbody>
          {segments.map((segment, i) => {
            if (!segment.entries) {
              return (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-2xl text-gray-300" colSpan={4}>
                    {segment.text}
                  </td>
                </tr>
              );
            }

            const entry = segment.entries[0];
            const firstSense = entry.e.split(";")[0].trim();

            return (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-6 text-xl font-bold text-primary whitespace-nowrap">
                  {entry.s}
                  {entry.t !== entry.s && (
                    <span className="text-lg text-gray-400 font-normal"> ({entry.t})</span>
                  )}
                </td>
                <td className="py-3 pr-6 text-sm italic text-gray-500 whitespace-nowrap">
                  {entry.p}
                </td>
                <td className="py-3 pr-6 text-sm text-gray-800 w-full">
                  {firstSense}
                </td>
                <td className="py-3 text-right whitespace-nowrap">
                  <TrackedLink
                    href={`/entry/${encodeURIComponent(segment.text)}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Details →
                  </TrackedLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
