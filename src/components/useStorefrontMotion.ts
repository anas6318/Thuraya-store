import {useEffect} from 'react';
/** Progressive enhancement: content is visible before JS and if animation fails. */
export function useStorefrontMotion(path:string){useEffect(()=>{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!('IntersectionObserver' in window)||!Element.prototype.animate)return;
 const animations:Animation[]=[];
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);if(!reduced.matches)animations.push(entry.target.animate([{opacity:.5,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'}))}},{threshold:.08});
 document.querySelectorAll('main.storefront > .section, main.storefront > .editorial').forEach(element=>{if(element.getBoundingClientRect().top>window.innerHeight)observer.observe(element)});
 const stop=()=>{if(reduced.matches){observer.disconnect();animations.forEach(animation=>animation.cancel())}};
 reduced.addEventListener('change',stop);
 return ()=>{observer.disconnect();animations.forEach(animation=>animation.cancel());reduced.removeEventListener('change',stop)};
 },[path])}
