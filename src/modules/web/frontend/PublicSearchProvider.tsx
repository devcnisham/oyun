'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SearchEntry } from '@/modules/web/backend/search';

const PublicSearchContext = createContext<SearchEntry[] | null>(null);
export const usePublicSearchEntries = () => useContext(PublicSearchContext);

/** Public inventory is included with the page, so typing never waits for another request. */
export default function PublicSearchProvider({ entries, children }: { entries: SearchEntry[]; children: ReactNode }) {
  return <PublicSearchContext.Provider value={entries}>{children}</PublicSearchContext.Provider>;
}
