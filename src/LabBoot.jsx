import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLocale } from './locale';

// A short visual introduction, not a network or security diagnostic.
export default function LabBoot({ children }) {
 const { t } = useLocale(), reduced = useReducedMotion();
 const [done, setDone] = useState(false), [elapsed, setElapsed] = useState(0);
 const skip = useRef(null), dialog = useRef(null);
 const lines = [
  t('Initialisation de l’espace créatif…','Initializing the creative space…','تهيئة المساحة الإبداعية…'),
  t('Chargement des idées inachevées…','Loading unfinished ideas…','تحميل الأفكار غير المكتملة…'),
  t('Connexion : images / son / code…','Connecting: images / sound / code…','ربط الصور والصوت والبرمجة…'),
  t('Mode expérimentation activé.','Experiment mode enabled.','تم تفعيل وضع التجربة.'),
  t('Système prêt. Entrez dans le Lab.','System ready. Enter the Lab.','النظام جاهز. ادخل المختبر.')
 ];
 useEffect(()=>{
  if (done) return;
  if (reduced) { setDone(true); return; }
  const previous = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  dialog.current?.showModal();
  skip.current?.focus({preventScroll:true});
  const started = performance.now();
  const timer = setInterval(()=>setElapsed(performance.now()-started),40);
  const finish = setTimeout(()=>setDone(true),6600);
  return ()=>{clearInterval(timer);clearTimeout(finish);document.body.style.overflow=previous;};
 },[reduced,done]);
 useEffect(()=>{
  if(!done)return;
  const heading=document.querySelector('.ex-lab-opening h1');
  heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});
 },[done]);
 const phase = Math.max(0, elapsed - 400);
 const step = Math.min(5, Math.floor(phase / 1100));
 const active = step < lines.length ? lines[step].slice(0, Math.floor(Math.min(1,(phase % 1100)/850) * lines[step].length)) : "";
 if(done || reduced)return children;
 return <dialog ref={dialog} className="lab-boot" onCancel={e=>{e.preventDefault();setDone(true);}} aria-label={t('Ouverture de Liminal Lab','Opening Liminal Lab','فتح مختبر ليمينال')} onKeyDown={e=>{if(e.key==='Escape')setDone(true);}}>
  <div className="lab-terminal"><p className="lab-os">LIMINAL LAB / SYSTEM 001</p><div className="lab-log-area" aria-hidden="true">{lines.slice(0,step).map((line,i)=><p className="lab-log" key={line}><span>[OK]</span> {line}</p>)} {step < lines.length && <p className="lab-log lab-active"><span>[..]</span> {active}<span className="lab-cursor">▊</span></p>}</div>
  <p className="typed-accessible" role="status">{t('Ouverture du laboratoire créatif.','Opening the creative laboratory.','جار فتح المختبر الإبداعي.')}</p>
  <button ref={skip} className="lab-skip" onClick={()=>setDone(true)}>{t('Entrer maintenant','Enter now','ادخل الآن')} <span aria-hidden="true">↗</span></button></div>
 </dialog>;
}
