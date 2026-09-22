import {useEffect,useRef,useState} from 'react';
/**
 * The editorial band's light loop.
 *
 * The approved photograph is the asset. It is the poster, it is what the
 * prerendered page ships, and it is the only thing a phone, a tablet or a
 * visitor who asks for less motion ever sees. The loop is a second layer on
 * top of it — the same frame, the same crop, with the light allowed to drift
 * across the stones — and it is fetched only once the band reaches the
 * viewport. If it is slow, refused or unsupported, nothing happens: the
 * photograph was never removed.
 */
const POINTER_DESKTOP='(min-width:1024px) and (hover:hover) and (pointer:fine)';
const ASKS_FOR_STILL='(prefers-reduced-motion:reduce)';
/** Loops are opt-in per still, so a CMS image swap can never orphan a video over the wrong photograph. */
const loops:Record<string,string>={'/media/tennis-bracelet-blue.jpeg':'/media/tennis-bracelet-blue-loop'};
export const editorialLoop=(still:string):string|undefined=>loops[still];
/** VP9 first, H.264 second: the smaller file where it is understood, the universal one everywhere else. */
export const loopSources=(base:string)=>[{src:`${base}.webm`,type:'video/webm'},{src:`${base}.mp4`,type:'video/mp4'}];
export function EditorialLoop({src}:{src:string}){
 const ref=useRef<HTMLVideoElement>(null);
 const [allowed,setAllowed]=useState(false);
 const [visible,setVisible]=useState(false);
 const [armed,setArmed]=useState(false);
 const [lit,setLit]=useState(false);
 useEffect(()=>{
  if(typeof matchMedia!=='function')return;
  const desktop=matchMedia(POINTER_DESKTOP),still=matchMedia(ASKS_FOR_STILL);
  const read=()=>setAllowed(desktop.matches&&!still.matches);
  read();desktop.addEventListener('change',read);still.addEventListener('change',read);
  return ()=>{desktop.removeEventListener('change',read);still.removeEventListener('change',read)};
 },[]);
 useEffect(()=>{
  if(!allowed){setVisible(false);setArmed(false);setLit(false);return}
  const node=ref.current;if(!node||typeof IntersectionObserver!=='function'){setVisible(true);return}
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{rootMargin:'160px'});
  observer.observe(node);return ()=>observer.disconnect();
 },[allowed]);
 useEffect(()=>{if(visible)setArmed(true)},[visible]);
 useEffect(()=>{
  const node=ref.current;if(!allowed||!armed||!node)return;
  if(!visible){node.pause();return}
  let live=true;
  if(!node.currentSrc)node.load();
  node.play().then(()=>{if(live)setLit(true)}).catch(()=>{});
  return ()=>{live=false};
 },[allowed,armed,visible]);
 if(!allowed)return null;
 return <video ref={ref} className={`editorial-loop${lit?' is-playing':''}`} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1}>
  {armed&&loopSources(src).map(s=><source key={s.type} src={s.src} type={s.type}/>)}
 </video>;
}
