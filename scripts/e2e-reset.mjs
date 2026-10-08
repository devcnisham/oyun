// Fresh data for every end-to-end run: the app seeds .e2e-data/ on first load.
import { rmSync } from 'node:fs';
rmSync(new URL('../.e2e-data', import.meta.url), { recursive: true, force: true });
