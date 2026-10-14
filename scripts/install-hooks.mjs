// Points git at the committed hooks in .githooks. Runs from `npm install` (the prepare script).
// Does nothing where there is no git checkout (Vercel builds, a tarball), and never fails an install.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

try {
  if (existsSync(new URL('../.git', import.meta.url))) {
    execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
    console.log('git hooks installed (.githooks: pre-commit [typecheck & lint] and pre-push [no direct main push])');
  }
} catch {
  // not a git checkout or git is missing
}
