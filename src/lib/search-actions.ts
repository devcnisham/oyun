'use server';

import { getDb } from './store';
import type { SearchEntry } from './search';

// Names, areas and sports of the turfs shown on the public site; fetched once when a search box opens
export async function getSearchIndex(): Promise<SearchEntry[]> {
  const db = await getDb();
  return db.turfs
    .filter((t) => t.status === 'active')
    .map((t) => ({ id: t.id, name: t.name, area: t.area, location: t.location, sports: t.sports }));
}
