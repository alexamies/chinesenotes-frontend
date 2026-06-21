import type { DictionaryEntry } from "@/types/dictionary";
import TermActions from "@/components/TermActions";

interface EntryDetailProps {
  entries: DictionaryEntry[];
}

function groupBy<T>(items: T[], key: (item: T) => string): { key: string; items: T[] }[] {
  const groups: { key: string; items: T[] }[] = [];
  const seen = new Map<string, (typeof groups)[0]>();
  for (const item of items) {
    const k = key(item);
    let group = seen.get(k);
    if (!group) {
      group = { key: k, items: [] };
      groups.push(group);
      seen.set(k, group);
    }
    group.items.push(item);
  }
  return groups;
}

export default function EntryDetail({ entries }: EntryDetailProps) {
  if (entries.length === 0) return null;

  const head = entries[0];

  type GrammarGroup = { grammar: string; senses: DictionaryEntry[] };
  type PinyinGroup = { pinyin: string; grammarGroups: GrammarGroup[] };

  const pinyinGroups: PinyinGroup[] = groupBy(entries, (e) => e.p).map((pg) => ({
    pinyin: pg.key,
    grammarGroups: groupBy(pg.items, (e) => e.g).map((gg) => ({
      grammar: gg.key,
      senses: gg.items,
    })),
  }));

  const allSenses = entries;
  const textsQuery = head.t !== head.s ? head.t : head.s;

  return (
    <div className="text-left">
      <div className="mb-4">
        <span className="text-4xl font-bold text-primary">{head.s}</span>
        {head.t !== head.s && (
          <span className="text-3xl text-gray-400"> ({head.t})</span>
        )}
        {pinyinGroups.length === 1 && (
          <span className="text-2xl italic text-gray-500 ml-3">{head.p}</span>
        )}
      </div>
      {pinyinGroups.map((pg) => {
        const senses = pg.grammarGroups.flatMap((gg) => gg.senses);
        return (
          <div key={pg.pinyin} className="mb-4">
            {pinyinGroups.length > 1 && (
              <div className="text-base italic text-gray-500 mb-2">{pg.pinyin}</div>
            )}
            {senses.map((entry, i) => (
              <div key={i} className="mb-2 ml-4">
                <div>
                  {allSenses.length > 1 && (
                    <span className="text-sm text-gray-400">{i + 1}.{" "}</span>
                  )}
                  <span className="text-sm font-semibold text-gray-600">{entry.g}</span>
                  {"  "}
                  <span className="text-base font-bold text-gray-800">{entry.e}</span>
                </div>
                {(entry.n || entry.d || entry.sd) && (
                  <p className="text-sm mt-1 text-gray-800">
                    <span className="font-semibold text-gray-500">Notes: </span>
                    {entry.n}{entry.n && (entry.d || entry.sd) ? ". " : ""}
                    {entry.d}{entry.d && entry.sd ? ", " : ""}{entry.sd}{(entry.d || entry.sd) ? "." : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })}
      <TermActions term={head.s} textsQuery={textsQuery} />
    </div>
  );
}
