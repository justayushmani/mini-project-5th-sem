import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, Search, ArrowRight, Shield, BookMarked,
  MessageCircle, FileText, ExternalLink, CheckCircle, Lightbulb,
  Eye, Languages, UserCheck, ClipboardList, ArrowDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import styles from './Home.module.css';

/* ── Intersection Observer hook for scroll-reveal ── */
function useScrollReveal() {
  const refs = useRef([]);

  const setRef = useCallback((el) => {
    if (el && !refs.current.includes(el)) {
      refs.current.push(el);
    }
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      refs.current.forEach((el) => el.classList.add(styles.revealVisible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealVisible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    refs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return setRef;
}

/* ── Problem statements ── */
const PROBLEMS = [
  {
    num: '01',
    titleKey: 'home.problem.p1Title',
    descKey: 'home.problem.p1Desc',
  },
  {
    num: '02',
    titleKey: 'home.problem.p2Title',
    descKey: 'home.problem.p2Desc',
  },
  {
    num: '03',
    titleKey: 'home.problem.p3Title',
    descKey: 'home.problem.p3Desc',
  },
  {
    num: '04',
    titleKey: 'home.problem.p4Title',
    descKey: 'home.problem.p4Desc',
  },
];

/* ── Persona scenarios ── */
const PERSONAS = [
  {
    emoji: '🌾',
    emojiClass: 'farmer',
    roleKey: 'home.people.farmerRole',
    challengeKey: 'home.people.farmerChallenge',
    howKey: 'home.people.farmerHow',
  },
  {
    emoji: '📚',
    emojiClass: 'student',
    roleKey: 'home.people.studentRole',
    challengeKey: 'home.people.studentChallenge',
    howKey: 'home.people.studentHow',
  },
  {
    emoji: '👩‍💼',
    emojiClass: 'woman',
    roleKey: 'home.people.womanRole',
    challengeKey: 'home.people.womanChallenge',
    howKey: 'home.people.womanHow',
  },
  {
    emoji: '👷',
    emojiClass: 'worker',
    roleKey: 'home.people.workerRole',
    challengeKey: 'home.people.workerChallenge',
    howKey: 'home.people.workerHow',
  },
];

/* ── Solution flow steps ── */
const SOLUTION_STEPS = [
  {
    icon: <Mic size={22} />,
    iconClass: 'iconYellow',
    titleKey: 'home.solution.step1Title',
    descKey: 'home.solution.step1Desc',
  },
  {
    icon: <UserCheck size={22} />,
    iconClass: 'iconBlue',
    titleKey: 'home.solution.step2Title',
    descKey: 'home.solution.step2Desc',
  },
  {
    icon: <Search size={22} />,
    iconClass: 'iconGreen',
    titleKey: 'home.solution.step3Title',
    descKey: 'home.solution.step3Desc',
  },
  {
    icon: <ClipboardList size={22} />,
    iconClass: 'iconYellow',
    titleKey: 'home.solution.step4Title',
    descKey: 'home.solution.step4Desc',
  },
  {
    icon: <ExternalLink size={22} />,
    iconClass: 'iconBlue',
    titleKey: 'home.solution.step5Title',
    descKey: 'home.solution.step5Desc',
  },
  {
    icon: <CheckCircle size={22} />,
    iconClass: 'iconGreen',
    titleKey: 'home.solution.step6Title',
    descKey: 'home.solution.step6Desc',
  },
];

/* ── How it works — 4 steps ── */
const HOW_STEPS = [
  {
    num: '1',
    titleKey: 'home.howItWorks.step1Title',
    descKey: 'home.howItWorks.step1Desc',
  },
  {
    num: '2',
    titleKey: 'home.howItWorks.step2Title',
    descKey: 'home.howItWorks.step2Desc',
  },
  {
    num: '3',
    titleKey: 'home.howItWorks.step3Title',
    descKey: 'home.howItWorks.step3Desc',
  },
  {
    num: '4',
    titleKey: 'home.howItWorks.step4Title',
    descKey: 'home.howItWorks.step4Desc',
  },
];

/* ── Capabilities ── */
const CAPABILITIES = [
  {
    icon: <Mic size={22} />,
    titleKey: 'home.capabilities.voiceTitle',
    descKey: 'home.capabilities.voiceDesc',
    featured: false,
  },
  {
    icon: <Languages size={22} />,
    titleKey: 'home.capabilities.langTitle',
    descKey: 'home.capabilities.langDesc',
    featured: false,
  },
  {
    icon: <UserCheck size={22} />,
    titleKey: 'home.capabilities.profileTitle',
    descKey: 'home.capabilities.profileDesc',
    featured: true,
  },
  {
    icon: <FileText size={22} />,
    titleKey: 'home.capabilities.infoTitle',
    descKey: 'home.capabilities.infoDesc',
    featured: false,
  },
  {
    icon: <ExternalLink size={22} />,
    titleKey: 'home.capabilities.linksTitle',
    descKey: 'home.capabilities.linksDesc',
    featured: false,
  },
  {
    icon: <BookMarked size={22} />,
    titleKey: 'home.capabilities.saveTitle',
    descKey: 'home.capabilities.saveDesc',
    featured: false,
  },
  {
    icon: <MessageCircle size={22} />,
    titleKey: 'home.capabilities.assistantTitle',
    descKey: 'home.capabilities.assistantDesc',
    featured: false,
  },
];

/* ── Trust principles ── */
const TRUST_ITEMS = [
  {
    icon: <ExternalLink size={22} />,
    titleKey: 'home.trust.t1Title',
    descKey: 'home.trust.t1Desc',
  },
  {
    icon: <Eye size={22} />,
    titleKey: 'home.trust.t2Title',
    descKey: 'home.trust.t2Desc',
  },
  {
    icon: <Shield size={22} />,
    titleKey: 'home.trust.t3Title',
    descKey: 'home.trust.t3Desc',
  },
  {
    icon: <CheckCircle size={22} />,
    titleKey: 'home.trust.t4Title',
    descKey: 'home.trust.t4Desc',
  },
];

/* ── Impact themes ── */
const IMPACT_ITEMS = [
  {
    icon: '🔍',
    titleKey: 'home.impact.i1Title',
    descKey: 'home.impact.i1Desc',
  },
  {
    icon: '🗣️',
    titleKey: 'home.impact.i2Title',
    descKey: 'home.impact.i2Desc',
  },
  {
    icon: '📋',
    titleKey: 'home.impact.i3Title',
    descKey: 'home.impact.i3Desc',
  },
  {
    icon: '💡',
    titleKey: 'home.impact.i4Title',
    descKey: 'home.impact.i4Desc',
  },
  {
    icon: '🤝',
    titleKey: 'home.impact.i5Title',
    descKey: 'home.impact.i5Desc',
  },
];

/* ── Marquee keys ── */
const MARQUEE_KEYS = [
  'home.categories.agriculture',
  'home.categories.education',
  'home.categories.health',
  'home.categories.housing',
  'home.categories.employment',
  'home.categories.socialWelfare',
  'home.categories.womenChild',
  'home.categories.skillDev',
  'home.categories.financialInclusion',
  'home.categories.insurance',
  'home.categories.pension',
  'home.categories.minorityWelfare',
];


/* ═══════════════════════════════════════════════════════════════
   HOME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { openChat } = useChat();
  const reveal = useScrollReveal();

  const ctaLink = user ? '/voice' : '/register';

  return (
    <main className={styles.main}>

      {/* ═══════════════════════════════════════
          SECTION 1: HERO — THE PROMISE
          ═══════════════════════════════════════ */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={`${styles.sectionInner} ${styles.heroInner}`}>

          {/* Left: Content */}
          <div>
            <div className={styles.heroBadge}>
              <span aria-hidden="true">🇮🇳</span> {t('home.hero.badge')}
            </div>

            <h1 id="hero-heading" className={styles.heroTitle}>
              {t('home.hero.titleLead')}<br />
              {t('home.hero.titleAction')} <span className={styles.heroTitleHighlight}>{t('home.hero.titleHighlight')}</span>
            </h1>

            <p className={styles.heroSubhead}>
              {t('home.hero.subhead')}
            </p>

            <p className={styles.heroDescription}>
              {t('home.hero.description')}
            </p>

            <div className={styles.heroCta}>
              <Link
                to={ctaLink}
                className="btn btn-primary btn-lg"
                id="hero-cta-find"
              >
                <Mic size={20} /> {t('home.hero.findSchemes')}
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-secondary btn-lg"
                id="hero-cta-how"
              >
                <ArrowDown size={18} /> {t('home.hero.seeHowItWorks')}
              </a>
            </div>

            {!user && (
              <p className={styles.heroNote}>
                {t('home.hero.freeNote')}
              </p>
            )}
          </div>

          {/* Right: Illustration */}
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.heroIllustration}>
              <div className={styles.docStack}>
                <div className={styles.docLayer} />
                <div className={styles.docLayer} />
                <div className={styles.docLayer}>
                  <div className={styles.docLayerLines}>
                    <div className={styles.docLine} />
                    <div className={styles.docLine} />
                    <div className={styles.docLine} />
                    <div className={styles.docLine} />
                    <div className={styles.docLine} />
                  </div>
                </div>
              </div>
              <div className={styles.heroBubble}>
                <div className={styles.heroBubbleIcon}>
                  <Mic size={16} /> {t('home.hero.voiceInput')}
                </div>
                <p className={styles.heroBubbleText}>
                  {t('home.hero.bubbleText')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className={styles.heroShapeYellow} aria-hidden="true" />
        <div className={styles.heroShapeBlue} aria-hidden="true" />
      </section>


      {/* ═══════════════════════════════════════
          MARQUEE STRIP
          ═══════════════════════════════════════ */}
      <div className={styles.marquee} aria-hidden="true">
        <div className={styles.marqueeTrack}>
          {[...MARQUEE_KEYS, ...MARQUEE_KEYS].map((key, i) => (
            <span key={`${key}-${i}`} className={styles.marqueeItem}>
              <span className={styles.marqueeDot} />
              {t(key)}
            </span>
          ))}
        </div>
      </div>


      {/* ═══════════════════════════════════════
          SECTION 3: PROBLEM — THE GAP
          ═══════════════════════════════════════ */}
      <section className={styles.problem} aria-labelledby="problem-heading">
        <div className={styles.problemInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.problemEyebrow}>{t('home.problem.eyebrow')}</div>
            <h2 id="problem-heading" className={styles.problemTitle}>
              {t('home.problem.titleLead')}<br />
              <span className={styles.yellow}>{t('home.problem.titleHighlight')}</span> {t('home.problem.titleEnd')}
            </h2>
            <p className={styles.problemSubtitle}>
              {t('home.problem.subtitle')}
            </p>
          </div>

          <div className={styles.problemGrid}>
            {PROBLEMS.map((p, i) => (
              <div
                key={p.num}
                ref={reveal}
                className={`${styles.reveal} ${styles.problemCard}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={styles.problemNum}>{p.num}</div>
                <h3 className={styles.problemCardTitle}>{t(p.titleKey)}</h3>
                <p className={styles.problemCardDesc}>{t(p.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 4: PEOPLE — WHO WE BUILD FOR
          ═══════════════════════════════════════ */}
      <section className={styles.people} aria-labelledby="people-heading">
        <div className={styles.peopleInner}>
          <div ref={reveal} className={`${styles.reveal} ${styles.peopleHeader}`}>
            <div className={styles.peopleEyebrow}>{t('home.people.eyebrow')}</div>
            <h2 id="people-heading" className={styles.peopleTitle}>
              {t('home.people.titleLine1')}<br />{t('home.people.titleLine2')}
            </h2>
            <p className={styles.peopleSubtitle}>
              {t('home.people.subtitle')}
            </p>
          </div>

          <div className={styles.personaGrid}>
            {PERSONAS.map((p, i) => (
              <div
                key={p.roleKey}
                ref={reveal}
                className={`${styles.reveal} ${styles.personaCard}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={`${styles.personaEmoji} ${styles[p.emojiClass]}`}>
                  {p.emoji}
                </div>
                <h3 className={styles.personaRole}>{t(p.roleKey)}</h3>
                <p className={styles.personaChallenge}>{t(p.challengeKey)}</p>
                <div className={styles.personaHow}>
                  <Lightbulb size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  {t(p.howKey)}
                </div>
              </div>
            ))}
          </div>

          <p ref={reveal} className={`${styles.reveal} ${styles.personaNote}`}>
            {t('home.people.note')}
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 5: SOLUTION — MEET YOJANA SAATHI
          ═══════════════════════════════════════ */}
      <section className={styles.solution} aria-labelledby="solution-heading">
        <div className={styles.solutionInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.solutionEyebrow}>{t('home.solution.eyebrow')}</div>
            <h2 id="solution-heading" className={styles.solutionTitle}>
              {t('home.solution.titleLine1')}<br />{t('home.solution.titleLine2')}
            </h2>
            <p className={styles.solutionSubtitle}>
              {t('home.solution.subtitle')}
            </p>
          </div>

          <div className={styles.solutionFlow}>
            {SOLUTION_STEPS.map((s, i) => (
              <div
                key={s.titleKey}
                ref={reveal}
                className={`${styles.reveal} ${styles.flowStep}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={`${styles.flowStepIcon} ${styles[s.iconClass]}`}>
                  {s.icon}
                </div>
                <h3 className={styles.flowStepTitle}>{t(s.titleKey)}</h3>
                <p className={styles.flowStepDesc}>{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 6: HOW IT WORKS — 4 STEPS
          ═══════════════════════════════════════ */}
      <section
        className={styles.howItWorks}
        id="how-it-works"
        aria-labelledby="how-heading"
      >
        <div className={styles.howInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.howEyebrow}>{t('home.howItWorks.eyebrow')}</div>
            <h2 id="how-heading" className={styles.howTitle}>
              {t('home.howItWorks.titleLine1')}<br />{t('home.howItWorks.titleLine2')}
            </h2>
          </div>

          <div className={styles.stepsTimeline}>
            {HOW_STEPS.map((s, i) => (
              <div
                key={s.num}
                ref={reveal}
                className={`${styles.reveal} ${styles.stepCard}`}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className={styles.stepNumber}>{s.num}</div>
                <div>
                  <h3 className={styles.stepTitle}>{t(s.titleKey)}</h3>
                  <p className={styles.stepDesc}>{t(s.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 7: CAPABILITIES
          ═══════════════════════════════════════ */}
      <section className={styles.capabilities} aria-labelledby="cap-heading">
        <div className={styles.capInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.capEyebrow}>{t('home.capabilities.eyebrow')}</div>
            <h2 id="cap-heading" className={styles.capTitle}>
              {t('home.capabilities.titleLine1')}<br />{t('home.capabilities.titleLine2')}
            </h2>
            <p className={styles.capSubtitle}>
              {t('home.capabilities.subtitle')}
            </p>
          </div>

          <div className={styles.capGrid}>
            {CAPABILITIES.map((c, i) => (
              <div
                key={c.titleKey}
                ref={reveal}
                className={`${styles.reveal} ${c.featured ? styles.capCardFeatured : styles.capCard}`}
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className={styles.capCardIcon}>{c.icon}</div>
                <div>
                  <h3 className={styles.capCardTitle}>{t(c.titleKey)}</h3>
                  <p className={styles.capCardDesc}>{t(c.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 8: TRUST & TRANSPARENCY
          ═══════════════════════════════════════ */}
      <section className={styles.trust} aria-labelledby="trust-heading">
        <div className={styles.trustInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.trustEyebrow}>{t('home.trust.eyebrow')}</div>
            <h2 id="trust-heading" className={styles.trustTitle}>
              {t('home.trust.titleLine1')}<br />{t('home.trust.titleLine2')}
            </h2>
            <p className={styles.trustSubtitle}>
              {t('home.trust.subtitle')}
            </p>
          </div>

          <div className={styles.trustGrid}>
            {TRUST_ITEMS.map((tItem, i) => (
              <div
                key={tItem.titleKey}
                ref={reveal}
                className={`${styles.reveal} ${styles.trustCard}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={styles.trustIcon}>{tItem.icon}</div>
                <div>
                  <h3 className={styles.trustCardTitle}>{t(tItem.titleKey)}</h3>
                  <p className={styles.trustCardDesc}>{t(tItem.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 9: SOCIAL IMPACT
          ═══════════════════════════════════════ */}
      <section className={styles.impact} aria-labelledby="impact-heading">
        <div className={styles.impactInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.impactEyebrow}>{t('home.impact.eyebrow')}</div>
            <h2 id="impact-heading" className={styles.impactTitle}>
              {t('home.impact.titleLine1')}<br />{t('home.impact.titleLine2')}
            </h2>
            <p className={styles.impactSubtitle}>
              {t('home.impact.subtitle')}
            </p>
          </div>

          <div className={styles.impactGrid}>
            {IMPACT_ITEMS.map((item, i) => (
              <div
                key={item.titleKey}
                ref={reveal}
                className={`${styles.reveal} ${styles.impactCard}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={styles.impactIcon} aria-hidden="true">{item.icon}</div>
                <h3 className={styles.impactCardTitle}>{t(item.titleKey)}</h3>
                <p className={styles.impactCardDesc}>{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 10: FINAL CTA
          ═══════════════════════════════════════ */}
      <section className={styles.finalCta} aria-labelledby="final-cta-heading">
        <div className={styles.finalCtaInner}>
          <h2 id="final-cta-heading" className={styles.finalCtaTitle}>
            {t('home.finalCta.titleLine1')}<br />{t('home.finalCta.titleLine2')}
          </h2>
          <p className={styles.finalCtaDesc}>
            {t('home.finalCta.desc')}
          </p>
          <div className={styles.finalCtaButtons}>
            <Link
              to={ctaLink}
              className="btn btn-primary btn-lg"
              id="bottom-cta-find"
              style={{ background: 'var(--black)', color: 'var(--white)', boxShadow: '5px 5px 0 rgba(0,0,0,0.3)' }}
            >
              <Mic size={20} /> {t('home.finalCta.findButton')}
            </Link>
            <a
              href="#how-it-works"
              className="btn btn-secondary btn-lg"
              id="bottom-cta-how"
            >
              <ArrowRight size={18} /> {t('home.finalCta.howButton')}
            </a>
          </div>
        </div>

        <div className={styles.finalCtaShape1} aria-hidden="true" />
        <div className={styles.finalCtaShape2} aria-hidden="true" />
      </section>


      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              YOJANA <span className={styles.footerLogoAccent}>SAATHI</span>
            </div>
            <p className={styles.footerDesc}>
              {t('home.footer.desc')}
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>{t('home.footer.platform')}</span>
              <Link to={ctaLink} className={styles.footerLink}>{t('nav.findSchemes')}</Link>
              <Link to={user ? '/saved' : '/login'} className={styles.footerLink}>{t('nav.savedSchemes')}</Link>
              <button
                type="button"
                onClick={openChat}
                className={styles.footerLink}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
              >
                {t('nav.saathiAssistant')}
              </button>
              <Link to="/doc-simplifier" className={styles.footerLink}>{t('nav.docSimplifier')}</Link>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>{t('home.footer.account')}</span>
              {user ? (
                <>
                  <Link to="/profile" className={styles.footerLink}>{t('nav.profile')}</Link>
                  <Link to="/saved" className={styles.footerLink}>{t('nav.savedSchemes')}</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className={styles.footerLink}>{t('common.login')}</Link>
                  <Link to="/register" className={styles.footerLink}>{t('common.register')}</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerDisclaimer}>
            {t('home.footer.disclaimer')}
          </p>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} {t('common.appName')}
          </p>
        </div>
      </footer>
    </main>
  );
}
