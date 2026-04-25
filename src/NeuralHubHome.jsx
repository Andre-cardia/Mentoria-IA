import { useState, useRef, useEffect, useCallback } from 'react'
import neuralhubBg from './assets/neuralhub-background.png'
import nhLogoImg from './assets/logo-neuralhub.png'
import neuralBlob from './assets/motion-hero/neural-blob-transparent.png'
import instructorAndre from './assets/instructor-andre.jpg'
import instructorCelso from './assets/instructor-celso.jpg'
import logoMicrosoft from './assets/microsoft-logo.svg'
import logoNvidia from './assets/nvidialogo.svg'
import logoInnovation from './assets/innovationlogo.png'
import logoAbstrato from './assets/abstrato.png'
import logoFreedom from './assets/Logo-Freedom-White.png'
import logoMsStartups from './assets/Microsoftstartups.webp'

const GLOBAL_STYLES = `
  @keyframes nhRise {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nhGlow {
    0%,100% { box-shadow: 0 0 0 rgba(255,106,0,0); }
    50%      { box-shadow: 0 0 28px rgba(255,106,0,.22); }
  }
  @keyframes nhPulseLine {
    0%,100% { opacity: .28; transform: scaleX(.94); }
    50%     { opacity: .9;  transform: scaleX(1); }
  }
  @keyframes nhFloat {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-10px); }
  }
  @keyframes nhMarquee {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes nhNodePulse {
    0%,100% { opacity: .5; r: 3; }
    50%     { opacity: 1;  r: 5; }
  }
  @keyframes nhLineDash {
    from { stroke-dashoffset: 200; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes nhFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .nh-rise       { animation: nhRise .85s cubic-bezier(.16,1,.3,1) both; }
  .nh-rise-2     { animation: nhRise .85s .14s cubic-bezier(.16,1,.3,1) both; }
  .nh-rise-3     { animation: nhRise .85s .26s cubic-bezier(.16,1,.3,1) both; }
  .nh-glow       { animation: nhGlow 3.6s ease-in-out infinite; }
  .nh-pulse-line { animation: nhPulseLine 4s ease-in-out infinite; }
  .nh-float      { animation: nhFloat 7s ease-in-out infinite; }
  .nh-fade-in    { animation: nhFadeIn 1.2s .4s ease both; }

  .nh-bg-grid {
    background-image:
      linear-gradient(to right,  rgba(255,255,255,.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .nh-hero {
    --nh-mx: 50%;
    --nh-my: 50%;
    --nh-glow: .28;
  }
  .nh-hero-glow {
    position: absolute;
    inset: -15%;
    background:
      radial-gradient(circle at var(--nh-mx) var(--nh-my), rgba(255,106,0,.12), transparent 16%),
      radial-gradient(circle at 50% 50%, rgba(255,230,190,.05), transparent 34%);
    filter: blur(24px);
    opacity: var(--nh-glow);
    z-index: 1;
    transition: opacity .25s ease;
    pointer-events: none;
  }

  .nh-marquee-track {
    display: flex;
    animation: nhMarquee 32s linear infinite;
    width: max-content;
  }
  .nh-marquee-track:hover { animation-play-state: paused; }

  .nh-client-card {
    transition: background .2s;
  }
  .nh-client-card:hover .nh-client-name {
    color: #d4d0c8;
    transition: color .2s;
  }
  .nh-client-card:hover .nh-client-badge {
    border-color: rgba(255,255,255,.32);
    color: #c0bbb4;
    transition: border-color .2s, color .2s;
  }

  @keyframes nhIdleFloat {
    0%,100% { transform: translate3d(0,-14px,0) rotate(-.35deg) scale(1.01); }
    50%      { transform: translate3d(0, 14px,0) rotate( .35deg) scale(.99); }
  }
  .nh-blob-img {
    display: block;
    width: 100%;
    height: auto;
    pointer-events: none;
    user-select: none;
    animation: nhIdleFloat 6s ease-in-out infinite;
    filter: drop-shadow(0 28px 28px rgba(255,98,0,.13));
  }

  @keyframes nhCaret {
    0%,100% { opacity: 1; }
    50%      { opacity: 0; }
  }
  .nh-caret::after {
    content: '_';
    color: #ff6a00;
    animation: nhCaret .8s step-start infinite;
    margin-left: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    .nh-rise,.nh-rise-2,.nh-rise-3,.nh-glow,.nh-pulse-line,.nh-float,
    .nh-fade-in, .nh-marquee-track, .nh-blob-img {
      animation: none !important;
    }
  }
`

/* ─── tokens ─────────────────────────────────────────────── */
const C = {
  bg:         '#060606',
  bg2:        '#0b0b0b',
  panel:      '#101010',
  panel2:     '#141414',
  line:       'rgba(255,255,255,.08)',
  lineStrong: 'rgba(255,255,255,.16)',
  text:       '#f5f2ea',
  muted:      '#8b867c',
  accent:     '#ff6a00',
  accentSoft: 'rgba(255,106,0,.14)',
  green:      '#84cc16',
}

/* ─── helpers ─────────────────────────────────────────────── */
const mono    = { fontFamily: "'Space Mono', monospace", fontSize: '0.875rem' }
const grotesk = { fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem' }

/* Container igual ao da mentoria.neuralhub.ia.br */
const CONTAINER = {
  maxWidth: '1600px',
  margin: '0 auto',
  padding: '0 clamp(24px, 5vw, 80px)',
}
const SECTION_PAD = 'clamp(64px, 8vw, 100px)'

/* ─── TYPEWRITER HOOK ────────────────────────────────────── */
const TYPEWRITER_PHRASES = [
  'Treinamentos in-company de inteligência artificial',
  'Consultoria e Assessoria em implementação de Infraestrutura Cognitiva',
]

function useTypewriter(phrases, typingSpeed = 48, pauseMs = 2200, deletingSpeed = 22) {
  const [phraseIdx, setPhraseIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setDeleting(true) }, pauseMs)
      return () => clearTimeout(t)
    }
    const current = phrases[phraseIdx]
    if (!deleting) {
      if (charIdx < current.length) {
        const t = setTimeout(() => setCharIdx(c => c + 1), typingSpeed)
        return () => clearTimeout(t)
      } else {
        setPaused(true)
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => setCharIdx(c => c - 1), deletingSpeed)
        return () => clearTimeout(t)
      } else {
        setDeleting(false)
        setPhraseIdx(i => (i + 1) % phrases.length)
      }
    }
  }, [charIdx, deleting, paused, phraseIdx, phrases, typingSpeed, pauseMs, deletingSpeed])

  return phrases[phraseIdx].slice(0, charIdx)
}

/* ─── BLOB INTERATIVO — hook para animação do motion-hero ─── */
function useBlobAnimation() {
  const heroRef = useRef(null)
  const blobRef = useRef(null)
  const turbRef = useRef(null)
  const dispRef = useRef(null)
  const rafRef  = useRef(null)
  const state   = useRef({ tx: 0.5, ty: 0.5, cx: 0.5, cy: 0.5, hover: false })

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const lerp = (a, b, t) => a + (b - a) * t

    const onMove = (e) => {
      const r = hero.getBoundingClientRect()
      state.current.tx = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
      state.current.ty = Math.max(0, Math.min(1, (e.clientY - r.top)  / r.height))
      state.current.hover = true
    }
    const onLeave = () => {
      state.current.tx = 0.5
      state.current.ty = 0.5
      state.current.hover = false
    }

    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)

    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const s = state.current
      s.cx = lerp(s.cx, s.tx, 0.07)
      s.cy = lerp(s.cy, s.ty, 0.07)

      const tiltY = (s.cx - 0.5) * 3.2
      const tiltX = -(s.cy - 0.5) * 3.2
      const dist  = Math.abs(s.cx - 0.5) + Math.abs(s.cy - 0.5)
      const dispScale = s.hover ? (0.8 + dist * 2.2) : 0.35
      const fX = (0.004 + dist * 0.003).toFixed(4)
      const fY = (0.006 + dist * 0.003).toFixed(4)

      if (blobRef.current) {
        blobRef.current.style.transform =
          `rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg) scale(${s.hover ? 1.006 : 1})`
      }
      turbRef.current?.setAttribute('baseFrequency', `${fX} ${fY}`)
      dispRef.current?.setAttribute('scale', dispScale.toFixed(2))

      hero.style.setProperty('--nh-mx', `${(s.cx * 100).toFixed(2)}%`)
      hero.style.setProperty('--nh-my', `${(s.cy * 100).toFixed(2)}%`)
      hero.style.setProperty('--nh-glow', s.hover ? '.38' : '.28')

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { heroRef, blobRef, turbRef, dispRef }
}

/* ─── reusable atoms ──────────────────────────────────────── */
function Eyebrow({ children }) {
  return (
    <span style={{
      ...mono,
      fontSize: '.75rem', letterSpacing: '.18em',
      textTransform: 'uppercase', color: C.accent,
      display: 'block', marginBottom: '16px',
    }}>
      {children}
    </span>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: C.line, width: '100%' }} />
}

/* ─── 1. NAV ──────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(6,6,6,.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.line}`,
    }}>
      {/* full-width inner — sem maxWidth aqui */}
      <div style={{
        width: '100%',
        padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src={nhLogoImg} alt="Neural Hub" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ ...grotesk, fontWeight: 700, fontSize: '1rem', letterSpacing: '-.01em', color: C.text }}>
            NEURAL HUB
          </span>
        </div>

        {/* Links + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {[
            { label: 'Treinamentos', href: '#treinamentos' },
            { label: 'Conceito',     href: '#conceito' },
            { label: 'Founders',     href: '#founders' },
            { label: 'Blog',         href: 'https://mentoria.neuralhub.ia.br/blog', external: true },
          ].map(l => (
            <a key={l.label} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined} style={{
              ...grotesk, fontSize: '.875rem', color: C.muted, textDecoration: 'none',
              transition: 'color .2s',
            }}
              onMouseEnter={e => e.target.style.color = C.text}
              onMouseLeave={e => e.target.style.color = C.muted}
            >{l.label}</a>
          ))}
          <a href="https://mentoria.neuralhub.ia.br/plataforma/login" target="_blank" rel="noopener noreferrer" style={{
            ...grotesk, fontWeight: 600, fontSize: '.875rem',
            background: C.accent, color: '#000',
            padding: '10px 20px', borderRadius: '4px', textDecoration: 'none',
          }}>
            Neural Hub Academy
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ─── NETWORK SVG — grafo limpo, inspirado em abstract.ventures ─ */
/* ─── 2. HERO ─────────────────────────────────────────────── */
function Hero() {
  const { heroRef, blobRef, turbRef, dispRef } = useBlobAnimation()
  const typewriterText = useTypewriter(TYPEWRITER_PHRASES)

  return (
    <section
      ref={heroRef}
      className="nh-hero"
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        borderBottom: `1px solid ${C.line}`,
        display: 'flex', flexDirection: 'column',
        isolation: 'isolate',
      }}
    >
      {/* Glow radial que segue o cursor — controlado por CSS vars --nh-mx / --nh-my / --nh-glow */}
      <div className="nh-hero-glow" aria-hidden="true" />

      {/* SVG filter de distorção líquida — idêntico ao motion-hero/index.html */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="liquid-distortion">
          <feTurbulence
            ref={turbRef}
            id="nh-turbulence"
            type="fractalNoise"
            baseFrequency="0.004 0.006"
            numOctaves="1"
            seed="8"
            result="noise"
          />
          <feDisplacementMap
            ref={dispRef}
            id="nh-displacement"
            in="SourceGraphic"
            in2="noise"
            scale="0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <img
          src={neuralhubBg}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0.08,
            filter: 'grayscale(60%) saturate(0.4)',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(6,6,6,.6) 0%, rgba(6,6,6,.92) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 60% 50% at 72% 50%, rgba(255,106,0,.07), transparent)',
        }} />
      </div>

      {/* Grid overlay sutil */}
      <div className="nh-bg-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      {/* Conteúdo — full-width, grid 2 colunas */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%',
        padding: '0 48px',
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, .95fr) minmax(420px, 1.05fr)',
        gap: '48px',
        alignItems: 'center',
        paddingTop: '64px',
      }}>
        {/* LEFT — texto */}
        <div style={{
          paddingTop: '80px', paddingBottom: '80px',
        }}>
          {/* Eyebrow — typewriter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '36px',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: C.accent, boxShadow: `0 0 8px ${C.accent}`,
              flexShrink: 0,
            }} />
            <span className="nh-caret" style={{
              ...mono, fontSize: '.7rem', letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.accent,
            }}>
              {typewriterText}
            </span>
          </div>

          {/* Headline */}
          <h1 className="nh-rise-2" style={{
            ...grotesk, fontWeight: 700,
            lineHeight: .95, letterSpacing: '-.04em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            <span style={{
              color: C.text, display: 'block',
              fontSize: 'clamp(1.35rem, 2.25vw, 2.7rem)',
              letterSpacing: '-.04em',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
            }}>SUA EMPRESA PRONTA PARA</span>
            <span style={{
              color: C.accent, display: 'block',
              fontSize: 'clamp(3.8rem, 6.4vw, 7.6rem)',
              letterSpacing: '-.04em',
              textShadow: `0 0 40px rgba(255,106,0,.25)`,
            }}>SER AI ONLY</span>
          </h1>

          {/* Sub */}
          <p className="nh-rise-3" style={{
            ...grotesk, fontSize: 'clamp(1rem, 1.4vw, 1.2rem)',
            color: C.muted, lineHeight: 1.7,
            maxWidth: '520px',
          }}>
            Implementação de infraestrutura cognitiva aplicada para{' '}
            <span style={{ color: C.text }}>transformar estratégia em ação contínua.</span>
          </p>
        </div>

        {/* RIGHT — blob interativo */}
        <div style={{
          display: 'grid',
          placeItems: 'center',
          perspective: '1200px',
          position: 'relative',
          minHeight: 'min(68vw, 760px)',
        }}>
          {/* Sombra de glow embaixo do blob */}
          <div style={{
            position: 'absolute',
            width: '56%', height: '28%',
            left: '22%', bottom: '10%',
            background: 'radial-gradient(ellipse, rgba(255,98,0,.14), transparent 68%)',
            filter: 'blur(22px)',
            transform: 'translateY(22px)',
            zIndex: 0,
            opacity: .65,
          }} />
          <div
            ref={blobRef}
            style={{
              width: 'min(55vw, 816px)',
              maxWidth: '100%',
              aspectRatio: '1 / 1',
              display: 'grid',
              placeItems: 'center',
              transition: 'transform .55s cubic-bezier(.16,1,.3,1)',
              willChange: 'transform',
              filter: 'url(#liquid-distortion) drop-shadow(0 0 22px rgba(255,119,0,.18))',
              zIndex: 1,
            }}
          >
            <img
              src={neuralBlob}
              alt=""
              aria-hidden="true"
              className="nh-blob-img"
            />
          </div>
        </div>
      </div>

      {/* Carrossel de clientes — base da hero */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%',
        paddingBottom: '48px',
        overflow: 'hidden',
      }}>
        {/* Separator */}
        <div style={{
          borderTop: `1px solid ${C.line}`,
          marginBottom: '28px',
        }} />
        {/* Label */}
        <p style={{
          ...mono, fontSize: '.62rem', letterSpacing: '.22em',
          textTransform: 'uppercase', color: C.muted,
          textAlign: 'center', marginBottom: '24px',
        }}>
          Empresas que já treinaram com a Neural Hub
        </p>
        {/* Track */}
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '100px', zIndex: 2,
            background: `linear-gradient(to right, ${C.bg}, transparent)`,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '100px', zIndex: 2,
            background: `linear-gradient(to left, ${C.bg}, transparent)`,
            pointerEvents: 'none',
          }} />
          <div className="nh-marquee-track">
            {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((c, i) => (
              <HeroClientCard key={i} client={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '80px',
        background: `linear-gradient(to bottom, transparent, ${C.bg})`,
        zIndex: 3, pointerEvents: 'none',
      }} />
    </section>
  )
}

/* ─── 3. STRIP ────────────────────────────────────────────── */
function Strip() {
  return (
    <section style={{
      background: C.panel,
      borderTop: `1px solid ${C.line}`,
      borderBottom: `1px solid ${C.line}`,
      padding: '28px 0',
      textAlign: 'center',
    }}>
      <p style={{
        ...mono,
        fontSize: 'clamp(.85rem, 1.5vw, 1.05rem)',
        letterSpacing: '.14em',
        textTransform: 'uppercase',
        color: C.text,
      }}>
        TREINAMENTOS IN-COMPANY DE IA PARA C-LEVELS E EXECUTIVOS
      </p>
    </section>
  )
}

/* ─── CLIENTS DATA ────────────────────────────────────────── */
const CLIENT_LOGOS = [
  { name: 'Beiramar Shopping',  initials: 'BMR' },
  { name: 'AEMFLO',             initials: 'AEM' },
  { name: 'BAESA',              initials: 'BAE' },
  { name: 'CDL',                initials: 'CDL' },
  { name: 'Enercan',            initials: 'ENC' },
  { name: 'Ford Dimas',         initials: 'FRD' },
  { name: 'CDL Palhoça',        initials: 'CDP' },
  { name: 'CIDASC',             initials: 'CID' },
  { name: 'CreoCrea',           initials: 'CRC' },
  { name: 'Lumis',              initials: 'LMS' },
  { name: 'SEAGRO-SC',          initials: 'SGR' },
  { name: 'Grupo Sinético',     initials: 'GSI' },
  { name: 'Predcast',           initials: 'PRD' },
  { name: 'SESCOOP/SC',         initials: 'SES' },
]

/* Card compacto usado DENTRO da hero */
function HeroClientCard({ client }) {
  return (
    <div className="nh-client-card" style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '6px 36px 6px 36px',
      flexShrink: 0,
      cursor: 'default',
    }}>
      <div className="nh-client-badge" style={{
        width: '38px', height: '38px',
        border: `1px solid ${C.lineStrong}`,
        borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.panel2,
        flexShrink: 0,
        transition: 'border-color .2s, color .2s',
      }}>
        <span style={{
          ...mono, fontSize: '.66rem', fontWeight: 700,
          letterSpacing: '.03em', color: 'inherit',
        }}>
          {client.initials}
        </span>
      </div>
      <span className="nh-client-name" style={{
        ...grotesk, fontSize: '1.05rem', fontWeight: 500,
        color: C.muted, whiteSpace: 'nowrap',
        letterSpacing: '-.01em',
        transition: 'color .2s',
      }}>
        {client.name}
      </span>
    </div>
  )
}

/* ─── 5. ALIANÇAS ─────────────────────────────────────────── */
function Testimonials() {
  return (
    <section style={{
      background: C.bg2,
      padding: `clamp(48px, 6vw, 72px) 0`,
      borderBottom: `1px solid ${C.line}`,
    }}>
      <div style={{ ...CONTAINER }}>
        <p style={{
          ...grotesk, fontSize: 'clamp(1.3rem, 2vw, 1.6rem)',
          color: C.muted, textAlign: 'center',
          marginBottom: '40px', fontWeight: 400,
        }}>
          Alianças Globais de Tecnologia
        </p>

        <div style={{
          border: `1px solid ${C.line}`,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(255,255,255,.03) 0%, rgba(255,255,255,.01) 100%)',
          padding: 'clamp(32px, 4vw, 52px) clamp(40px, 6vw, 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(48px, 8vw, 120px)',
        }}>
          <img src={logoMicrosoft} alt="Microsoft" style={{ height: '36px', width: 'auto', filter: 'grayscale(1) brightness(0.7)' }} />
          <div style={{ width: '1px', height: '32px', background: C.line }} />
          <img src={logoNvidia} alt="NVIDIA" style={{ height: '36px', width: 'auto', filter: 'grayscale(1) brightness(0.7)' }} />
        </div>
      </div>
    </section>
  )
}

/* ─── 6. PROGRAMAS ───────────────────────────────────────── */
const PROGRAMS = [
  {
    badge: 'IN COMPANY',
    duration: '8H',
    title: 'Letramento em Inteligência Artificial',
    desc: 'Para C-levels, lideranças e gestores que precisam entender IA para planejar a aplicação da tecnologia em suas organizações.',
    items: [
      'Diagnóstico de maturidade em IA',
      'Mapeamento de oportunidades',
      'Capacitação Técnica em Inteligência Artificial',
      'Construção prática de pelo menos um Agente de IA (nível 5)',
    ],
    cta: 'Solicitar Proposta',
    highlight: false,
  },
  {
    badge: 'IN COMPANY',
    duration: '16H',
    title: 'Fluência Corporativa em Inteligência Artificial',
    desc: null,
    items: [
      'Diagnóstico de maturidade em IA',
      'Mapeamento de oportunidades',
      'Capacitação Técnica em Inteligência Artificial',
      'Governança de IA',
      'Capacitação em AI-Only',
      'Construção prática de pelo menos um Agente autônomo',
    ],
    cta: 'Solicitar Proposta',
    highlight: false,
  },
  {
    badge: 'ON LINE',
    duration: '40H',
    title: 'Mentoria Zero-to-Hero IA',
    desc: null,
    items: [
      'Fundamentos, ML e visão estratégica',
      'Introdução a Engenharia de IA',
      'Criação de Agentes, RAG, Skills, API e MCP',
      'Engenharia de Software com IA',
      'Segurança, Risco e Futuro',
      'Projetos reais e aplicação no mercado',
      'Prova de Certificação Neural Hub Academy',
    ],
    cta: 'Início Imediato',
    ctaHref: 'https://mentoria.neuralhub.ia.br',
    highlight: true,
  },
]

function TudoFeito() {
  return (
    <section id="treinamentos" style={{ padding: `${SECTION_PAD} 0`, background: C.bg }}>
      <div style={{ ...CONTAINER }}>
        <div style={{ marginBottom: '56px' }}>
          <Eyebrow>Programas</Eyebrow>
          <h2 style={{
            ...grotesk, fontWeight: 700,
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.1, letterSpacing: '-.02em', color: C.text,
          }}>
            PROGRAMAS DE <span style={{ color: C.accent }}>TREINAMENTO</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' }}>
          {PROGRAMS.map((p, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              padding: '32px',
              border: `1px solid ${p.highlight ? C.accent : C.line}`,
              borderRadius: '8px',
              background: p.highlight ? 'rgba(255,106,0,.04)' : C.panel,
              transition: 'border-color .2s',
              position: 'relative',
            }}
              onMouseEnter={e => { if (!p.highlight) e.currentTarget.style.borderColor = C.lineStrong }}
              onMouseLeave={e => { if (!p.highlight) e.currentTarget.style.borderColor = C.line }}
            >
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '4px 10px',
                border: `1px solid ${p.highlight ? C.accent : C.lineStrong}`,
                borderRadius: '3px',
                marginBottom: '24px',
              }}>
                <span style={{
                  ...mono, fontSize: '.6rem', letterSpacing: '.16em',
                  color: p.highlight ? C.accent : C.muted,
                  textTransform: 'uppercase',
                }}>
                  {p.badge}
                </span>
              </div>

              {/* Duration */}
              <div style={{
                ...grotesk, fontWeight: 700,
                fontSize: 'clamp(2.8rem, 4vw, 4rem)',
                color: p.highlight ? C.accent : C.text,
                lineHeight: 1, letterSpacing: '-.03em',
                marginBottom: '16px',
              }}>
                {p.duration}
              </div>

              {/* Title */}
              <h3 style={{
                ...grotesk, fontWeight: 700,
                fontSize: 'clamp(.88rem, 1.2vw, 1rem)',
                color: C.text, lineHeight: 1.3,
                letterSpacing: '-.01em',
                textTransform: 'uppercase',
                marginBottom: '16px',
              }}>
                {p.title}
              </h3>

              {/* Desc */}
              {p.desc && (
                <p style={{
                  ...grotesk, fontSize: '1rem', color: C.muted,
                  lineHeight: 1.65, marginBottom: '20px',
                }}>
                  {p.desc}
                </p>
              )}

              {/* Bullet list */}
              <ul style={{
                listStyle: 'none', flex: 1,
                display: 'flex', flexDirection: 'column', gap: '12px',
                marginBottom: '32px',
              }}>
                {p.items.map((item, j) => (
                  <li key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      color: C.accent, fontSize: '.8rem', flexShrink: 0,
                      marginTop: '4px', lineHeight: 1,
                    }}>◆</span>
                    <span style={{ ...grotesk, fontSize: '1rem', color: C.muted, lineHeight: 1.55 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a href={p.ctaHref || '#cta'} target={p.ctaHref ? '_blank' : undefined} rel={p.ctaHref ? 'noopener noreferrer' : undefined} style={{
                ...grotesk, fontWeight: 700,
                fontSize: '.875rem', letterSpacing: '.04em',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '14px 20px',
                border: `1px solid ${p.highlight ? C.accent : C.lineStrong}`,
                borderRadius: '4px',
                background: p.highlight ? C.accent : 'transparent',
                color: p.highlight ? '#000' : C.text,
                textDecoration: 'none',
                transition: 'opacity .2s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 7. AI-ONLY ──────────────────────────────────────────── */
const IA_ONLY_ROWS = [
  {
    is:  'Uma infraestrutura cognitiva aplicada.',
    not: 'Um curso de IA ou treinamento genérico.',
  },
  {
    is:  'Um sistema que combina diagnóstico, tutoria humana e execução.',
    not: 'Um software isolado ou "plug-and-play".',
  },
  {
    is:  'Transformação de estratégia e conhecimento em decisões e ações.',
    not: 'Uma consultoria tradicional baseada apenas em slides.',
  },
  {
    is:  'Integração de responsabilidade humana clara na operação.',
    not: 'Automação sem supervisão ou responsabilidade ("black box").',
  },
]

function Problem() {
  return (
    <section id="conceito" style={{
      padding: `${SECTION_PAD} 0`,
      background: C.bg2,
      borderTop: `1px solid ${C.line}`,
      borderBottom: `1px solid ${C.line}`,
    }}>
      <div style={{ ...CONTAINER }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <Eyebrow>Conceito</Eyebrow>
          <h2 style={{
            ...grotesk, fontWeight: 700,
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.05, letterSpacing: '-.025em',
            color: C.text, marginBottom: '20px',
          }}>
            O QUE É <span style={{ color: C.accent }}>AI-ONLY</span><br />
            UMA NOVA CATEGORIA DE INFRAESTRUTURA
          </h2>
          <p style={{
            ...grotesk, fontSize: 'clamp(1.05rem, 1.5vw, 1.2rem)',
            color: C.muted, lineHeight: 1.75, maxWidth: '780px',
          }}>
            O AI-Only não é uma ferramenta que se instala, mas uma infraestrutura cognitiva
            implantada diretamente nas operações. Seu propósito é combinar diagnóstico,
            tutoria e execução assistida.
          </p>
        </div>

        {/* Tabela comparativa */}
        <div style={{
          border: `1px solid ${C.line}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
          }}>
            <div style={{
              padding: '14px 24px',
              borderBottom: `1px solid ${C.line}`,
              borderRight: `1px solid ${C.line}`,
            }}>
              <span style={{
                ...grotesk, fontWeight: 700,
                fontSize: 'clamp(.8rem, 1.1vw, .92rem)',
                color: C.text, letterSpacing: '-.01em',
                textTransform: 'uppercase',
              }}>
                O QUE O AI-ONLY <span style={{ color: C.accent }}>É</span>
              </span>
            </div>
            <div style={{
              padding: '14px 24px',
              borderBottom: `1px solid ${C.line}`,
            }}>
              <span style={{
                ...grotesk, fontWeight: 700,
                fontSize: 'clamp(.8rem, 1.1vw, .92rem)',
                color: C.text, letterSpacing: '-.01em',
                textTransform: 'uppercase',
              }}>
                O QUE O AI-ONLY <span style={{ color: C.accent }}>NÃO É</span>
              </span>
            </div>
          </div>

          {/* Data rows */}
          {IA_ONLY_ROWS.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              borderBottom: i < IA_ONLY_ROWS.length - 1 ? `1px solid ${C.line}` : 'none',
            }}>
              <div style={{
                padding: '20px 28px',
                borderRight: `1px solid ${C.line}`,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
              }}>
                <p style={{ ...grotesk, fontSize: 'clamp(1rem, 1.3vw, 1.1rem)', color: C.text, lineHeight: 1.7 }}>
                  {row.is}
                </p>
              </div>
              <div style={{
                padding: '20px 28px',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.015)',
              }}>
                <p style={{ ...grotesk, fontSize: 'clamp(1rem, 1.3vw, 1.1rem)', color: C.muted, lineHeight: 1.7 }}>
                  {row.not}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

/* ─── SVG: ponte se desintegrando ────────────────────────── */
const BridgeCollapse = () => (
  <svg viewBox="0 0 560 480" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', display: 'block' }}>

    {/* Labels topo */}
    <text x="50" y="32" fontFamily="'Space Grotesk', sans-serif" fontSize="16" fontWeight="700" fill="#f5f2ea" letterSpacing="2">INTENÇÃO</text>
    <text x="340" y="32" fontFamily="'Space Grotesk', sans-serif" fontSize="16" fontWeight="700" fill="#ff6a00" letterSpacing="2">VALOR REAL</text>

    {/* Paredes do canyon */}
    <path d="M0 50 L195 50 L155 400 L0 400 Z" fill="#1a1a1a" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
    <path d="M365 50 L560 50 L560 400 L405 400 Z" fill="#1a1a1a" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>

    {/* Linhas de profundidade */}
    <line x1="110" y1="50" x2="88"  y2="400" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
    <line x1="155" y1="50" x2="128" y2="400" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
    <line x1="415" y1="50" x2="438" y2="400" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
    <line x1="458" y1="50" x2="485" y2="400" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>

    {/* Glow laranja no abismo */}
    <ellipse cx="280" cy="330" rx="90" ry="44" fill="rgba(255,106,0,.07)"/>

    {/* Fragmento central grande */}
    <g opacity="0.9">
      <line x1="210" y1="95" x2="350" y2="215" stroke="#ff6a00" strokeWidth="3"/>
      <line x1="226" y1="95" x2="366" y2="215" stroke="#ff6a00" strokeWidth="3"/>
      <line x1="210" y1="95"  x2="226" y2="95"  stroke="#ff6a00" strokeWidth="3"/>
      <line x1="350" y1="215" x2="366" y2="215" stroke="#ff6a00" strokeWidth="3"/>
      <line x1="236" y1="118" x2="246" y2="118" stroke="#ff6a00" strokeWidth="2.5"/>
      <line x1="266" y1="147" x2="278" y2="147" stroke="#ff6a00" strokeWidth="2.5"/>
      <line x1="298" y1="178" x2="312" y2="178" stroke="#ff6a00" strokeWidth="2.5"/>
      <line x1="236" y1="118" x2="266" y2="147" stroke="#ff6a00" strokeWidth="2" strokeDasharray="5 3"/>
      <line x1="246" y1="118" x2="278" y2="147" stroke="#ff6a00" strokeWidth="2" strokeDasharray="5 3"/>
      <line x1="266" y1="147" x2="298" y2="178" stroke="#ff6a00" strokeWidth="2" strokeDasharray="5 3"/>
    </g>

    {/* Fragmento esquerda */}
    <g opacity="0.7" transform="rotate(-18, 200, 162)">
      <line x1="168" y1="138" x2="244" y2="138" stroke="#c45000" strokeWidth="2.5"/>
      <line x1="168" y1="158" x2="244" y2="158" stroke="#c45000" strokeWidth="2.5"/>
      <line x1="180" y1="138" x2="180" y2="158" stroke="#c45000" strokeWidth="2"/>
      <line x1="202" y1="138" x2="202" y2="158" stroke="#c45000" strokeWidth="2"/>
      <line x1="224" y1="138" x2="224" y2="158" stroke="#c45000" strokeWidth="2"/>
      <line x1="180" y1="138" x2="202" y2="158" stroke="#c45000" strokeWidth="1.5" strokeDasharray="3 3"/>
      <line x1="202" y1="138" x2="224" y2="158" stroke="#c45000" strokeWidth="1.5" strokeDasharray="3 3"/>
    </g>

    {/* Fragmento direita */}
    <g opacity="0.7" transform="rotate(22, 352, 182)">
      <line x1="316" y1="165" x2="398" y2="165" stroke="#c45000" strokeWidth="2.5"/>
      <line x1="316" y1="185" x2="398" y2="185" stroke="#c45000" strokeWidth="2.5"/>
      <line x1="330" y1="165" x2="330" y2="185" stroke="#c45000" strokeWidth="2"/>
      <line x1="355" y1="165" x2="355" y2="185" stroke="#c45000" strokeWidth="2"/>
      <line x1="380" y1="165" x2="380" y2="185" stroke="#c45000" strokeWidth="2"/>
      <line x1="330" y1="165" x2="355" y2="185" stroke="#c45000" strokeWidth="1.5" strokeDasharray="3 3"/>
      <line x1="355" y1="165" x2="380" y2="185" stroke="#c45000" strokeWidth="1.5" strokeDasharray="3 3"/>
    </g>

    {/* Fragmentos soltos */}
    <g opacity="0.5">
      <line x1="248" y1="224" x2="275" y2="252" stroke="#ff6a00" strokeWidth="2" transform="rotate(-30,261,238)"/>
      <line x1="261" y1="224" x2="288" y2="252" stroke="#ff6a00" strokeWidth="2" transform="rotate(-30,274,238)"/>
      <line x1="248" y1="224" x2="261" y2="224" stroke="#ff6a00" strokeWidth="2"/>
    </g>
    <g opacity="0.4">
      <line x1="292" y1="258" x2="312" y2="278" stroke="#c45000" strokeWidth="2" transform="rotate(15,302,268)"/>
      <line x1="302" y1="258" x2="322" y2="278" stroke="#c45000" strokeWidth="2" transform="rotate(15,312,268)"/>
      <line x1="292" y1="258" x2="302" y2="258" stroke="#c45000" strokeWidth="2"/>
    </g>

    {/* Partículas */}
    <circle cx="262" cy="295" r="3.5" fill="#ff6a00" opacity=".6"/>
    <circle cx="284" cy="322" r="2.5" fill="#ff6a00" opacity=".4"/>
    <circle cx="306" cy="278" r="2"   fill="#c45000" opacity=".5"/>
    <circle cx="240" cy="268" r="2.5" fill="#c45000" opacity=".4"/>
    <circle cx="320" cy="305" r="3"   fill="#ff6a00" opacity=".35"/>

    {/* Key insight box */}
    <rect x="0" y="418" width="4" height="58" fill="#ff6a00" rx="2"/>
    <text x="18" y="436"
      fontFamily="'Space Mono', monospace" fontSize="12" fontWeight="700"
      fill="rgba(255,255,255,.5)" letterSpacing="1.5">KEY INSIGHT</text>
    <text x="18" y="456"
      fontFamily="'Space Grotesk', sans-serif" fontSize="14"
      fill="rgba(245,242,234,.8)">O problema não é a tecnologia. É a falta de</text>
    <text x="18" y="474"
      fontFamily="'Space Grotesk', sans-serif" fontSize="14"
      fill="rgba(245,242,234,.8)">infraestrutura que converta intenção em ação real.</text>
  </svg>
)

/* ─── SVG icons corporativos — stroke outline, brand #ff6a00 ── */
const IconExperts = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    <path d="M16 3.5c1.5.8 2.5 2.3 2.5 4s-1 3.2-2.5 4"/>
  </svg>
)
const IconContext = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M17.5 14v2.5H14m3.5 0v2.5H21"/>
  </svg>
)
const IconResult = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="4.5"/>
    <circle cx="12" cy="12" r="1.5" fill="#ff6a00" stroke="none"/>
  </svg>
)
const IconMethod = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="5" rx="1"/>
    <rect x="16" y="3" width="5" height="5" rx="1"/>
    <rect x="9.5" y="16" width="5" height="5" rx="1"/>
    <path d="M5.5 8v4h13V8"/>
    <path d="M12 12v4"/>
  </svg>
)
const IconScale = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18h18"/>
    <path d="M7 18V9"/>
    <path d="M12 18V5"/>
    <path d="M17 18v-6"/>
  </svg>
)
const IconPartner = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l-3 3 3 3"/>
    <path d="M18 9l3 3-3 3"/>
    <path d="M3 12h18"/>
    <circle cx="12" cy="5" r="2"/>
    <circle cx="12" cy="19" r="2"/>
    <path d="M12 7v10"/>
  </svg>
)

/* ─── 8. O PROBLEMA ───────────────────────────────────────── */
const PROBLEM_ITEMS = [
  'As empresas modernas enfrentam um paradoxo comum:',
  'Sabem que precisam utilizar IA para sobreviver.',
  'Já realizaram testes com ferramentas, pilotos e MVPs.',
  'Não conseguiram escalar os resultados.',
  'Continuam dependentes de "pessoas-chave" e processos frágeis.',
]

function Differentials() {
  return (
    <section style={{ padding: `${SECTION_PAD} 0`, background: C.bg }}>
      <div style={{ ...CONTAINER }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(48px, 6vw, 96px)', alignItems: 'center' }}>

          {/* LEFT — texto */}
          <div>
            <span style={{ ...mono, fontSize: '.68rem', letterSpacing: '.18em', color: C.muted, textTransform: 'uppercase', display: 'block', marginBottom: '20px' }}>
              O Problema
            </span>
            <h2 style={{
              ...grotesk, fontWeight: 700,
              fontSize: 'clamp(1.8rem, 3vw, 2.8rem)',
              lineHeight: 1.1, letterSpacing: '-.02em', color: C.text,
              textTransform: 'uppercase',
              marginBottom: '36px',
            }}>
              O ABISMO ENTRE<br />INTENÇÃO E{' '}
              <span style={{ color: C.accent }}>EXECUÇÃO</span>
            </h2>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {PROBLEM_ITEMS.map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '1px',
                    background: C.text, flexShrink: 0, marginTop: '8px',
                  }} />
                  <span style={{ ...grotesk, fontSize: 'clamp(1rem, 1.3vw, 1.1rem)', color: C.muted, lineHeight: 1.7 }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — ilustração ponte */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <span style={{ ...mono, fontSize: '.68rem', letterSpacing: '.18em', color: C.muted, textTransform: 'uppercase' }}>
              Metáfora Visual
            </span>
            <BridgeCollapse />
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─── 9. METODOLOGIA ──────────────────────────────────────── */
function Methodology() {
  const steps = [
    { num: '00', title: 'Assessment — O Mapa da Realidade', desc: 'Mapear a realidade operacional ("como as coisas realmente funcionam"), ignorando o idealismo dos organogramas.' },
    { num: '01', title: 'Contexto e Governança', desc: 'Estabelecer a racionalidade do sistema através do "Tutor de Contexto" humano.' },
    { num: '02', title: 'Construção de Agentes Especializados', desc: 'Criar "executores" especializados, não uma IA genérica.' },
    { num: '03', title: 'Operação Contínua e Aprendizado', desc: 'Criar um ciclo virtuoso onde a execução gera dados para melhoria constante.' },
  ]

  const [active, setActive] = useState(0)

  return (
    <section id="metodologia" style={{
      padding: `${SECTION_PAD} 0`,
      background: C.bg2,
      borderTop: `1px solid ${C.line}`,
    }}>
      <div style={{ ...CONTAINER }}>
        <div style={{ marginBottom: '64px' }}>
          <Eyebrow>Como funciona</Eyebrow>
          <h2 style={{
            ...grotesk, fontWeight: 700,
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            lineHeight: 1.1, letterSpacing: '-.02em', color: C.text,
          }}>
            COMO A METODOLOGIA<br />
            <span style={{ color: C.accent }}>FUNCIONA</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {steps.map((step, i) => (
            <div key={i}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={active === i}
                onClick={() => setActive(active === i ? -1 : i)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setActive(active === i ? -1 : i)}
                style={{
                  display: 'flex', gap: '40px', alignItems: 'flex-start',
                  padding: '32px 0', cursor: 'pointer',
                  transition: 'opacity .2s',
                  outline: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                onFocus={e => e.currentTarget.style.opacity = '.8'}
                onBlur={e => e.currentTarget.style.opacity = '1'}
              >
                <span style={{
                  ...mono, fontSize: '.8rem', fontWeight: 700,
                  color: active === i ? C.accent : C.muted,
                  minWidth: '36px', paddingTop: '2px',
                  transition: 'color .2s',
                }}>
                  {step.num}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    ...grotesk, fontWeight: 700,
                    fontSize: 'clamp(0.96rem, 1.6vw, 1.28rem)',
                    color: active === i ? C.text : C.muted,
                    letterSpacing: '-.01em',
                    transition: 'color .2s',
                  }}>
                    {step.title}
                  </h3>
                  {active === i && (
                    <p style={{
                      ...grotesk, fontSize: '.84rem', color: C.muted,
                      lineHeight: 1.75, marginTop: '14px', maxWidth: '600px',
                    }}>
                      {step.desc}
                    </p>
                  )}
                </div>
                <span style={{ color: C.muted, fontSize: '1.2rem', paddingTop: '4px' }}>
                  {active === i ? '−' : '+'}
                </span>
              </div>
              {i < steps.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── 10. STATS ───────────────────────────────────────────── */
const STATS_DATA = [
  { target: 1000, prefix: '+', suffix: '',  formatted: (n) => `+${n >= 1000 ? n.toLocaleString('pt-BR') : n}`, label: 'Executivos Treinados' },
  { target: 100,  prefix: '+', suffix: '',  formatted: (n) => `+${n}`,                                          label: 'Projetos' },
  { target: 90,   prefix: '+', suffix: '%', formatted: (n) => `+${n}%`,                                         label: 'Satisfação' },
  { target: 1600, prefix: '',  suffix: '',  formatted: (n) => n.toLocaleString('pt-BR'), label: 'Horas de Voo em Treinamentos de IA' },
]

function useCountUp(target, duration = 1800, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = null
    const step = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [active, target, duration])
  return count
}

function StatItem({ stat, delay, visible }) {
  const count = useCountUp(stat.target, 1800, visible)
  return (
    <div style={{
      textAlign: 'center', padding: '0 32px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity .6s ${delay}ms ease, transform .6s ${delay}ms ease`,
    }}>
      <div style={{
        ...grotesk, fontWeight: 700,
        fontSize: 'clamp(2.4rem, 4vw, 3.8rem)',
        color: C.accent, lineHeight: 1, marginBottom: '10px',
        letterSpacing: '-.03em',
      }}>
        {stat.formatted(count)}
      </div>
      <div style={{ ...grotesk, fontSize: '.875rem', color: C.muted, lineHeight: 1.4 }}>
        {stat.label}
      </div>
    </div>
  )
}

function Stats() {
  const [visible, setVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} style={{
      background: C.panel,
      borderTop: `1px solid ${C.line}`,
      borderBottom: `1px solid ${C.line}`,
      padding: `clamp(48px, 6vw, 72px) 0`,
    }}>
      <div style={{
        ...CONTAINER,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        position: 'relative',
      }}>
        {STATS_DATA.map((stat, i) => (
          <div key={i} style={{
            borderRight: i < STATS_DATA.length - 1 ? `1px solid ${C.line}` : 'none',
          }}>
            <StatItem stat={stat} delay={i * 120} visible={visible} />
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── 11. FOUNDERS ────────────────────────────────────────── */
const FOUNDERS_DATA = [
  {
    num: 'CEO',
    photo: instructorAndre,
    name: 'André Cardia',
    subtitle: 'Especialista em Inteligência Artificial',
    bio: (
      <>
        Pós-graduado em Ciência de Dados e Inteligência Artificial. Certificado pela{' '}
        NVIDIA em Redes Neurais Profundas, e pela CISCO como CCNA — Cisco Certified Network Associate —
        combinando expertise em IA de ponta com sólida base em infraestrutura tecnológica.
        É CEO da Neural Hub e founder da Pulsemind.
      </>
    ),
    cards: [
      { label: 'Letramento em IA',  desc: 'Abstrato Ventures, FreedomAI e Inovation Center' },
      { label: 'Instrutor de IA',   desc: 'CDL Florianópolis, AEMFLO São José e ACIC Criciúma' },
      { label: 'Docência',          desc: 'Professor de pós-graduação em Informática para Gestão Pública' },
      { label: '12+ Anos',          desc: 'Professor de Informática para Concursos Públicos' },
    ],
  },
  {
    num: 'CTO',
    photo: instructorCelso,
    name: 'Celso Ferreira',
    subtitle: 'Especialista em Engenharia de Software com IA',
    bio: (
      <>
        Founder e desenvolvedor da Pulsemind, plataforma de IA generativa que integra texto,
        imagem e vídeo em fluxos inteligentes e agentes autônomos para empresas. Como
        Founder e CTO da Neural Hub, lidera iniciativas de inovação tecnológica, arquitetura
        de sistemas e implementação de soluções avançadas com LLMs e agentes autônomos.
      </>
    ),
    cards: [
      { label: 'CTO',               desc: 'C4 Marketing — arquitetura, automações corporativas e LLMs' },
      { label: 'Pulsemind',         desc: 'Plataforma de IA generativa: texto, imagem, áudio e vídeo' },
      { label: '15+ Anos',          desc: 'Desenvolvimento de produtos digitais e soluções SaaS em nuvem' },
      { label: 'Consultor & Instrutor', desc: 'IA aplicada a negócios, APIs, UX e agentes autônomos' },
    ],
  },
]

function FounderCard({ founder }) {
  return (
    <div style={{
      border: `1px solid ${C.line}`,
      borderRadius: '8px',
      background: C.panel,
      overflow: 'hidden',
      padding: '36px',
    }}>
      {/* Header: foto + identidade */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div style={{
          width: '100px', height: '120px',
          flexShrink: 0,
          borderRadius: '4px',
          overflow: 'hidden',
          border: `2px solid ${C.line}`,
          position: 'relative',
        }}>
          <img
            src={founder.photo}
            alt={founder.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', filter: 'grayscale(20%)' }}
          />
          {/* Acento laranja no canto inferior */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            width: '18px', height: '4px',
            background: C.accent,
          }} />
        </div>
        <div style={{ paddingTop: '4px' }}>
          <span style={{ ...mono, fontSize: '.65rem', letterSpacing: '.18em', color: C.accent, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            {founder.num}
          </span>
          <h3 style={{
            ...grotesk, fontWeight: 700,
            fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)',
            letterSpacing: '-.02em', color: C.text,
            lineHeight: 1, textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            {founder.name}
          </h3>
          <p style={{ ...mono, fontSize: '.72rem', letterSpacing: '.12em', color: C.muted, textTransform: 'uppercase', lineHeight: 1.5 }}>
            {founder.subtitle}
          </p>
        </div>
      </div>

      <Divider />

      {/* Bio */}
      <p style={{
        ...grotesk, fontSize: '1rem', color: C.muted,
        lineHeight: 1.8, margin: '24px 0',
      }}>
        {founder.bio}
      </p>

      {/* Grid 2×2 de cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {founder.cards.map((card, i) => (
          <div key={i} style={{
            padding: '18px 20px',
            border: `1px solid ${C.line}`,
            borderRadius: '4px',
            background: C.bg,
          }}>
            <p style={{ ...mono, fontSize: '.72rem', letterSpacing: '.16em', color: C.accent, textTransform: 'uppercase', marginBottom: '8px' }}>
              {card.label}
            </p>
            <p style={{ ...grotesk, fontSize: '.9rem', color: C.muted, lineHeight: 1.55 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Founders() {
  return (
    <section id="founders" style={{ padding: `${SECTION_PAD} 0`, background: C.bg }}>
      <div style={{ ...CONTAINER }}>
        <div style={{ marginBottom: '64px' }}>
          <Eyebrow>Quem está por trás</Eyebrow>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.1, letterSpacing: '-.02em', color: C.text }}>
            OS FOUNDERS
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
          {FOUNDERS_DATA.map((f, i) => <FounderCard key={i} founder={f} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── 12. PARCEIROS ESTRATÉGICOS ──────────────────────────── */
function Honesty() {
  const textStyle = {
    ...grotesk, fontWeight: 700,
    fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
    letterSpacing: '-.01em',
    color: 'rgba(255,255,255,.72)',
    transition: 'color .2s',
    whiteSpace: 'nowrap',
  }

  return (
    <section style={{
      padding: `clamp(80px, 10vw, 120px) 0`,
      background: C.bg2,
      borderTop: `1px solid ${C.line}`,
      borderBottom: `1px solid ${C.line}`,
    }}>
      <div style={{ ...CONTAINER }}>
        <p style={{
          ...mono, fontSize: '2.25rem', letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.muted,
          textAlign: 'center', marginBottom: '64px',
        }}>
          Parceiros Estratégicos
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(48px, 8vw, 120px)',
          flexWrap: 'wrap',
        }}>
          {/* Abstrato — texto */}
          <span
            style={textStyle}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.72)'}
          >
            ABSTRATO
          </span>

          <div style={{ width: '1px', height: '40px', background: C.line, flexShrink: 0 }} />

          {/* Innovation Center — texto */}
          <span
            style={textStyle}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.72)'}
          >
            INNOVATION CENTER
          </span>

          <div style={{ width: '1px', height: '40px', background: C.line, flexShrink: 0 }} />

          {/* Freedom AI — logo */}
          <img
            src={logoFreedom}
            alt="Freedom AI"
            style={{
              height: 'clamp(32px, 4vw, 48px)',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.72,
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.72'}
          />
        </div>
      </div>
    </section>
  )
}

/* ─── 13. CTA FINAL ───────────────────────────────────────── */
function FinalCTA() {
  return (
    <section id="cta" style={{
      position: 'relative',
      minHeight: '560px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      borderTop: `1px solid ${C.line}`,
    }}>
      {/* Background image */}
      <img
        src={neuralhubBg}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: 0.14,
          filter: 'grayscale(40%)',
        }}
      />
      {/* Overlay escuro */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(6,6,6,.55) 0%, rgba(6,6,6,.88) 100%)',
      }} />
      {/* Grid overlay */}
      <div className="nh-bg-grid" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .06 }} />
      {/* Glow accent */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '300px',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(ellipse, rgba(255,106,0,.12), transparent 70%)`,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Conteúdo */}
      <div style={{
        position: 'relative', zIndex: 2,
        textAlign: 'center',
        padding: '0 clamp(24px, 6vw, 80px)',
        maxWidth: '860px',
      }}>
        <span style={{
          ...mono, fontSize: '.72rem', letterSpacing: '.22em',
          textTransform: 'uppercase', color: C.accent,
          display: 'block', marginBottom: '28px',
        }}>
          Neural Hub
        </span>

        <h2 style={{
          ...grotesk, fontWeight: 700,
          fontSize: 'clamp(1.8rem, 4vw, 3.6rem)',
          lineHeight: 1, letterSpacing: '-.04em',
          textTransform: 'uppercase',
          marginBottom: '40px',
          display: 'flex', alignItems: 'baseline', gap: '.4em',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <span style={{ color: C.text }}>Looking</span>
          <span style={{ color: C.accent }}>Ahead</span>
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <a
          href="https://wa.me/5548988549556"
          target="_blank"
          rel="noopener noreferrer"
          className="nh-glow"
          style={{
            ...grotesk, fontWeight: 700,
            fontSize: '.875rem', letterSpacing: '.06em',
            textTransform: 'uppercase',
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: C.accent, color: '#000',
            padding: '14px 28px', borderRadius: '4px',
            textDecoration: 'none',
            transition: 'opacity .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {/* WhatsApp icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.534 5.853L.057 23.57a.75.75 0 0 0 .92.923l5.806-1.522A11.956 11.956 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.737 9.737 0 0 1-4.976-1.364l-.357-.213-3.695.968.985-3.594-.234-.371A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          Entre em Contato
        </a>
        </div>
      </div>
    </section>
  )
}

/* ─── FOOTER ──────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: C.bg2, borderTop: `1px solid ${C.line}`, padding: '48px 0' }}>
      <div style={{
        ...CONTAINER,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        {/* Logo + copyright + endereço */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={nhLogoImg} alt="Neural Hub" style={{ height: '26px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ ...grotesk, fontWeight: 700, fontSize: '.875rem', color: C.text }}>NEURAL HUB</span>
          </div>
          <p style={{ ...mono, fontSize: '.68rem', color: C.muted, letterSpacing: '.04em', lineHeight: 1.6 }}>
            © 2025 Neural Hub. Todos os direitos reservados.<br />
            Neural Hub — Rua Itabira, 326, Florianópolis, SC
          </p>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
          {[
            { label: 'Privacidade', href: '/privacidade' },
            { label: 'Termos',      href: '/termos' },
            { label: 'Mentoria',    href: 'https://mentoria.neuralhub.ia.br', external: true },
          ].map(l => (
            <a key={l.label} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined}
              style={{ ...grotesk, fontSize: '.8rem', color: C.muted, textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </div>

        <img
          src={logoMsStartups}
          alt="Microsoft for Startups"
          style={{ height: '32px', width: 'auto', opacity: .7 }}
        />
      </div>
    </footer>
  )
}

/* ─── ROOT ────────────────────────────────────────────────── */
export default function NeuralHubHome() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>
      <style>{GLOBAL_STYLES}</style>
      <Nav />
      <main>
        <Hero />
        <Strip />

        <Testimonials />
        <TudoFeito />
        <Problem />
        <Differentials />
        <Methodology />
        <Stats />
        <Founders />
        <Honesty />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
