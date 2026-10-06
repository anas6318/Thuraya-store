/**
 * The single build-time site-origin contract. Prerender (canonical, hreflang,
 * og:url, sitemap, robots) and the artifact checks both resolve through here, so
 * a production build can never ship localhost SEO URLs. Local, test, demo and
 * Vercel Preview builds keep the localhost fallback.
 */
export const LOCAL_SITE_ORIGIN='http://localhost:4173';

export const isProductionBuild=(vercelEnv:string|undefined)=>vercelEnv==='production';

// ponytail: suffix/IP denylist, not a DNS check; extend if another non-public host shape shows up.
const nonPublicHost=(h:string)=>h.endsWith('.')||!h.includes('.')||h==='localhost'||h.startsWith('[')||/^\d{1,3}(\.\d{1,3}){3}$/.test(h)||['.localhost','.local','.internal','.test','.invalid','.example','.localdomain','.lan','.home.arpa'].some(s=>h.endsWith(s));

export function resolveSiteOrigin(raw:string|undefined,vercelEnv:string|undefined):string{
  const prod=isProductionBuild(vercelEnv),value=raw?.trim();
  const fail=(why:string):never=>{throw new Error(`VITE_SITE_URL must be the canonical https origin of the production storefront (for example https://<your-domain>) ${prod?'when VERCEL_ENV=production':'whenever it is set'}; ${why}; received ${value?JSON.stringify(value.replace(/\/\/[^/@]*@/,'//***@')):'missing'}`)};
  if(!value){if(prod)return fail('it is not set');return LOCAL_SITE_ORIGIN}
  let u:URL;try{u=new URL(value)}catch{return fail('it is not a valid URL')}
  if(u.protocol!=='http:'&&u.protocol!=='https:')fail('only http(s) is allowed');
  if(u.username||u.password)fail('credentials are not allowed');
  if(u.pathname!=='/'||u.search||u.hash)fail('it must be an origin with no path, query or hash');
  if(prod){if(u.protocol!=='https:')fail('production requires https');if(nonPublicHost(u.hostname))fail('the host is not a public production host')}
  return u.origin;
}
