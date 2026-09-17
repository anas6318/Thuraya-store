import {qaPreview} from './scripts/qa-preview';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {previewDemoEnabled} from './shared/preview-demo';
export default defineConfig(()=>{const previewDemo=previewDemoEnabled(process.env.VITE_PREVIEW_DEMO,process.env.VERCEL_ENV);return {define:{'import.meta.env.VITE_PREVIEW_DEMO_ACTIVE':JSON.stringify(previewDemo?'true':'false')},plugins:[react(),qaPreview()],server:{host:'0.0.0.0',port:5173,allowedHosts:['terminal.local']},preview:{host:'0.0.0.0',port:4173,allowedHosts:['terminal.local']},build:{sourcemap:false,rollupOptions:{output:{manualChunks:{react:['react','react-dom','react-dom/client','react-router-dom'],supabase:['@supabase/supabase-js'],validation:['zod']}}}}}});
