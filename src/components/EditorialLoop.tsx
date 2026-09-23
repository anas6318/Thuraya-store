import {useEffect,useRef,useState} from 'react';
/**
 * The editorial band's light loop.
 *
 * The approved photograph is the asset. It is the poster, it is what the
 * prerendered page ships, and it is what a visitor who asks for less motion —
 * or whose browser refuses to start the video — keeps. The loop is a second
 * layer over the same frame with the same crop and the same masks, and it is
 * fetched only once the band approaches the viewport. If it is slow, refused
 * or unsupported, nothing happens on screen: the photograph was never removed.
 *
 * It plays on phones and tablets as well as desktops. Mobile Safari allows a
 * muted, inline video to start without a gesture, so the element is muted in
 * the markup and again on the node before playback, carries `playsinline`, and
 * exposes no controls, no picture-in-picture and no remote playback — nothing
 * that could take it fullscreen.
 */
const ASKS_FOR_STILL='(prefers-reduced-motion:reduce)';
/** Loops are opt-in per still, so a CMS image swap can never orphan a video over the wrong photograph. */
const loops:Record<string,string>={'/media/tennis-bracelet-blue.jpeg':'/media/tennis-bracelet-blue-loop'};
export const editorialLoop=(still:string):string|undefined=>loops[still];
/** VP9 first, H.264 second: the smaller file where it is understood, the universal one everywhere else. */
export const loopSources=(base:string)=>[{src:`${base}.webm`,type:'video/webm'},{src:`${base}.mp4`,type:'video/mp4'}];
/** A visitor on a metered connection who has asked for less data keeps the photograph. */
const savingData=():boolean=>{const c=(navigator as {connection?:{saveData?:boolean}}).connection;return c?.saveData===true};
export function EditorialLoop({src}:{src:string}){
 const ref=useRef<HTMLVideoElement>(null);
 const [allowed,setAllowed]=useState(false);
 const [visible,setVisible]=useState(false);
 const [armed,setArmed]=useState(false);
 const [lit,setLit]=useState(false);
 useEffect(()=>{
  if(typeof matchMedia!=='function')return;
  const still=matchMedia(ASKS_FOR_STILL);
  const read=()=>setAllowed(!still.matches&&!savingData());
  read();still.addEventListener('change',read);
  return ()=>still.removeEventListener('change',read);
 },[]);
 useEffect(()=>{
  if(!allowed){setVisible(false);setArmed(false);setLit(false);return}
  const node=ref.current;if(!node||typeof IntersectionObserver!=='function'){setVisible(true);return}
  const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{rootMargin:'200px'});
  observer.observe(node);return ()=>observer.disconnect();
 },[allowed]);
 useEffect(()=>{if(visible)setArmed(true)},[visible]);
 useEffect(()=>{
  const node=ref.current;if(!allowed||!armed||!node)return;
  if(!visible){node.pause();return}
  let live=true;
  node.muted=true;node.defaultMuted=true;              // iOS starts inline playback only for a muted element
  if(!node.currentSrc)node.load();
  node.play().then(()=>{if(live)setLit(true)}).catch(()=>{if(live)setLit(false)});
  return ()=>{live=false};
 },[allowed,armed,visible]);
 if(!allowed)return null;
 return <video ref={ref} className={`editorial-loop${lit?' is-playing':''}`} muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden="true" tabIndex={-1}>
  {armed&&loopSources(src).map(s=><source key={s.type} src={s.src} type={s.type}/>)}
 </video>;
}
