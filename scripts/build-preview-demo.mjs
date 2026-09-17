import {spawnSync} from 'node:child_process';

// Local parity check for the same environment Vercel exposes to Preview builds.
const runtime=globalThis.process;
const result=spawnSync('npm',['run','build'],{stdio:'inherit',env:{...runtime.env,VERCEL_ENV:'preview',VITE_PREVIEW_DEMO:'true'}});
runtime.exit(result.status??1);
