'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Globe from '@/components/globe'
import Backdrop from '@/components/backdrop'
import { profile, journey, network, projects } from '@/data/site'

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Journey' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

const isVideo = (src) => /\.(mp4|webm)$/i.test(src)

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
  return ['Route', `Scroll to start at ${journey[0].port}`]
}

function GlobePanel({ stop, size = 'min(760px, calc(100vh - 330px), 100%)' }) {
  const [title, sub] = caption(stop)
  return (
    <figure className="mx-auto w-full" style={{ maxWidth: size }}>
      <Globe stop={stop} />
      <figcaption className="mt-2 text-center font-mono text-xs" aria-live="polite">
        <span className="text-accent">{title}</span>
        <span className="text-ink/70"> · {sub}</span>
      </figcaption>
    </figure>
  )
}

function Media({ src, alt, controls, fit = 'object-cover object-top' }) {
  const cls = `h-full w-full ${fit}`
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

function Viewer({ project, onClose }) {
  const ref = useRef(null)
  const [i, setI] = useState(0)
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

function PortStop({ p, n, active, onOpen }) {
  const built = projects.filter((x) => x.ports?.includes(p.id))
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
      {built.length > 0 && (
        <ul className="mt-8 space-y-6 border-l border-line pl-5">
          {built.map((x) => (
            <li key={x.id}>
              <p className="font-medium text-head">{x.name}</p>
              <p className="mt-1 max-w-prose text-sm leading-relaxed">{x.summary}</p>
              <Stats items={x.portStats?.[p.id] ?? x.stats} />
              <button
                onClick={() => onOpen({ ...x, media: x.portMedia?.[p.id] ?? x.media, stats: x.portStats?.[p.id] ?? x.stats })}
                className="mt-2 font-mono text-xs uppercase tracking-widest text-accent hover:underline">
                View screens →
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function Portfolio() {
  const desktop = useDesktop()
  const [stop, setStop] = useState('about')
  const [nav, setNav] = useState('about')
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(null)

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
      <header
        {...(desktop === false && { 'data-stop': 'about', 'data-nav': 'top' })}
        className="relative z-10 flex min-h-[72svh] flex-col pb-10 pt-16 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:w-1/2 lg:pb-12 lg:pt-12"
      >
        <h1 className="text-4xl font-bold tracking-tight text-head sm:text-5xl">{profile.name}</h1>
        <h2 className="mt-3 text-lg font-medium text-head">{profile.title}</h2>
        <p className="mt-1 font-mono text-sm text-accent">{profile.domains}</p>

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

        <ul className="mt-auto flex gap-6 font-mono text-sm lg:mt-0">
          {profile.links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer" className="hover:text-accent">
                {l.label} ↗
              </a>
            </li>
          ))}
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
          {profile.intro.map((t) => (
            <p key={t} className="mt-5 max-w-prose leading-relaxed">
              {t}
            </p>
          ))}
          <dl className="mt-10 grid grid-cols-3 gap-4 border-y border-line py-6">
            {profile.highlights.map((h) => (
              <div key={h.label}>
                <dt className="sr-only">{h.label}</dt>
                <dd className="font-mono text-2xl font-medium text-accent sm:text-3xl">{h.value}</dd>
                <dd className="mt-1 text-xs leading-snug sm:text-sm">{h.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 font-mono text-xs text-ink/60">Scroll to follow the route ↓</p>
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
          </article>
        </section>

        <section id="work" data-stop="network" data-nav="work" className="mt-24 scroll-mt-16">
          <h2 className="label">Work</h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id} className="reveal">
                <button onClick={() => openProject(p)} className="group w-full text-left">
                  <Thumb
                    project={p}
                    style={{ viewTransitionName: selected === p.id && open?.id !== p.id ? `p-${p.id}` : undefined }}
                  />
                  <h3 className="mt-3 font-medium text-head transition-colors group-hover:text-accent">{p.name} →</h3>
                  <p className="mt-1 text-sm">{p.summary}</p>
                  <Stats items={p.stats} />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" data-stop="network" data-nav="contact" className="mt-32 min-h-[50vh] scroll-mt-16 pb-24">
          <h2 className="label">Contact</h2>
          <p className="max-w-prose text-lg">Email is the quickest way to reach me.</p>
          <a href={`mailto:${profile.email}`} className="mt-4 inline-block font-mono text-accent hover:underline">
            {profile.email}
          </a>
        </section>
      </main>

      {open && <Viewer project={open} onClose={close} />}
    </div>
  )
}
