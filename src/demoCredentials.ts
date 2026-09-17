// Vite removes these fixture credentials from normal production builds. A
// Vercel Preview build can include them only through the Vite-owned safe flag.
const fixturesEnabled=import.meta.env?.MODE==='demo'||import.meta.env?.DEV&&import.meta.env?.VITE_DEMO_MODE==='true'||import.meta.env?.VITE_PREVIEW_DEMO_ACTIVE==='true';
export const demoCredentials=fixturesEnabled?{password:'ThurayaDemo!2026',owner:'owner@thuraya.test',customer:'customer@thuraya.test',orders:'orders@thuraya.test',content:'content@thuraya.test'}:{password:'',owner:'',customer:'',orders:'',content:''};
