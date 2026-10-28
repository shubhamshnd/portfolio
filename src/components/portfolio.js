'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Globe from '@/components/globe'
import Beam from '@/components/beam'
import Backdrop from '@/components/backdrop'
import { track } from '@vercel/analytics'
import { profile, journey, network, projects, method, leadership, capabilities, tech, cases, testimonials } from '@/data/site'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Journey' },
  { id: 'cases', label: 'Cases' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

const isVideo = (src) => /\.(mp4|webm)$/i.test(src)
const AREAS = ['All', 'AI', 'Data', 'IoT/OT', 'ERP', 'Apps']

// External links; the résumé one is counted in Vercel Analytics.
function Links({ className = '' }) {
  return profile.links.map((l) => (
    <li key={l.label} className={className}>
      <a
        href={l.href}
        target="_blank"
        rel="noreferrer"
        className="hover:text-accent"
        onClick={() => l.label === 'Résumé' && track('Résumé opened')}
      >
        {l.label} ↗
      </a>
    </li>
  ))
}

// Runs a DOM update inside a View Transition when the browser has it.
function transition(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  document.startViewTransition(() => flushSync(update))
}

function useDesktop() {
  const [desktop, setDesktop] = useState(null)
  useEffect(() => {
    const mq = matchMedia('(min-width: 1024px)')
    const on = () => setDesktop(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

function caption(stop) {
  const p = journey.find((j) => j.id === stop)
  if (p) return [p.port, p.place]
  if (stop === 'network') return ['JSW Infrastructure', 'Ports and terminals in India and the UAE']
  return ['Scroll down ↓']
}

// On Work the sphere gallery takes over, so the globe slides off to the left.
function GlobePanel({ stop, size = 'min(560px, calc(100vh - 400px), 100%)' }) {
  const work = stop === 'work'
  const [title, sub] = caption(stop)
  return (
    <figure className={`mx-auto w-full transition duration-700 ${work ? 'pointer-events-none -translate-x-1/2 opacity-0' : ''}`} style={{ maxWidth: size }}>
      <Globe stop={work ? 'network' : stop} />
      <figcaption className="mt-2 text-center font-mono text-xs" aria-live="polite">
        <span className="text-accent">{title}</span>
        {sub && <span className="text-ink/70"> · {sub}</span>}
      </figcaption>
    </figure>
  )
}

const youtubeId = (src) => src.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)?.[1]

function Media({ src, alt, controls, fit = 'object-cover object-top' }) {
  const cls = `h-full w-full ${fit}`
  const yt = youtubeId(src)
  // YouTube: the player in the viewer, its thumbnail with a play badge everywhere else.
  if (yt && controls)
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${yt}?rel=0`}
        title={alt}
        className="h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    )
  if (yt)
    return (
      <span className="relative block h-full w-full">
        <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt={alt} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid aspect-square h-1/3 max-h-12 place-items-center rounded-full bg-black/70 text-head">▶</span>
        </span>
      </span>
    )
  if (isVideo(src)) return <video src={src} className={cls} muted loop playsInline autoPlay={controls} controls={controls} preload="metadata" />
  return <img src={src} alt={alt} className={cls} loading="lazy" />
}

function Thumb({ project, controls, ...rest }) {
  const src = project.media[0]
  return (
    <div className="dots relative aspect-video overflow-hidden rounded-md border border-line bg-panel" {...rest}>
      {src ? (
        <Media src={src} alt={project.name} controls={controls} />
      ) : (
        <span className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-widest text-ink/50">
          screens coming
        </span>
      )}
    </div>
  )
}

// Every project screen on a barrel of stacked rings, in CSS 3D. Built from the data: the number of rows
// and the card size follow the number of screens. A filter stops the spin, lights up its screens and
// moves them to the spots facing you. Drag to spin; click a screen to open it.
const R = 34 // barrel radius, in % of the container width (cqw)

function Barrel({ area, onOpen }) {
  const tiles = useMemo(() => projects.flatMap((p) => p.media.map((src, k) => ({ p, src, k }))), [])
  const n = tiles.length
  const rows = Math.max(1, Math.round(n / 14))
  const per = Math.ceil(n / rows)
  const w = 2 * R * Math.tan(Math.PI / per) - 0.8 // cards just touch round the ring, with a small gap
  const h = (w * 9) / 16
  // Spots: per cards a row, alternate rows offset by half a card like brickwork.
  const slots = useMemo(
    () => tiles.map((_, j) => ({ ang: ((j % per) + (Math.floor(j / per) % 2) / 2) * (360 / per), y: (Math.floor(j / per) - (rows - 1) / 2) * (h + 1) })),
    [tiles, per, rows, h],
  )
  const [assign, setAssign] = useState(() => tiles.map((_, i) => i))
  const pos = assign.map((j) => slots[j])
  const hit = (t) => area === 'All' || t.p.areas?.includes(area)
  const ring = useRef(null)
  const els = useRef([])
  const s = useRef({ yaw: 0, vy: 0, drag: null, moved: 0, aim: null }).current
  const latest = useRef({})
  latest.current = { hit, pos }
  const [front, setFront] = useState(0)
  const facing = (slot) => Math.cos(((slot.ang + s.yaw) * Math.PI) / 180)

  // A filter holds the barrel still and gives its screens the spots nearest the viewer, middle row first.
  useEffect(() => {
    s.vy = 0
    if (area === 'All') {
      s.aim = null
      return setAssign(tiles.map((_, i) => i))
    }
    s.aim = s.yaw
    const score = (j) => facing(slots[j]) - 0.01 * Math.abs(slots[j].y)
    const order = slots.map((_, j) => j).sort((a, b) => score(b) - score(a))
    const ids = tiles.map((_, i) => i)
    const next = []
    ;[...ids.filter((i) => hit(tiles[i])), ...ids.filter((i) => !hit(tiles[i]))].forEach((i, k) => (next[i] = order[k]))
    setAssign(next)
  }, [area]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let last = performance.now()
    let best = -1
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!s.drag) {
        if (s.aim != null) s.yaw += (s.aim - s.yaw) * (still ? 1 : 1 - Math.exp(-4 * dt))
        else s.yaw += (s.vy - (still ? 0 : 6)) * dt
        s.vy *= Math.exp(-3 * dt)
      }
      ring.current.style.transform = `rotateX(-6deg) rotateY(${s.yaw}deg)`
      let top = -2
      let ti = 0
      tiles.forEach((t, i) => {
        const el = els.current[i]
        if (!el) return
        const p = latest.current.pos[i]
        const z = facing(p)
        const on = latest.current.hit(t)
        el.style.opacity = on ? 0.35 + 0.65 * Math.max(z, 0) : 0.06 + 0.1 * Math.max(z, 0)
        el.style.filter = `brightness(${on ? 0.35 + 0.65 * Math.max(z, 0) : 0.4})`
        el.style.pointerEvents = on && z > 0.6 ? 'auto' : 'none'
        const score = z - 0.01 * Math.abs(p.y)
        if (on && score > top) [top, ti] = [score, i]
      })
      if (ti !== best) setFront((best = ti))
    }
    const move = (e) => {
      if (!s.drag) return
      const now = performance.now()
      const dx = e.clientX - s.drag.x
      s.moved += Math.abs(dx) + Math.abs(e.clientY - s.drag.y)
      s.yaw += dx * 0.2
      s.vy = (dx * 0.2) / Math.max((now - s.drag.t) / 1000, 0.008)
      s.drag = { x: e.clientX, y: e.clientY, t: now }
    }
    const up = () => (s.drag = null)
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
    }
  }, [tiles, s]) // eslint-disable-line react-hooks/exhaustive-deps

  const f = tiles[front]
  return (
    <div>
      <div
        className="relative w-full cursor-grab select-none active:cursor-grabbing [container-type:inline-size] [&_img]:pointer-events-none"
        style={{ height: `calc(${rows} * ${h * 1.25}cqw + 4cqw)`, perspective: '1400px', touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          s.drag = { x: e.clientX, y: e.clientY, t: performance.now() }
          s.moved = 0
          s.aim = null
        }}
      >
        <div ref={ring} className="absolute left-1/2 top-1/2" style={{ transformStyle: 'preserve-3d' }}>
          {tiles.map((t, i) => (
            <button
              key={`${t.p.id}-${t.k}`}
              ref={(el) => (els.current[i] = el)}
              onClick={() => s.moved < 6 && onOpen(t.p, t.k)}
              aria-label={`Open ${t.p.name}`}
              className={`absolute block aspect-video overflow-hidden rounded-sm border bg-panel ${area !== 'All' && hit(t) ? 'border-accent' : 'border-line'}`}
              style={{
                width: `${w}cqw`,
                left: `${-w / 2}cqw`,
                top: `${-h / 2}cqw`,
                transform: `translateY(${pos[i].y}cqw) rotateY(${pos[i].ang}deg) translateZ(${R}cqw)`,
                transition: 'transform 1s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <Media src={t.src} alt={t.p.name} />
            </button>
          ))}
        </div>
      </div>
      {f && (
        <div className="mx-auto mt-4 max-w-2xl border-t border-line pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-medium text-head">{f.p.name}</h3>
            <span className="font-mono text-xs text-ink/60">
              {String(front + 1).padStart(2, '0')} / {n}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{f.p.summary}</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{f.p.areas?.join(' · ')}</p>
            <button onClick={() => onOpen(f.p, f.k)} className="font-mono text-xs uppercase tracking-widest text-accent hover:underline">
              Open screens →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Viewer({ project, onClose }) {
  const ref = useRef(null)
  const [i, setI] = useState(project.start ?? 0)
  useLayoutEffect(() => ref.current.showModal(), [])
  const n = project.media.length
  const src = project.media[i]
  const go = (d) => setI((x) => (x + d + n) % n)
  const touch = useRef(0)

  return (
    <dialog
      ref={ref}
      className="viewer m-auto w-[min(1000px,calc(100vw-1rem))] rounded-lg border border-line bg-bg p-0 text-ink"
      onCancel={(e) => (e.preventDefault(), onClose())}
      onClick={(e) => e.target === ref.current && onClose()}
      onKeyDown={(e) => n > 1 && (e.key === 'ArrowRight' ? go(1) : e.key === 'ArrowLeft' && go(-1))}
    >
      <div style={{ viewTransitionName: `p-${project.id}` }}>
        {src ? (
          <div
            className="relative aspect-[4/3] bg-black sm:aspect-[16/7]"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touch.current
              if (n > 1 && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
            }}
          >
            <div className="fade h-full" key={src}>
              <Media src={src} alt={`${project.name} screen ${i + 1}`} controls fit="object-contain" />
            </div>
            {n > 1 && (
              <>
                <button onClick={() => go(-1)} className="carousel-btn left-3" aria-label="Previous screen">←</button>
                <button onClick={() => go(1)} className="carousel-btn right-3" aria-label="Next screen">→</button>
                <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-1 font-mono text-xs text-head">
                  {i + 1} / {n}
                </span>
              </>
            )}
          </div>
        ) : (
          <Thumb project={project} />
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-xl font-semibold text-head">{project.name}</h3>
          <button onClick={onClose} className="font-mono text-sm text-ink hover:text-accent" autoFocus>
            Close ✕
          </button>
        </div>
        <p className="mt-2 max-w-prose">{project.summary}</p>
        <Stats items={project.stats} />
        <Sites items={project.sites} />
        <Stack items={project.stack} />
        {project.media.length > 1 && (
          <div className="mt-6 flex gap-3 overflow-x-auto">
            {project.media.map((m, n) => (
              <button
                key={m}
                onClick={() => setI(n)}
                className={`h-16 w-28 shrink-0 overflow-hidden rounded border ${n === i ? 'border-accent' : 'border-line opacity-60 hover:opacity-100'}`}
                aria-label={`Show item ${n + 1}`}
              >
                <Media src={m} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </dialog>
  )
}

function Stats({ items = [] }) {
  if (!items.length) return null
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-accent">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  )
}

// Sites a JSW-wide project runs at.
function Sites({ items }) {
  if (!items?.length) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-widest text-ink/60">Live at</span>
      {items.map((x) => (
        <span key={x} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-head">
          {x}
        </span>
      ))}
    </div>
  )
}

function Stack({ items }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s} className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
          {s}
        </li>
      ))}
    </ul>
  )
}

// Projects that ran at a stop; each opens the viewer with that stop's own screens and numbers.
function Built({ at, onOpen }) {
  const built = projects.filter((x) => x.ports?.includes(at))
  if (!built.length) return null
  return (
    <ul className="mt-8 space-y-6 border-l border-line pl-5">
      {built.map((x) => (
        <li key={x.id}>
          <p className="font-medium text-head">{x.name}</p>
          <p className="mt-1 max-w-prose text-sm leading-relaxed">{x.summary}</p>
          <Stats items={x.portStats?.[at] ?? x.stats} />
          <Sites items={x.sites} />
          <button
            onClick={() => onOpen({ ...x, media: x.portMedia?.[at] ?? x.media, stats: x.portStats?.[at] ?? x.stats })}
            className="mt-2 font-mono text-xs uppercase tracking-widest text-accent hover:underline">
            {(x.portMedia?.[at] ?? x.media).length ? 'View screens →' : 'Details →'}
          </button>
        </li>
      ))}
    </ul>
  )
}

const CASE_PARTS = [
  ['situation', 'Situation'],
  ['diagnosis', 'What I found'],
  ['options', 'Options'],
  ['recommendation', 'Recommendation'],
  ['rollout', 'Rollout'],
]

// A flagship project written as an engagement: situation to impact.
function CaseStudy({ c, open, onOpen }) {
  const p = projects.find((x) => x.id === c.project)
  return (
    <details open={open} className="group rounded-lg border border-line bg-panel p-5 open:border-accent/50" onToggle={(e) => e.currentTarget.open && track('Case study opened', { case: c.project })}>
      <summary className="cursor-pointer list-none">
        <p className="font-mono text-[11px] uppercase tracking-widest text-accent">{c.client}</p>
        <h3 className="mt-1 text-lg font-semibold text-head">
          {c.title} <span className="font-mono text-sm text-ink/60 group-open:hidden">+</span>
        </h3>
        <p className="mt-1 text-xs text-ink/70">My role: {c.role}</p>
      </summary>
      <dl className="mt-5 space-y-4 text-sm leading-relaxed">
        {CASE_PARTS.map(([k, label]) => (
          <div key={k}>
            <dt className="font-mono text-[11px] uppercase tracking-widest text-head">{label}</dt>
            <dd className="mt-1">{c[k]}</dd>
          </div>
        ))}
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-widest text-head">Impact</dt>
          <dd>
            <ul className="mt-1 space-y-1 text-accent">
              {c.impact.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
      {p?.media.length > 0 && (
        <button onClick={() => onOpen(p)} className="mt-5 font-mono text-xs uppercase tracking-widest text-accent hover:underline">
          View screens →
        </button>
      )}
    </details>
  )
}

function PortStop({ p, n, active, onOpen }) {
  return (
    <article
      data-stop={p.id}
      data-nav="journey"
      className={`reveal min-h-[70vh] py-12 pr-[34vw] transition-opacity duration-500 lg:min-h-[80vh] lg:pr-0 ${active ? '' : 'lg:opacity-40'}`}
    >
      <p className="font-mono text-xs uppercase tracking-widest text-accent">
        {String(n + 1).padStart(2, '0')}
        {p.when && ` · ${p.when}`}
      </p>
      <h3 className="mt-3 text-2xl font-semibold text-head sm:text-3xl">{p.port}</h3>
      <p className="mt-1 text-sm">{p.place}</p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink/70">
        {p.facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {p.role && <p className="mt-6 text-head">{p.role}</p>}
      {p.text && <p className="mt-2 max-w-prose leading-relaxed">{p.text}</p>}
      <Built at={p.id} onOpen={onOpen} />
    </article>
  )
}

// GitHub contribution calendar: columns are weeks, rows are days, amber by activity level.
function Commits({ data }) {
  const cols = Math.max(...data.days.map((d) => d.col)) + 1
  return (
    <div className="mt-12">
      <h3 className="font-mono text-xs uppercase tracking-widest text-head">Code, last 6 months</h3>
      <div className="mt-4 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 12px))` }}>
        {data.days.map((d) => (
          <span
            key={`${d.row}-${d.col}`}
            title={d.tip}
            className="aspect-square rounded-[2px]"
            style={{ gridRow: d.row + 1, gridColumn: d.col + 1, background: d.level ? `rgb(var(--accent) / ${0.2 + d.level * 0.2})` : 'rgb(var(--line))' }}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-ink/60">
        {data.total} contributions on{' '}
        <a href="https://github.com/shubhamshnd" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          GitHub
        </a>
      </p>
    </div>
  )
}

export default function Portfolio({ commits }) {
  const desktop = useDesktop()
  const [stop, setStop] = useState('about')
  const [nav, setNav] = useState('about')
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(null)
  const [area, setArea] = useState('All')

  // Whatever crosses the middle of the screen drives the globe and the nav.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          setStop(e.target.dataset.stop)
          setNav(e.target.dataset.nav)
        }),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('[data-stop]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [desktop])

  // morph: grow out of the Work card. Opening from a port list just cross-fades.
  const openProject = (p, morph = true) => {
    flushSync(() => setSelected(morph ? p.id : null))
    transition(() => setOpen(p))
  }
  const close = () => transition(() => setOpen(null))

  return (
    <div className="mx-auto max-w-screen-xl px-6 md:px-12 lg:flex lg:justify-between lg:gap-12 lg:px-20">
      <Backdrop />
      {desktop && <Beam stop={stop} />}
      <header
        {...(desktop === false && { 'data-stop': 'about', 'data-nav': 'top' })}
        className="relative z-10 flex min-h-[72svh] flex-col pb-10 pt-16 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:w-1/2 lg:pb-12 lg:pt-12"
      >
        <h1 className="text-4xl font-bold tracking-tight text-head sm:text-5xl">{profile.name}</h1>
        <h2 className="mt-3 text-lg font-medium text-head">{profile.title}</h2>
        <p className="mt-1 font-mono text-sm text-accent">{profile.domains}</p>
        <p className="mt-4 max-w-md border-l-2 border-accent pl-3 text-sm text-head">{profile.openTo}</p>

        {/* One row so the globe gets the height. */}
        <nav className="mt-6 hidden lg:block" aria-label="Sections">
          <ul className="flex gap-6">
            {NAV.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`border-b pb-1 font-mono text-xs uppercase tracking-widest transition-colors ${nav === s.id ? 'border-accent text-head' : 'border-transparent text-ink/60 hover:text-head'}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Slot is always there so the page doesn't jump when the globe mounts. */}
        <div className="hidden min-h-0 flex-1 items-center lg:flex">{desktop && <GlobePanel stop={stop} />}</div>

        <ul className="mt-auto flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm lg:mt-4">
          <li>
            <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
              Email
            </a>
          </li>
          <Links />
        </ul>
      </header>

      {/* Phones: one globe pinned half off the right edge; text runs beside it. */}
      {desktop === false && (
        <div className={`side-globe ${nav === 'top' || nav === 'journey' ? '' : 'side-globe--dim'}`} aria-hidden="true">
          <Globe stop={stop} shift={0.24} />
        </div>
      )}

      <main className="relative z-10 lg:w-1/2 lg:py-24">
        <section id="about" data-stop="about" data-nav="about" className="scroll-mt-16 lg:min-h-[60vh]">
          <h2 className="label">About</h2>
          <p className="max-w-prose text-2xl font-medium leading-snug text-head sm:text-3xl">{profile.lead}</p>
          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-xs">
            {[
              ['Now', `${profile.role}, ${profile.company}`],
              ['Studying', profile.education],
              ['Experience', profile.experience],
              ['Based in', profile.location],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="uppercase tracking-widest text-ink/60">{k}</dt>
                <dd className="mt-1 text-head">{v}</dd>
              </div>
            ))}
          </dl>
          {profile.intro.map((t) => (
            <p key={t} className="mt-5 max-w-prose leading-relaxed">
              {t}
            </p>
          ))}
          <dl className="mt-10 grid grid-cols-2 gap-4 border-y border-line py-6 sm:grid-cols-4">
            {profile.highlights.map((h) => (
              <div key={h.label}>
                <dt className="sr-only">{h.label}</dt>
                <dd className="font-mono text-2xl font-medium text-accent sm:text-3xl">{h.value}</dd>
                <dd className="mt-1 text-xs leading-snug sm:text-sm">{h.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="method" data-stop="about" data-nav="about" className="mt-24 scroll-mt-16">
          <h2 className="label">How I work</h2>
          <ol className="grid gap-5 sm:grid-cols-2">
            {method.map((m, i) => (
              <li key={m.step} className="reveal">
                <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-1 font-medium text-head">{m.step}</p>
                <p className="mt-1 text-sm leading-relaxed">{m.text}</p>
              </li>
            ))}
          </ol>
          <h3 className="mt-12 font-mono text-xs uppercase tracking-widest text-head">Working with people</h3>
          <ul className="mt-4 space-y-2 border-l border-line pl-5 text-sm leading-relaxed">
            {leadership.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="mt-12 space-y-10">
            {Object.entries(capabilities).map(([group, items]) => (
              <div key={group}>
                <h3 className="font-mono text-xs uppercase tracking-widest text-head">{group}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {items.map((c) => (
                    <li key={c} className="rounded border border-line px-2.5 py-1 text-xs text-head">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-head">Technology</h3>
              <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
                {tech.map(([name, icon]) => (
                  <li key={name} className="flex flex-col items-center gap-2 rounded border border-line px-1 py-3 text-head/80 transition-colors hover:border-accent/50 hover:text-accent">
                    {/* Monochrome via mask so every logo takes the text colour. */}
                    <span aria-hidden="true" className="h-6 w-6 bg-current" style={{ mask: `url(/icons/${icon}.svg) center / contain no-repeat`, WebkitMask: `url(/icons/${icon}.svg) center / contain no-repeat` }} />
                    <span className="text-center font-mono text-[10px] leading-tight sm:text-[11px]">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {commits && <Commits data={commits} />}
          <p className="mt-12 font-mono text-xs text-ink/60">Scroll to follow the route ↓</p>
        </section>

        <section id="journey" className="mt-24 scroll-mt-16">
          <h2 className="label">Journey</h2>
          {journey.map((p, n) => (
            <PortStop key={p.id} p={p} n={n} active={stop === p.id} onOpen={(x) => openProject(x, false)} />
          ))}
          <article data-stop="network" data-nav="journey" className={`reveal min-h-[70vh] py-12 pr-[34vw] transition-opacity duration-500 lg:pr-0 ${stop === 'network' ? '' : 'lg:opacity-40'}`}>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">{String(journey.length + 1).padStart(2, '0')} · Network</p>
            <h3 className="mt-3 text-2xl font-semibold text-head sm:text-3xl">JSW Infrastructure</h3>
            <p className="mt-1 text-sm">Ten port concessions in India, plus Fujairah and Dibba in the UAE.</p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink/70">
              {network.map((p) => (
                <li key={p.name}>{p.name}</li>
              ))}
            </ul>
            <Built at="network" onOpen={(x) => openProject(x, false)} />
          </article>
        </section>

        <section id="cases" data-stop="network" data-nav="cases" className="mt-24 scroll-mt-16">
          <h2 className="label">Case studies</h2>
          <div className="space-y-4">
            {cases.map((c, i) => (
              <CaseStudy key={c.project} c={c} open={i === 0} onOpen={(x) => openProject(x, false)} />
            ))}
          </div>
        </section>

        {/* Full width on desktop: reaches back over the left column (same width as this one, plus the gap). */}
        <section
          id="work"
          data-stop="work"
          data-nav="work"
          className="relative z-20 mt-24 scroll-mt-0 overflow-hidden bg-bg lg:-ml-[calc(100%+3rem)] lg:w-[calc(200%+3rem)] lg:border-y lg:border-line lg:px-8 lg:py-10"
        >
          <h2 className="label">Work</h2>
          <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter work">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                aria-pressed={area === a}
                className={`rounded-full border px-3 py-1 font-mono text-xs ${area === a ? 'border-accent bg-accent text-bg' : 'border-line text-ink hover:text-head'}`}
              >
                {a}
              </button>
            ))}
          </div>
          <Barrel area={area} onOpen={(p, k) => openProject({ ...p, start: k }, false)} />
        </section>

        <section id="words" data-stop="network" data-nav="contact" className="mt-32 scroll-mt-16">
          <h2 className="label">What people say</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <figure key={t.name} className={`reveal flex flex-col rounded-lg border border-line bg-panel p-5 ${i === 0 || i === testimonials.length - 1 ? 'sm:col-span-2' : ''}`}>
                <blockquote className={`flex-1 leading-relaxed text-head ${i === 0 ? 'text-lg' : 'text-sm'}`}>
                  <span className="mr-1 font-mono text-accent" aria-hidden="true">“</span>
                  {t.quote}
                </blockquote>
                <figcaption className="mt-4 border-t border-line pt-3">
                  <p className="font-medium text-head">{t.name}</p>
                  <p className="text-xs">{t.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-ink/60">{t.note} · via LinkedIn</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="contact" data-stop="network" data-nav="contact" className="mt-32 min-h-[50vh] scroll-mt-16 pb-24">
          <h2 className="label">Contact</h2>
          <p className="max-w-prose text-2xl font-medium leading-snug text-head">{profile.openTo}</p>
          <p className="mt-3 max-w-prose">Email is the quickest way to reach me. I reply within a day or two.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="rounded-md bg-accent px-5 py-2.5 font-medium text-bg hover:bg-accent/90">
              Email me
            </a>
            <a href={profile.links[0].href} target="_blank" rel="noreferrer" className="rounded-md border border-line px-5 py-2.5 font-medium text-head hover:border-accent">
              LinkedIn ↗
            </a>
            <a href="/shubham_resume.pdf" target="_blank" rel="noreferrer" onClick={() => track('Résumé opened')} className="rounded-md border border-line px-5 py-2.5 font-medium text-head hover:border-accent">
              Résumé ↗
            </a>
          </div>
          <p className="mt-4 font-mono text-sm text-ink/70">{profile.email}</p>
        </section>
      </main>

      {open && <Viewer project={open} onClose={close} />}
    </div>
  )
}
