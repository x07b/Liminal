import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { useLocale } from './locale';
import { AnimatedHeading } from './TypedReveal';

export default function BusinessEngine({ engagement = false }) {
 const { t } = useLocale();
 const models = [
  ['01','CLIENT WORK','LE TRAVAIL CLIENT','أعمال العملاء',
   'We build with you.','Nous construisons avec vous.','نبني معكم.',
   'A defined brief, a dedicated team and work made to launch. Client projects fund the company and sharpen the practice.',
   'Un brief cadré, une équipe dédiée, un travail prêt à être lancé. Les projets clients financent la maison et affinent notre pratique.',
   'موجز واضح وفريق مخصص وعمل جاهز للإطلاق. تمول مشاريع العملاء الشركة وتطور ممارستنا.',
   '/work','See our work','Voir nos projets','شاهد أعمالنا'],
  ['02','LIMINAL LAB','LIMINAL LAB','مختبر ليمينال',
   'We make room to explore.','Nous gardons une place pour explorer.','نفسح مجالاً للاستكشاف.',
   'Time goes back into experiments, tools and original ideas. What works can feed the next project or become something of its own.',
   'Nous réinvestissons du temps dans des expériences, des outils et des idées originales. Une découverte peut nourrir un projet ou prendre son indépendance.',
   'نعيد استثمار الوقت في التجارب والأدوات والأفكار الأصلية. ما ينجح قد يغذي مشروعاً قادماً أو يستقل بذاته.',
   '/lab','Explore the Lab','Explorer le Lab','استكشف المختبر'],
  ['03','OWN PRODUCTS','NOS PRODUITS','منتجاتنا',
   'We build beyond the brief.','Nous construisons au-delà du brief.','نبني خارج حدود الموجز.',
   'Selected ideas can become products we own and release. This is our long-term direction. The first drop is still to come.',
   'Certaines idées peuvent devenir nos propres produits. C’est notre développement à long terme. Le premier drop reste à venir.',
   'قد تتحول أفكار مختارة إلى منتجات نملكها ونطلقها. هذا مسارنا على المدى الطويل. الإصدار الأول لم يأتِ بعد.',
   '/drops','Follow the drops','Suivre les drops','تابع الإصدارات'],
 ];
 return <section className="ex-wrap ex-engine" id="business-models">
  <div className="ex-tag">{t('LE MODÈLE LIMINAL','THE LIMINAL MODEL','نموذج ليمينال')}</div>
  <AnimatedHeading>{t('Trois mouvements.','Three movements.','ثلاث حركات.')}<br/><em>{t('Un même moteur.','One shared engine.','محرك واحد.')}</em></AnimatedHeading>
  <p className="engine-intro">{t('Le travail client nous fait avancer. L’expérimentation ouvre la suite. Nos propres idées nous donnent une direction à long terme.','Client work keeps us moving. Experimentation opens what comes next. Our own ideas give us a long-term direction.','عمل العملاء يدفعنا إلى الأمام. والتجربة تفتح المجال للخطوة التالية. وأفكارنا تمنحنا اتجاهاً طويل المدى.')}</p>
  <div className="engine-models">{models.map(([n,en,fr,ar,hen,hfr,har,den,dfr,dar,to,len,lfr,lar])=><article className="engine-card" key={n}>
   <span className="ex-tag">{n} / {t(fr,en,ar)}</span><h3>{t(hfr,hen,har)}</h3><p>{t(dfr,den,dar)}</p><Link className="ex-link" to={to}>{t(lfr,len,lar)}<ArrowUpRight size={17}/></Link>
  </article>)}</div>
  <div className="engine-cycle"><span className="ex-tag">{t('COMMENT ÇA TOURNE','HOW IT KEEPS MOVING','كيف تستمر الحركة')}</span><ol>{[
    ['Créer avec vous','Make with you','نصنع معكم'],['Réinvestir dans le Lab','Reinvest in the Lab','نعيد الاستثمار في المختبر'],['Développer nos idées','Develop our own ideas','نطور أفكارنا'],['Enrichir le prochain projet','Bring discoveries back','نعيد توظيف الاكتشافات']
  ].map(([fr,en,ar],i)=><li key={en}><span>0{i+1}</span>{t(fr,en,ar)}<ArrowRight size={19} aria-hidden="true"/></li>)}</ol></div>
  {engagement ? <EngagementModels/> : <div className="engine-next"><p>{t("Et pour votre projet ? Choisissons le bon cadre.","And for your project? Let’s find the right way to work.","وماذا عن مشروعك؟ لنجد طريقة العمل المناسبة.")}</p><Link className="ex-pill ex-dark" to="/services#ways-to-work">{t("Voir comment travailler ensemble","See how we can work together","شاهد كيف نعمل معاً")}<ArrowUpRight size={18}/></Link></div>}
 </section>;
}
export function EngagementModels(){const {t}=useLocale();return <div className="ex-engagement" id="ways-to-work"><div className="ex-tag">{t('COMMENT TRAVAILLER ENSEMBLE','WAYS TO WORK TOGETHER','كيف نعمل معاً')}</div><AnimatedHeading>{t('Le bon cadre pour','The right shape for','الشكل المناسب')}<br/><em>{t('votre prochaine étape.','your next step.','لخطوتك التالية.')}</em></AnimatedHeading>{[
 ['Un projet précis','A defined project','مشروع محدد','Une identité, un film, un lancement ou une expérience. Nous cadrons ensemble le périmètre, les livrables et le calendrier avant de commencer.','An identity, a film, a launch or an experience. We agree the scope, deliverables and timeline together before starting.','هوية أو فيلم أو إطلاق أو تجربة. نتفق على النطاق والمخرجات والجدول قبل البدء.'],
 ['Un accompagnement continu','An ongoing creative partner','شريك إبداعي مستمر','Pour une marque qui a besoin de continuité. Nous définissons une cadence de travail, des priorités et un périmètre adaptés à vos besoins.','For a brand that needs continuity. We define a working rhythm, priorities and a scope around your needs.','لعلامة تحتاج إلى الاستمرارية. نحدد إيقاع العمل والأولويات والنطاق حسب احتياجاتك.'],
 ['Une idée à construire ensemble','An idea to build together','فكرة نبنيها معاً','Pour une piste qui mérite une collaboration. Les contributions, les droits et les conditions se discutent avant tout engagement.','For an idea worth collaborating on. Contributions, ownership and terms are discussed before any commitment.','لفكرة تستحق التعاون. نناقش المساهمات والملكية والشروط قبل أي التزام.']
].map(([fr,en,ar,dfr,den,dar],i)=><article className="engagement-row" key={en}><span className="ex-tag">0{i+1}</span><h3>{t(fr,en,ar)}</h3><p>{t(dfr,den,dar)}</p></article>)}<Link className="ex-pill ex-dark" to="/contact">{t('Parlons de votre projet','Let’s talk about your project','لنتحدث عن مشروعك')}<ArrowUpRight size={18}/></Link><p className="engine-note">{t('Un premier échange pour cadrer le besoin, puis une proposition adaptée.','A first conversation to understand the need, then a proposal shaped around it.','محادثة أولى لفهم الحاجة، ثم عرض مناسب لها.')}</p></div>;}
