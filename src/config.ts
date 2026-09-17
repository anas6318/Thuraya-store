import {previewDemoEnabled,storefrontDemoEnabled} from '../shared/preview-demo';
const env=import.meta.env||{};
// The Node fallback only exists for server prerendering. Browser builds receive
// the immutable Vite-owned flag; a public preview variable is never trusted alone.
const nodePreviewDemo=typeof process!=='undefined'&&previewDemoEnabled(process.env.VITE_PREVIEW_DEMO,process.env.VERCEL_ENV);
const previewDemo=env.VITE_PREVIEW_DEMO_ACTIVE==='true'||nodePreviewDemo;
const supabaseUrl=env.VITE_SUPABASE_URL?.trim()||'';
const supabaseKey=env.VITE_SUPABASE_ANON_KEY?.trim()||'';
export const config={supabaseUrl,supabaseKey,siteUrl:env.VITE_SITE_URL?.trim()||'',previewDemo,demo:storefrontDemoEnabled(!!(supabaseUrl||supabaseKey),env.MODE==='demo'||env.DEV&&env.VITE_DEMO_MODE==='true',previewDemo)};
