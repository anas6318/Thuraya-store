import {test,expect,type Page} from '@playwright/test';
/**
 * The editorial loop is a second layer over the approved photograph. If the two layers do not occupy exactly the same
 * box, the bracelet is drawn twice (the real-iPad defect: WebKit grew the in-flow <picture> past the box in landscape).
 */
const rect=(page:Page,selector:string)=>page.locator(selector).first().evaluate(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(Math.round)});
const near=(a:number[],b:number[])=>a.every((v,i)=>Math.abs(v-b[i])<=1);
for(const locale of ['en','ar','he'] as const){
 test(`${locale} editorial loop sits exactly over the photograph, plays near the band and pauses away from it`,async({page})=>{
  await page.goto(`/${locale}`);
  await expect(page.locator('html')).toHaveAttribute('dir',locale==='en'?'ltr':'rtl');
  const band=page.locator('.editorial-image');
  const before=await band.evaluate(e=>Math.round(e.closest('section')!.getBoundingClientRect().height));
  await band.evaluate(e=>e.scrollIntoView({block:'center'}));
  const video=band.locator('video');
  await expect(video).toHaveCount(1);
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused),{timeout:10000}).toBe(false);
  const props=await video.evaluate((v:HTMLVideoElement)=>({muted:v.muted,playsInline:v.hasAttribute('playsinline'),controls:v.controls||v.hasAttribute('controls'),currentSrc:v.currentSrc.replace(location.origin,'')}));
  test.info().annotations.push({type:'currentSrc',description:props.currentSrc});console.log(`[${test.info().project.name}] ${locale} currentSrc ${props.currentSrc}`);
  expect(props).toMatchObject({muted:true,playsInline:true,controls:false});
  expect(props.currentSrc).toMatch(/^\/media\/tennis-bracelet-blue-loop\.(webm|mp4)$/);
  const img=band.locator('picture img');
  await expect(img).toBeVisible();
  await expect.poll(()=>img.evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
  await page.waitForTimeout(1200);
  const [box,photo,loop]=await Promise.all([rect(page,'.editorial-image'),rect(page,'.editorial-image picture img'),rect(page,'.editorial-image video')]);
  expect(near(photo,box),`photograph ${photo} must fill the box ${box}`).toBe(true);
  expect(near(loop,photo),`loop ${loop} must coincide with the photograph ${photo}`).toBe(true);
  expect(await band.evaluate(e=>Math.round(e.closest('section')!.getBoundingClientRect().height))).toBe(before);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,0));
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 });
}
test('reduced motion keeps the photograph and renders no video element',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/ar');
 const band=page.locator('.editorial-image');
 await band.evaluate(e=>e.scrollIntoView({block:'center'}));
 await page.waitForTimeout(800);
 await expect(page.locator('.editorial video')).toHaveCount(0);
 await expect(band.locator('picture img')).toBeVisible();
 expect(await band.locator('picture img').evaluate((i:HTMLImageElement)=>i.complete&&i.naturalWidth>0)).toBe(true);
 expect(near(await rect(page,'.editorial-image picture img'),await rect(page,'.editorial-image'))).toBe(true);
});
