import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useMotionValueEvent } from 'motion/react';
import { ArrowUpRight, ArrowRight, ArrowDown } from 'lucide-react';
import { useLocale } from './locale';
import { useProjects } from './ProjectsContext';
import './EditorialHome.css';

const ease = [.22, 1, .36, 1];
function Enter({ children, className = '', delay = 0 }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .95, delay, ease }}>{children}</motion.div>;
}
function Title({ children }) {
  const reduced = useReducedMotion();
  return <motion.h2 initial={reduced ? false : { clipPath: 'inset(0 0 100% 0)', y: 18 }} whileInView={{ clipPath: 'inset(0 0 0% 0)', y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: 1.15, ease }}>{children}</motion.h2>;
}
function Index({ n, children }) { return <div className="eh-index"><span>{n}</span><span>{children}</span></div>; }
function ProjectImage({ p, eager = false }) {
  if (!p) return null;
  return p.visual === 'video' ? <video src={p.media} poster={p.poster || undefined} controls playsInline preload="metadata" aria-label={p.title} /> : <img src={p.media} alt={p.title} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
}
function Opening({ projects }) {
  const { t } = useLocale();
  const ref = useRef(null), reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const progress = useSpring(scrollYProgress, { stiffness: 75, damping: 28 });
  const leftY = useTransform(progress, [0, 1], [30, -55]);
  const rightY = useTransform(progress, [0, 1], [-20, 55]);
  const angle = useTransform(progress, [0, 1], [-7, -2]);
  return <section className="eh-opening" ref={ref}>
    <div className="eh-wrap">
      <Enter className="eh-kicker">{t('MAISON DE PRODUCTION CRÉATIVE · TUNISIE', 'CREATIVE PRODUCTION HOUSE · TUNISIA', 'دار إنتاج إبداعي · تونس')}</Enter>
      <Enter delay={.08}><h1>{t('Des images', 'Images', 'صور')}<br /><em>{t('qu’on n’oublie pas.', 'worth remembering.', 'لا تُنسى.')}</em></h1></Enter>
      <Enter delay={.16} className="eh-opening-copy"><p>{t('Nous donnons une direction à vos idées, puis nous produisons les films, les images et le son qui les font exister.', 'We give your ideas a direction. Then we produce the films, visuals and sound that make them real.', 'نمنح أفكاركم توجّهاً واضحاً، ثم ننتج الأفلام والصور والصوت التي تمنحها حضوراً.')}</p>
        <div className="eh-actions"><Link className="eh-solid" to="/contact">{t('Parlons de votre projet', 'Let’s talk about your project', 'لنتحدث عن مشروعكم')}<ArrowUpRight size={18} /></Link><a className="eh-link" href="#selected-work">{t('Voir le travail', 'See the work', 'شاهد الأعمال')}<ArrowDown size={16} /></a></div>
      </Enter>
      {projects.length > 0 && <div className="eh-stage" aria-label={t('Quelques univers du studio', 'A few worlds from the studio', 'عوالم من الاستوديو')}>
        {projects.slice(0, 3).map((p, i) => <motion.div className={'eh-stage-piece eh-piece-' + i} key={p.id} style={reduced ? undefined : i === 0 ? { y: leftY, rotate: angle } : i === 2 ? { y: rightY } : undefined}>
          <Link to={'/projects/' + p.slug} aria-label={t('Découvrir ', 'Explore ', 'اكتشف ') + p.title}><ProjectImage p={p} eager /><span>{p.title}<ArrowUpRight size={15} /></span></Link>
        </motion.div>)}
        <span className="eh-stage-note">{t('UNE IDÉE PEUT OUVRIR TOUT UN MONDE.', 'ONE IDEA CAN OPEN A WHOLE WORLD.', 'فكرة واحدة تفتح عالماً كاملاً.')}</span>
      </div>}
    </div>
  </section>;
}
function Selected({ projects, loading, error, refresh }) {
  const { t } = useLocale();
  return <section id="selected-work" className="eh-work eh-wrap eh-chapter">
    <Index n="01">{t('L’idée devient visible', 'The idea takes shape', 'الفكرة تأخذ شكلها')}</Index>
    <div className="eh-heading-pair"><Title>{t('Un univers à chaque fois.', 'A world of its own.', 'عالم خاص بكل مشروع.')}</Title><p>{t('Une marque ne tient pas dans un seul format. Voici comment une direction se retrouve dans chaque image.', 'A brand goes beyond a single format. See how one direction carries through every image.', 'العلامة لا تختصر في شكل واحد. اكتشفوا كيف يمتد التوجّه الواحد عبر كل صورة.')}</p></div>
    {loading && <p role="status">{t('Chargement des projets…', 'Loading projects…', 'جار تحميل المشاريع…')}</p>}
    {error && <p role="alert">{t('Les projets sont momentanément indisponibles.', 'Projects are temporarily unavailable.', 'المشاريع غير متاحة مؤقتاً.')} <button onClick={refresh}>{t('Réessayer', 'Retry', 'إعادة المحاولة')}</button></p>}
    <div className="eh-work-grid">{projects.slice(0, 2).map((p, i) => <Enter className="eh-work-item" key={p.id} delay={i * .08}><Link to={'/projects/' + p.slug}><div className="eh-work-image"><ProjectImage p={p} /></div><div className="eh-work-caption"><div><h3>{p.title}</h3><p>{p.description}</p></div><ArrowUpRight size={26}/></div></Link></Enter>)}</div>
    <Link className="eh-link eh-work-more" to="/projects">{t('Explorer tous les projets', 'Explore all projects', 'استكشف جميع المشاريع')}<ArrowRight size={18} /></Link>
  </section>;
}
function Offer() {
  const { t } = useLocale();
  const items = [
    [t('Direction créative', 'Creative direction', 'التوجيه الإبداعي'),t('Trouver l’idée juste. Poser le concept, le récit et le langage visuel avant de produire.', 'Find the right idea. Define the concept, story and visual language before production begins.', 'نجد الفكرة المناسبة ونحدّد المفهوم والسرد واللغة البصرية قبل الإنتاج.')],
    [t('Films & production', 'Film & production', 'الأفلام والإنتاج'),t('Organiser et produire les films, photographies et contenus dont votre marque a besoin.', 'Plan and produce the films, photography and content your brand needs.', 'نخطّط وننتج الأفلام والصور والمحتوى الذي تحتاجه علامتكم.')],
    [t('Motion & post', 'Motion & post', 'الحركة وما بعد الإنتاج'),t('Monter, animer et finaliser. Puis adapter chaque pièce aux formats qui comptent.', 'Edit, animate and finish. Then adapt each piece to the formats that matter.', 'نركّب ونحرّك وننجز اللمسات الأخيرة، ثم نكيّف كل عمل للصيغ المطلوبة.')],
    [t('Partenariat créatif', 'Creative partnership', 'الشراكة الإبداعية'),t('Construire dans la durée, avec une direction qui reste cohérente d’une campagne à l’autre.', 'Build over time, with a consistent direction from one campaign to the next.', 'نبني معكم على المدى الطويل، بتوجّه متناسق من حملة إلى أخرى.')],
  ];
  return <section className="eh-offer"><div className="eh-wrap eh-chapter"><Index n="02">{t('Ce que nous prenons en main', 'What we take care of', 'ما نتولّاه معكم')}</Index><div className="eh-offer-grid"><div className="eh-offer-intro"><Title>{t('Une idée forte.', 'One strong idea.', 'فكرة قوية.')}<br/><em>{t('Tout ce qu’il lui faut.', 'Everything it needs.', 'وكل ما تحتاجه.')}</em></Title><p>{t('Vous pouvez nous confier un projet complet ou nous rejoindre à une étape précise. Nous gardons le même regard sur l’ensemble.', 'Bring us the whole project or invite us in at a specific stage. We keep the whole picture in view.', 'يمكنكم إسناد المشروع كاملاً أو إشراكنا في مرحلة محدّدة. نحافظ دائماً على رؤية العمل ككل.')}</p><Link className="eh-link" to="/services">{t('Découvrir nos services', 'Explore our services', 'اكتشف خدماتنا')}<ArrowUpRight size={18}/></Link></div><div className="eh-offer-list">{items.map(([title,copy],i)=><Enter key={title}><article><span className="eh-item-num">0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></article></Enter>)}</div></div></div></section>;
}
function Journey() {
  const { t } = useLocale();
  const ref=useRef(null), reduced=useReducedMotion();
  const [active,setActive]=useState(0);
  const {scrollYProgress}=useScroll({target:ref,offset:['start 58%','end 70%']});
  const smooth=useSpring(scrollYProgress,{stiffness:65,damping:24});
  const rotate=useTransform(smooth,[0,1],[-30,180]);
  useMotionValueEvent(scrollYProgress,'change',v=>setActive(Math.min(4,Math.max(0,Math.floor(v*5)))));
  const stages=[
    [t('Comprendre','Understand','نفهم'),t('Votre objectif, votre public, vos contraintes. Nous cadrons ensemble le travail à faire.','Your objective, audience and constraints. Together, we define the work to be done.','هدفكم وجمهوركم وحدود المشروع. نحدّد معاً العمل المطلوب.')],
    [t('Donner une direction','Set the direction','نحدّد التوجّه'),t('Un concept et un traitement partagés. Vous savez où nous allons avant de lancer la production.','A shared concept and treatment. You know where we are heading before production starts.','مفهوم ومعالجة نتفق عليهما. تعرفون الوجهة قبل بداية الإنتاج.')],
    [t('Produire','Produce','ننتج'),t('Les bons collaborateurs autour du projet. Une production organisée autour de cette direction.','The right collaborators for the project. A production organised around that direction.','المتعاونون المناسبون للمشروع وإنتاج منظّم حول التوجّه المتفق عليه.')],
    [t('Affiner','Refine','نصقل'),t('Montage, mouvement, couleur et son. Nous travaillons les détails avec vous jusqu’à validation.','Edit, motion, colour and sound. We work through the details with you until approval.','مونتاج وحركة ولون وصوت. نصقل التفاصيل معكم حتى الاعتماد.')],
    [t('Livrer','Deliver','نسلّم'),t('Des fichiers organisés, dans les formats convenus. Prêts à prendre leur place dans votre communication.','Organised files in the agreed formats. Ready to take their place in your communication.','ملفات منظّمة بالصيغ المتفق عليها، جاهزة للاستخدام في تواصلكم.')],
  ];
  return <section className="eh-journey eh-wrap eh-chapter"><Index n="03">{t('Du premier échange au dernier fichier','From first conversation to final file','من أول حديث إلى آخر ملف')}</Index><div className="eh-journey-grid"><div className="eh-journey-fixed"><Title>{t('Vous savez toujours','You always know','تعرفون دائماً')}<br/><em>{t('où nous allons.','what comes next.','ما الخطوة التالية.')}</em></Title><div className="eh-orbit" aria-hidden="true"><motion.div className="eh-orbit-lines" style={reduced?undefined:{rotate}}><i/><i/><i/></motion.div><img src="/brand/pictorial.svg" alt=""/><span className="eh-orbit-number">0{active+1}<small>/ 05</small></span></div><p className="eh-journey-status"><span/>{stages[active][0]}</p></div><div className="eh-stages" ref={ref}>{stages.map(([title,copy],i)=><Enter key={title}><article className={i<=active?'is-reached':''}><span className="eh-step-num">0{i+1}</span><div><h3>{title}</h3><p>{copy}</p></div></article></Enter>)}</div></div><Enter className="eh-origin"><p>{t('Basés en Tunisie. Un regard propre, un réseau créatif qui se construit autour de chaque projet.','Based in Tunisia. A distinct point of view, with a creative network built around each project.','من تونس. رؤية خاصة وشبكة إبداعية تتشكّل حول احتياجات كل مشروع.')}</p><Link className="eh-link" to="/our-story">{t('Rencontrer LIMINAL','Meet LIMINAL','تعرّف على ليمينال')}<ArrowUpRight size={18}/></Link></Enter></section>;
}
function Partnership() {
  const {t}=useLocale();const [selected,setSelected]=useState(0);
  const options=[
    [t('Un besoin précis','A focused brief','حاجة محدّدة'),t('Une pièce. Toute notre attention.','One piece. Our full attention.','عمل واحد. كل اهتمامنا.'),t('Un film, un montage, une identité ou une session de production. Nous définissons le périmètre, les livrables et un devis adapté.','A film, an edit, an identity or a production session. We agree the scope, deliverables and a tailored quote.','فيلم أو مونتاج أو هوية أو جلسة إنتاج. نحدّد النطاق والمخرجات وعرض السعر المناسب.'),t('Périmètre défini · Devis par projet','Defined scope · Project quote','نطاق محدّد · عرض سعر للمشروع')],
    [t('Une campagne','A campaign','حملة'),t('Une direction. Plusieurs expressions.','One direction. Many expressions.','توجّه واحد. تعبيرات متعددة.'),t('Pour un lancement ou un temps fort, nous relions le concept, la production et les déclinaisons dans un même ensemble.','For a launch or a key moment, we connect the concept, production and adaptations into one coherent body of work.','لإطلاق أو مناسبة مهمّة، نربط المفهوم والإنتاج والنسخ المتعدّدة في مجموعة متكاملة.'),t('Concept → Production → Déclinaisons','Concept → Production → Adaptations','مفهوم ← إنتاج ← نسخ متعددة')],
    [t('Dans la durée','An ongoing partnership','شراكة مستمرة'),t('Un partenaire qui apprend votre marque.','A partner who learns your brand.','شريك يعرف علامتكم.'),t('Nous planifions ensemble les besoins récurrents, le rythme de production et la collaboration. Le cadre évolue avec votre marque.','Together, we plan recurring needs, production rhythm and collaboration. The framework evolves with your brand.','نخطّط معاً للاحتياجات المتكرّرة وإيقاع الإنتاج والتعاون. ويتطوّر إطار العمل مع علامتكم.'),t('Planning partagé · Cadre récurrent sur mesure','Shared planning · Tailored recurring scope','تخطيط مشترك · نطاق متكرّر حسب الحاجة')]
  ];
  return <section className="eh-partnership"><div className="eh-wrap eh-chapter"><Index n="04">{t('Trouver le bon cadre','Find the right way to work','نجد إطار العمل المناسب')}</Index><div className="eh-heading-pair"><Title>{t('La bonne collaboration','The right collaboration','التعاون المناسب')}<br/><em>{t('commence par votre besoin.','starts with your needs.','يبدأ باحتياجاتكم.')}</em></Title></div><div className="eh-model-layout"><div className="eh-model-tabs" role="tablist" aria-label={t('Formats de collaboration','Ways to work together','أشكال التعاون')}>{options.map((o,i)=><button key={o[0]} id={'eh-model-tab-'+i} role="tab" aria-selected={selected===i} aria-controls="eh-model-panel" tabIndex={selected===i?0:-1} onClick={()=>setSelected(i)} onKeyDown={e=>{let next;if(e.key==='ArrowDown'||e.key==='ArrowRight')next=(i+1)%3;else if(e.key==='ArrowUp'||e.key==='ArrowLeft')next=(i+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;if(next!==undefined){e.preventDefault();setSelected(next);document.getElementById('eh-model-tab-'+next)?.focus();}}}><span>0{i+1}</span>{o[0]}<ArrowUpRight size={20}/></button>)}</div><div id="eh-model-panel" role="tabpanel" tabIndex={0} aria-labelledby={'eh-model-tab-'+selected}><h3>{options[selected][1]}</h3><p>{options[selected][2]}</p><span className="eh-model-meta">{options[selected][3]}</span><Link className="eh-link" to="/contact">{t('En parler ensemble','Let’s talk it through','لنتحدث معاً')}<ArrowRight size={18}/></Link></div></div></div></section>;
}
export default function EditorialHome() {
 const {projects,loading,error,refresh}=useProjects();const {t}=useLocale();
 const selection=projects.filter(p=>p.featured);const work=selection.length?selection:projects;
 return <div className="editorial-home"><Opening projects={work}/><Selected projects={work} loading={loading} error={error} refresh={refresh}/><Offer/><Journey/><Partnership/><section className="eh-close"><div className="eh-wrap"><Enter><span className="eh-kicker">{t('LE PROCHAIN PAS','THE NEXT STEP','الخطوة التالية')}</span><h2>{t('Une idée suffit','One idea is enough','فكرة واحدة تكفي')}<br/><em>{t('pour commencer.','to begin.','لنبدأ.')}</em></h2><div className="eh-close-bottom"><p>{t('Dites-nous ce que vous souhaitez faire avancer. Nous trouverons ensemble la bonne direction.','Tell us what you want to move forward. We’ll find the right direction together.','أخبرونا بما تريدون تحقيقه. سنجد معاً التوجّه المناسب.')}</p><Link to="/contact" className="eh-close-link">{t('Démarrer un projet','Start a project','ابدأ مشروعاً')}<span><ArrowUpRight size={30}/></span></Link></div></Enter></div></section></div>;
}
