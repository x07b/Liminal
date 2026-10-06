import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useLocale } from './locale';
import { AnimatedHeading } from './TypedReveal';
import { EngagementModels } from './BusinessEngine';
import { HowThingsEscape, FinalCall } from './Existence';
export default function ExistenceServices(){const {t}=useLocale();return <div className="existence"><header className="ex-wrap ex-page-opening"><div className="ex-tag">{t('NOS SERVICES','OUR SERVICES','خدماتنا')}</div><AnimatedHeading as="h1">{t('De l’idée','From the idea','من الفكرة')}<br/><em>{t('à ce qui existe.','to the real thing.','إلى الواقع.')}</em></AnimatedHeading><p>{t('Nous réunissons la direction, le design et la production autour de ce que votre idée demande.','We bring direction, design and production together around what your idea needs.','نجمع التوجيه والتصميم والإنتاج حول ما تحتاجه فكرتك.')}</p><Link className="ex-pill ex-dark" to="/contact">{t('Démarrer un projet','Start a project','ابدأ مشروعاً')}<ArrowUpRight size={18}/></Link></header><section className="ex-wrap ex-service-list">{[
 ['Direction & identité','Direction & identity','التوجيه والهوية','Positionnement créatif, concept, identité visuelle et langage de marque.','Creative positioning, concept, visual identity and brand language.','تموضع إبداعي ومفهوم وهوية بصرية ولغة للعلامة.'],
 ['Film & mouvement','Film & motion','الفيلم والحركة','Films, contenus de campagne, motion design et postproduction.','Films, campaign content, motion design and postproduction.','أفلام ومحتوى حملات وتصميم حركة وما بعد الإنتاج.'],
 ['Expériences & fabrication','Experiences & making','التجارب والصناعة','Interfaces, expériences numériques, prototypes et applications physiques.','Interfaces, digital experiences, prototypes and physical applications.','واجهات وتجارب رقمية ونماذج أولية وتطبيقات ملموسة.']
].map(([fr,en,ar,dfr,den,dar],i)=><article className="engagement-row" key={en}><span className="ex-tag">0{i+1}</span><h2>{t(fr,en,ar)}</h2><p>{t(dfr,den,dar)}</p></article>)}</section><HowThingsEscape/><section className="ex-wrap ex-service-models"><EngagementModels/></section><FinalCall/></div>;}
