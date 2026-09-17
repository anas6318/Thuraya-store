/**
 * A preview demo is deliberately a two-key decision: Vercel must identify the
 * deployment as a Preview and the deployment must explicitly opt in. This is
 * shared by the Vite build and server prerender so their output cannot drift.
 */
export const previewDemoEnabled=(previewFlag:string|undefined,vercelEnvironment:string|undefined)=>previewFlag==='true'&&vercelEnvironment==='preview';

/** A configured (including partially configured) backend always wins over fixtures. */
export const storefrontDemoEnabled=(hasAnyBackendConfig:boolean,localDemo:boolean,previewDemo:boolean)=>!hasAnyBackendConfig&&(localDemo||previewDemo);
