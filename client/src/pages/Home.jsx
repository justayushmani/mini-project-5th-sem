import { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, Search, ArrowRight, Shield, BookMarked,
  MessageCircle, FileText, ExternalLink, CheckCircle, Lightbulb,
  Eye, Languages, UserCheck, ClipboardList, ArrowDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
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
    title: 'Scattered across portals',
    desc: 'Scheme information is spread across multiple government websites, ministries, and departments — making it hard to find everything in one place.',
  },
  {
    num: '02',
    title: 'Complex eligibility rules',
    desc: 'Eligibility criteria involve combinations of age, income, occupation, caste, state, and more. Interpreting these rules can be overwhelming.',
  },
  {
    num: '03',
    title: 'Language and literacy barriers',
    desc: 'Many portals are primarily in English or formal Hindi, creating barriers for citizens who are more comfortable in regional languages or conversational speech.',
  },
  {
    num: '04',
    title: 'Not knowing what exists',
    desc: 'Citizens may not even be aware that a relevant scheme exists for their circumstances. You can\'t apply for what you don\'t know about.',
  },
];

/* ── Persona scenarios ── */
const PERSONAS = [
  {
    emoji: '🌾',
    emojiClass: 'farmer',
    role: 'A farmer looking for agricultural support',
    challenge: 'Navigating between state agriculture departments, central PM-KISAN databases, and crop insurance portals can be time-consuming and confusing.',
    how: 'Describe your farm, location, and income — discover relevant agricultural schemes.',
  },
  {
    emoji: '📚',
    emojiClass: 'student',
    role: 'A student exploring education assistance',
    challenge: 'Scholarship and education loan schemes are spread across UGC, state education departments, and minority welfare boards with different application windows.',
    how: 'Share your education level, category, and state — find scholarships that may fit.',
  },
  {
    emoji: '👩‍💼',
    emojiClass: 'woman',
    role: 'A woman exploring entrepreneurship opportunities',
    challenge: 'Women-specific livelihood and entrepreneurship schemes exist across ministries of MSME, rural development, and women & child development — but finding them requires searching each separately.',
    how: 'Explain your goal, background, and location — see relevant livelihood programmes.',
  },
  {
    emoji: '👷',
    emojiClass: 'worker',
    role: 'A worker or family seeking welfare benefits',
    challenge: 'Welfare schemes for housing, health insurance, pensions, and employment are managed by different departments with varying eligibility thresholds.',
    how: 'Tell us about your family, income, and occupation — explore available benefits.',
  },
];

/* ── Solution flow steps ── */
const SOLUTION_STEPS = [
  {
    icon: <Mic size={22} />,
    iconClass: 'iconYellow',
    title: 'Speak or type naturally',
    desc: 'Describe your circumstances in Hindi, English, or Hinglish. No complex forms to navigate.',
  },
  {
    icon: <UserCheck size={22} />,
    iconClass: 'iconBlue',
    title: 'AI extracts your profile',
    desc: 'Our AI interprets your description and builds a structured profile — which you can review and correct.',
  },
  {
    icon: <Search size={22} />,
    iconClass: 'iconGreen',
    title: 'Discover relevant schemes',
    desc: 'Your profile is compared against available scheme eligibility criteria to find potentially matching programmes.',
  },
  {
    icon: <ClipboardList size={22} />,
    iconClass: 'iconYellow',
    title: 'Review requirements',
    desc: 'See eligibility details, required documents, benefits, and application steps for each scheme.',
  },
  {
    icon: <ExternalLink size={22} />,
    iconClass: 'iconBlue',
    title: 'Follow official links',
    desc: 'Every scheme includes links to official government sources for verification and application.',
  },
  {
    icon: <CheckCircle size={22} />,
    iconClass: 'iconGreen',
    title: 'Save and follow up',
    desc: 'Bookmark schemes for later and use the chatbot for any follow-up questions about the process.',
  },
];

/* ── How it works — 4 steps ── */
const HOW_STEPS = [
  {
    num: '1',
    title: 'Tell us about yourself',
    desc: 'Describe your circumstances using voice or text, in a supported language.',
  },
  {
    num: '2',
    title: 'Build your profile',
    desc: 'AI extracts relevant details and presents them for your review and correction.',
  },
  {
    num: '3',
    title: 'Discover relevant schemes',
    desc: 'The platform compares your profile with available scheme eligibility information.',
  },
  {
    num: '4',
    title: 'Take the next step',
    desc: 'Review requirements, explore benefits, and continue through official government sources.',
  },
];

/* ── Capabilities ── */
const CAPABILITIES = [
  {
    icon: <Mic size={22} />,
    title: 'Voice-first discovery',
    desc: 'Start a conversation by speaking — the fastest way to describe complex personal circumstances.',
    featured: false,
  },
  {
    icon: <Languages size={22} />,
    title: 'Hindi, English & Hinglish',
    desc: 'Interact in the language you are most comfortable with. The AI understands mixed-language input.',
    featured: false,
  },
  {
    icon: <UserCheck size={22} />,
    title: 'Profile-based matching',
    desc: 'Your extracted profile is matched against scheme eligibility criteria — age, income, occupation, state, category, and more.',
    featured: true,
  },
  {
    icon: <FileText size={22} />,
    title: 'Clear eligibility info',
    desc: 'Each scheme shows eligibility criteria, required documents, benefits, and step-by-step application instructions.',
    featured: false,
  },
  {
    icon: <ExternalLink size={22} />,
    title: 'Official source links',
    desc: 'Every scheme links directly to its official government source — so you can verify information yourself.',
    featured: false,
  },
  {
    icon: <BookMarked size={22} />,
    title: 'Save for later',
    desc: 'Bookmark relevant schemes and revisit them when you are ready to start the application process.',
    featured: false,
  },
  {
    icon: <MessageCircle size={22} />,
    title: 'Follow-up chatbot',
    desc: 'Ask follow-up questions about any scheme, eligibility requirement, or documentation through the built-in assistant.',
    featured: false,
  },
];

/* ── Trust principles ── */
const TRUST_ITEMS = [
  {
    icon: <ExternalLink size={22} />,
    title: 'Official sources matter',
    desc: 'Every scheme in our database includes a link to its official government source. We encourage you to verify current eligibility criteria directly.',
  },
  {
    icon: <Eye size={22} />,
    title: 'Review your information',
    desc: 'After AI extracts your profile, you can review and edit every field before searching for schemes. You remain in control of your data.',
  },
  {
    icon: <Shield size={22} />,
    title: 'Discovery, not guarantee',
    desc: 'Yojana Saathi helps you discover potentially eligible schemes. Final eligibility and approval is determined by the relevant government department.',
  },
  {
    icon: <CheckCircle size={22} />,
    title: 'Confirm with the department',
    desc: 'Scheme rules can change. We recommend confirming current requirements with the relevant government office before applying.',
  },
];

/* ── Impact themes ── */
const IMPACT_ITEMS = [
  {
    icon: '🔍',
    title: 'Easier scheme discovery',
    desc: 'Reducing the effort needed to find relevant government programmes — from searching dozens of portals to having one conversation.',
  },
  {
    icon: '🗣️',
    title: 'Language-friendly access',
    desc: 'Making scheme information explorable in Hindi, English, and Hinglish — so language is not a barrier to awareness.',
  },
  {
    icon: '📋',
    title: 'Clearer documentation',
    desc: 'Presenting eligibility rules, required documents, and application steps in a structured, readable format.',
  },
  {
    icon: '💡',
    title: 'Improved awareness',
    desc: 'Helping citizens learn about support programmes they may not have known existed for their specific circumstances.',
  },
  {
    icon: '🤝',
    title: 'Simpler digital access',
    desc: 'Making digital public service information easier to navigate — especially for those less familiar with complex government portals.',
  },
];

/* ── Marquee items ── */
const MARQUEE_ITEMS = [
  'Agriculture', 'Education', 'Health', 'Housing', 'Employment',
  'Social Welfare', 'Women & Child', 'Skill Development', 'Financial Inclusion',
  'Insurance', 'Pension', 'Minority Welfare',
];


/* ═══════════════════════════════════════════════════════════════
   HOME COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
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
              <span aria-hidden="true">🇮🇳</span> AI-Powered Scheme Discovery
            </div>

            <h1 id="hero-heading" className={styles.heroTitle}>
              The right scheme<br />
              can <span className={styles.heroTitleHighlight}>change a life.</span>
            </h1>

            <p className={styles.heroSubhead}>
              Finding it shouldn't be the hardest part.
            </p>

            <p className={styles.heroDescription}>
              India has government programmes designed to support farmers, students, women,
              workers, entrepreneurs, and families. Yojana Saathi helps you discover relevant
              schemes through a simple conversation in your language.
            </p>

            <div className={styles.heroCta}>
              <Link
                to={ctaLink}
                className="btn btn-primary btn-lg"
                id="hero-cta-find"
              >
                <Mic size={20} /> Find schemes for me
              </Link>
              <a
                href="#how-it-works"
                className="btn btn-secondary btn-lg"
                id="hero-cta-how"
              >
                <ArrowDown size={18} /> See how it works
              </a>
            </div>

            {!user && (
              <p className={styles.heroNote}>
                Free to use · Speak in Hindi, English, or Hinglish
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
                  <Mic size={16} /> Voice Input
                </div>
                <p className={styles.heroBubbleText}>
                  "I am a farmer from UP..."
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
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={`${item}-${i}`} className={styles.marqueeItem}>
              <span className={styles.marqueeDot} />
              {item}
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
            <div className={styles.problemEyebrow}>THE CHALLENGE</div>
            <h2 id="problem-heading" className={styles.problemTitle}>
              Support exists.<br />
              <span className={styles.yellow}>Finding it</span> is the challenge.
            </h2>
            <p className={styles.problemSubtitle}>
              India runs one of the world's largest social welfare systems. But navigating it
              can feel like searching for a needle in a haystack.
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
                <h3 className={styles.problemCardTitle}>{p.title}</h3>
                <p className={styles.problemCardDesc}>{p.desc}</p>
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
            <div className={styles.peopleEyebrow}>BUILT FOR PEOPLE</div>
            <h2 id="people-heading" className={styles.peopleTitle}>
              Built around people,<br />not paperwork.
            </h2>
            <p className={styles.peopleSubtitle}>
              These illustrative scenarios show how a conversational interface can help
              different citizens discover relevant government schemes.
            </p>
          </div>

          <div className={styles.personaGrid}>
            {PERSONAS.map((p, i) => (
              <div
                key={p.role}
                ref={reveal}
                className={`${styles.reveal} ${styles.personaCard}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={`${styles.personaEmoji} ${styles[p.emojiClass]}`}>
                  {p.emoji}
                </div>
                <h3 className={styles.personaRole}>{p.role}</h3>
                <p className={styles.personaChallenge}>{p.challenge}</p>
                <div className={styles.personaHow}>
                  <Lightbulb size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
                  {p.how}
                </div>
              </div>
            ))}
          </div>

          <p ref={reveal} className={`${styles.reveal} ${styles.personaNote}`}>
            * These are illustrative scenarios, not testimonials. Yojana Saathi helps discover
            potentially relevant schemes — eligibility and approval are determined by government departments.
          </p>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SECTION 5: SOLUTION — MEET YOJANA SAATHI
          ═══════════════════════════════════════ */}
      <section className={styles.solution} aria-labelledby="solution-heading">
        <div className={styles.solutionInner}>
          <div ref={reveal} className={styles.reveal}>
            <div className={styles.solutionEyebrow}>THE PLATFORM</div>
            <h2 id="solution-heading" className={styles.solutionTitle}>
              One conversation.<br />A clearer path to support.
            </h2>
            <p className={styles.solutionSubtitle}>
              Yojana Saathi uses AI to turn your spoken or typed description into a structured
              profile, then matches it against available scheme eligibility information.
            </p>
          </div>

          <div className={styles.solutionFlow}>
            {SOLUTION_STEPS.map((s, i) => (
              <div
                key={s.title}
                ref={reveal}
                className={`${styles.reveal} ${styles.flowStep}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={`${styles.flowStepIcon} ${styles[s.iconClass]}`}>
                  {s.icon}
                </div>
                <h3 className={styles.flowStepTitle}>{s.title}</h3>
                <p className={styles.flowStepDesc}>{s.desc}</p>
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
            <div className={styles.howEyebrow}>HOW IT WORKS</div>
            <h2 id="how-heading" className={styles.howTitle}>
              From your words<br />to your next step.
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
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
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
            <div className={styles.capEyebrow}>CAPABILITIES</div>
            <h2 id="cap-heading" className={styles.capTitle}>
              Designed to make<br />discovery simpler.
            </h2>
            <p className={styles.capSubtitle}>
              Every feature exists to reduce the effort between learning about a scheme and
              taking the next step toward it.
            </p>
          </div>

          <div className={styles.capGrid}>
            {CAPABILITIES.map((c, i) => (
              <div
                key={c.title}
                ref={reveal}
                className={`${styles.reveal} ${c.featured ? styles.capCardFeatured : styles.capCard}`}
                style={{ transitionDelay: `${i * 0.06}s` }}
              >
                <div className={styles.capCardIcon}>{c.icon}</div>
                <div>
                  <h3 className={styles.capCardTitle}>{c.title}</h3>
                  <p className={styles.capCardDesc}>{c.desc}</p>
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
            <div className={styles.trustEyebrow}>TRUST</div>
            <h2 id="trust-heading" className={styles.trustTitle}>
              Useful guidance. Clear sources.<br />No false promises.
            </h2>
            <p className={styles.trustSubtitle}>
              We believe transparency is more valuable than hype. Here's how we approach
              accuracy and trust.
            </p>
          </div>

          <div className={styles.trustGrid}>
            {TRUST_ITEMS.map((t, i) => (
              <div
                key={t.title}
                ref={reveal}
                className={`${styles.reveal} ${styles.trustCard}`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={styles.trustIcon}>{t.icon}</div>
                <div>
                  <h3 className={styles.trustCardTitle}>{t.title}</h3>
                  <p className={styles.trustCardDesc}>{t.desc}</p>
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
            <div className={styles.impactEyebrow}>SOCIAL IMPACT</div>
            <h2 id="impact-heading" className={styles.impactTitle}>
              Technology should make<br />opportunity easier to reach.
            </h2>
            <p className={styles.impactSubtitle}>
              Yojana Saathi is built with the belief that awareness is the first step toward
              access — and that technology can meaningfully lower the barriers to discovering
              government support.
            </p>
          </div>

          <div className={styles.impactGrid}>
            {IMPACT_ITEMS.map((item, i) => (
              <div
                key={item.title}
                ref={reveal}
                className={`${styles.reveal} ${styles.impactCard}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={styles.impactIcon} aria-hidden="true">{item.icon}</div>
                <h3 className={styles.impactCardTitle}>{item.title}</h3>
                <p className={styles.impactCardDesc}>{item.desc}</p>
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
            The support you need<br />may already exist.
          </h2>
          <p className={styles.finalCtaDesc}>
            Start with your story. Discover the schemes that may fit your circumstances.
          </p>
          <div className={styles.finalCtaButtons}>
            <Link
              to={ctaLink}
              className="btn btn-primary btn-lg"
              id="bottom-cta-find"
              style={{ background: 'var(--black)', color: 'var(--white)', boxShadow: '5px 5px 0 rgba(0,0,0,0.3)' }}
            >
              <Mic size={20} /> Find my schemes
            </Link>
            <a
              href="#how-it-works"
              className="btn btn-secondary btn-lg"
              id="bottom-cta-how"
            >
              <ArrowRight size={18} /> Explore how it works
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
              AI-powered government scheme discovery. Helping Indian citizens find
              relevant welfare schemes through simple conversations.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Platform</span>
              <Link to={ctaLink} className={styles.footerLink}>Find Schemes</Link>
              <Link to={user ? '/saved' : '/login'} className={styles.footerLink}>Saved Schemes</Link>
              <Link to={user ? '/chat' : '/login'} className={styles.footerLink}>Chat Assistant</Link>
              <Link to="/doc-simplifier" className={styles.footerLink}>Doc Simplifier</Link>
            </div>
            <div className={styles.footerCol}>
              <span className={styles.footerColTitle}>Account</span>
              {user ? (
                <>
                  <Link to="/profile" className={styles.footerLink}>Profile</Link>
                  <Link to="/saved" className={styles.footerLink}>My Schemes</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className={styles.footerLink}>Login</Link>
                  <Link to="/register" className={styles.footerLink}>Register</Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.footerDisclaimer}>
            Yojana Saathi is a technology platform that helps discover potentially relevant
            government schemes. Eligibility and final approval are subject to official scheme
            rules and government verification. Information may not reflect the most recent changes.
            Always verify with the relevant government department.
          </p>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Yojana Saathi
          </p>
        </div>
      </footer>
    </main>
  );
}
