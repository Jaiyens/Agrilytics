// Load environment variables BEFORE any other module reads process.env.
// This project keeps its keys in .env.local (the file the editor opens), so load that
// first, then fall back to .env. dotenv does not override already-set vars, so .env.local
// wins — matching how Vite resolves env for the client. Imported first in index.js.
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config(); // .env fallback (may not exist; dotenv no-ops silently)
