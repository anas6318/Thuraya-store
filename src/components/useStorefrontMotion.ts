import {useEffect} from 'react';
/**
 * One motion idea, used sparingly: when a strip of product windows (or the
 * editorial band) enters the viewport, its horizon line is drawn once from the
 * centre. Progressive enhancement — lines are visible without JavaScript,
 * above-the-fold content is never hidden, and reduced motion skips it entirely.
 */
export function useStorefrontMotion(path:string){useEffect(()=>{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!('IntersectionObserver' in window))return;
 const targets=[...document.querySelectorAll<HTMLElement>('main.storefront .vitrine-row, main.storefront .editorial')].filter(el=>el.getBoundingClientRect().top>window.innerHeight*.9);
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);entry.target.classList.add('is-lit')}},{threshold:.35});
 targets.forEach(el=>{el.classList.add('will-light');observer.observe(el)});
 const stop=()=>{if(reduced.matches){observer.disconnect();targets.forEach(el=>el.classList.remove('will-light','is-lit'))}};
 reduced.addEventListener('change',stop);
 return ()=>{observer.disconnect();reduced.removeEventListener('change',stop);targets.forEach(el=>el.classList.remove('will-light','is-lit'))};
 },[path])}
