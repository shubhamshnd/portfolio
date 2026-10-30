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
  { id: 'work', label: 'Work' },
  { id: 'cases', label: 'Cases' },
  { id: 'contact', label: 'Contact' },
]

const isVideo = (src) => /\.(mp4|webm)$/i.test(src)
const AREAS = ['All', 'AI', 'Data', 'IoT/OT', 'ERP', 'Apps']
const hasArea = (p, area) => area === 'All' || p.areas?.includes(area)

// Phones get 44px buttons; desktop keeps plain links in the left column.
const HEADER_LINK = 'inline-flex min-h-11 items-center rounded-md border px-4 hover:border-accent lg:min-h-0 lg:border-0 lg:px-0'

// External links; the résumé one is counted in Vercel Analytics.
function Links() {
  return profile.links.map((l) => (
    <li key={l.label}>
      <a
        href={l.href}
        target="_blank"
        rel="noreferrer"
        className={`${HEADER_LINK} border-line hover:text-accent`}
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

function GlobePanel({ stop, size = 'min(560px, calc(100vh - 400px), 100%)' }) {
  const [title, sub] = caption(stop)
  return (
    <figure className="mx-auto w-full" style={{ maxWidth: size }}>
      <Globe stop={stop} />
      <figcaption className="mt-2 text-center font-mono text-xs" aria-live="polite">
        <span className="text-accent">{title}</span>
        {sub && <span className="text-ink"> · {sub}</span>}
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

// A ring of one screen per project, in CSS 3D, above the Work list. It is decoration: the list is the way in,
// so the ring is hidden from screen readers and the keyboard. It turns slowly, stops while the pointer is on it,
// and a filter holds it still with the matching projects turned to the front. Drag to spin; click to open.
const R = 40 // ring radius, in % of the container width (cqw)

function Ring({ items, area, onOpen }) {
  const n = items.length
  const w = 2 * R * Math.tan(Math.PI / n) - 0.8 // cards just touch round the ring, with a small gap
  const h = (w * 9) / 16
  const [assign, setAssign] = useState(() => items.map((_, i) => i)) // assign[i]: the slot of project i
  const ring = useRef(null)
  const els = useRef([])
  const s = useRef({ yaw: 0, vy: 0, drag: null, moved: 0, aim: null, hover: false }).current
  const latest = useRef({})
  latest.current = { area, assign }
  const facing = (slot) => Math.cos((((slot * 360) / n + s.yaw) * Math.PI) / 180)

  // A filter gives its projects the slots nearest the viewer.
  useEffect(() => {
    s.vy = 0
    if (area === 'All') {
      s.aim = null
      return setAssign(items.map((_, i) => i))
    }
    s.aim = s.yaw
    const order = items.map((_, j) => j).sort((a, b) => facing(b) - facing(a))
    const ids = items.map((_, i) => i)
    const next = []
    ;[...ids.filter((i) => hasArea(items[i], area)), ...ids.filter((i) => !hasArea(items[i], area))].forEach((i, k) => (next[i] = order[k]))
    setAssign(next)
  }, [area]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf
    let last = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (!s.drag) {
        if (s.aim != null) s.yaw += (s.aim - s.yaw) * (still ? 1 : 1 - Math.exp(-4 * dt))
        else s.yaw += (s.vy - (still || s.hover ? 0 : 6)) * dt
        s.vy *= Math.exp(-3 * dt)
      }
      ring.current.style.transform = `rotateX(-8deg) rotateY(${s.yaw}deg)`
      items.forEach((p, i) => {
        const el = els.current[i]
        if (!el) return
        const z = Math.max(facing(latest.current.assign[i]), 0)
        const on = hasArea(p, latest.current.area)
        el.style.opacity = on ? 0.3 + 0.7 * z : 0.05 + 0.1 * z
        el.style.pointerEvents = on && z > 0.6 ? 'auto' : 'none'
      })
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
  }, [items, s]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      aria-hidden="true"
      className="relative w-full cursor-grab select-none active:cursor-grabbing [container-type:inline-size] [&_img]:pointer-events-none"
      // cqw doesn't resolve on the container itself, so its height comes from an aspect ratio. The tilted
      // ring reaches further below its centre than above, hence the centre at 45%.
      style={{ aspectRatio: `100 / ${h * 2.6}`, perspective: '1200px', touchAction: 'pan-y' }}
      onPointerEnter={() => (s.hover = true)}
      onPointerLeave={() => (s.hover = false)}
      onPointerDown={(e) => {
        s.drag = { x: e.clientX, y: e.clientY, t: performance.now() }
        s.moved = 0
        s.aim = null
      }}
    >
      <div ref={ring} className="absolute left-1/2 top-[45%]" style={{ transformStyle: 'preserve-3d' }}>
        {items.map((p, i) => (
          <button
            key={p.id}
            ref={(el) => (els.current[i] = el)}
            tabIndex={-1}
            onClick={() => s.moved < 6 && onOpen(p)}
            className={`absolute block aspect-video overflow-hidden rounded-sm border bg-panel ${area !== 'All' && hasArea(p, area) ? 'border-accent' : 'border-line'}`}
            style={{
              width: `${w}cqw`,
              left: `${-w / 2}cqw`,
              top: `${-h / 2}cqw`,
              transform: `rotateY(${(assign[i] * 360) / n}deg) translateZ(${R}cqw)`,
              transition: 'transform 1s cubic-bezier(.2,.8,.2,1)',
            }}
          >
            <Media src={p.media[0]} alt="" />
          </button>
        ))}
      </div>
    </div>
  )
}

// Work: every project as a plain list, filtered by area. A row with screens opens them.
function Work({ onOpen }) {
  const [area, setArea] = useState('All')
  const withScreens = useMemo(() => projects.filter((p) => p.media.length), [])
  const shown = projects.filter((p) => hasArea(p, area))
  return (
    <>
      <Ring items={withScreens} area={area} onOpen={onOpen} />
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter work">
        {AREAS.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            aria-pressed={area === a}
            className={`min-h-11 rounded-full border px-4 font-mono text-xs ${area === a ? 'border-accent bg-accent text-bg' : 'border-line text-ink hover:text-head'}`}
          >
            {a}
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-xs text-ink" aria-live="polite">
        {area === 'All' ? `${projects.length} projects` : `${shown.length} of ${projects.length} projects in ${area}`}
      </p>
      <ul className="mt-2 border-b border-line">
        {shown.map((p) => (
          <li key={p.id} className="group relative border-t border-line py-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-medium text-head">
                {p.media.length ? (
                  // The button stretches over the whole row, so anywhere on it opens the screens.
                  <button onClick={() => onOpen(p)} className="text-left after:absolute after:inset-0 group-hover:text-accent">
                    {p.name}
                  </button>
                ) : (
                  p.name
                )}
              </h3>
              {p.media.length > 0 && (
                <span aria-hidden="true" className="shrink-0 font-mono text-xs uppercase tracking-widest text-accent">
                  View screens →
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 max-w-prose text-sm leading-relaxed">{p.summary}</p>
            <p className="mt-2 font-mono text-xs text-ink">{p.areas?.join(' · ')}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function Viewer({ project, onClose }) {
  const ref = useRef(null)
  const closeBtn = useRef(null)
  const [i, setI] = useState(project.start ?? 0)
  // Focus starts on Close and goes back to whatever opened the viewer.
  useLayoutEffect(() => {
    const opener = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    closeBtn.current.focus()
    // Close first: while the dialog is still modal the rest of the page is inert and can't take focus.
    return () => {
      dialog.close()
      opener?.focus?.({ preventScroll: true })
    }
  }, [])
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
          <button ref={closeBtn} onClick={onClose} className="min-h-11 shrink-0 whitespace-nowrap font-mono text-sm text-ink hover:text-accent">
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

// Sites a JSW-wide project runs at. The count is what matters to an outsider; the site codes sit in a tooltip.
function Sites({ items }) {
  if (!items?.length) return null
  return (
    <p className="mt-3 font-mono text-xs uppercase tracking-widest text-head" title={items.join(', ')}>
      Live at {items.length} JSW sites
    </p>
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
    // Phones: full width over the globe, on a solid panel so it stays readable.
    <ul className="mt-8 space-y-6 border-l border-line pl-5 max-lg:rounded-r-md max-lg:bg-bg/90 max-lg:py-4 max-lg:pr-4">
      {built.map((x) => {
        const media = x.portMedia?.[at] ?? x.media
        return (
          <li key={x.id}>
            <h4 className="font-medium text-head">{x.name}</h4>
            <p className="mt-1 max-w-prose text-sm leading-relaxed">{x.summary}</p>
            <Stats items={x.portStats?.[at] ?? x.stats} />
            <Sites items={x.sites} />
            {media.length > 0 && (
              <button
                onClick={() => onOpen({ ...x, media, stats: x.portStats?.[at] ?? x.stats })}
                className="mt-1 min-h-11 font-mono text-xs uppercase tracking-widest text-accent hover:underline"
              >
                View screens →
              </button>
            )}
          </li>
        )
      })}
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
        <p className="font-mono text-xs uppercase tracking-widest text-accent">{c.client}</p>
        <h3 className="mt-1 text-lg font-semibold text-head">
          {c.title} <span className="font-mono text-sm text-ink group-open:hidden">+</span>
        </h3>
        <p className="mt-1 text-xs text-ink">My role: {c.role}</p>
      </summary>
      <dl className="mt-5 space-y-4 text-sm leading-relaxed">
        {CASE_PARTS.map(([k, label]) => (
          <div key={k}>
            <dt className="font-mono text-xs uppercase tracking-widest text-head">{label}</dt>
            <dd className="mt-1">{c[k]}</dd>
          </div>
        ))}
        <div>
          <dt className="font-mono text-xs uppercase tracking-widest text-head">Impact</dt>
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
      className={`reveal min-h-[70vh] py-12 transition-opacity duration-500 lg:min-h-[80vh] ${active ? '' : 'lg:opacity-70'}`}
    >
      {/* Phones: the heading keeps clear of the globe on the right; the project list below runs full width. */}
      <div className="pr-[34vw] lg:pr-0">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          {String(n + 1).padStart(2, '0')}
          {p.when && ` · ${p.when}`}
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-head sm:text-3xl">{p.port}</h3>
        <p className="mt-1 text-sm">{p.place}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink">
          {p.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        {p.role && <p className="mt-6 text-head">{p.role}</p>}
        {p.text && <p className="mt-2 max-w-prose leading-relaxed">{p.text}</p>}
      </div>
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
      {/* The line below gives the total, so screen readers skip the 180-odd cells. */}
      <div aria-hidden="true" className="mt-4 grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 12px))` }}>
        {data.days.map((d) => (
          <span
            key={`${d.row}-${d.col}`}
            title={d.tip}
            className="aspect-square rounded-[2px]"
            style={{ gridRow: d.row + 1, gridColumn: d.col + 1, background: d.level ? `rgb(var(--accent) / ${0.2 + d.level * 0.2})` : 'rgb(var(--line))' }}
          />
        ))}
      </div>
      <p className="mt-3 font-mono text-xs text-ink">
        {data.total} contributions on{' '}
        <a href="https://github.com/shubhamshnd" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          GitHub
        </a>
      </p>
    </div>
  )
}

function CopyEmail() {
  const [done, setDone] = useState(false)
  const copy = () =>
    navigator.clipboard?.writeText(profile.email).then(() => {
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    })
  return (
    <p className="mt-4 flex flex-wrap items-center gap-3 font-mono text-sm text-ink">
      {profile.email}
      <button onClick={copy} className="min-h-11 rounded-md border border-line px-3 text-xs uppercase tracking-widest text-head hover:border-accent">
        <span aria-live="polite">{done ? 'Copied' : 'Copy'}</span>
      </button>
    </p>
  )
}

export default function Portfolio({ commits }) {
  const desktop = useDesktop()
  const [stop, setStop] = useState('about')
  const [nav, setNav] = useState('about')
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

  const openProject = (p) => transition(() => setOpen(p))
  const close = () => transition(() => setOpen(null))

  return (
    <div className="mx-auto max-w-screen-xl px-6 md:px-12 lg:flex lg:justify-between lg:gap-12 lg:px-20">
      <Backdrop />
      {desktop && <Beam stop={stop} />}
      <header
        {...(desktop === false && { 'data-stop': 'about', 'data-nav': 'top' })}
        className="relative z-10 flex flex-col pb-12 pt-16 lg:sticky lg:top-0 lg:h-screen lg:w-1/2 lg:pb-12 lg:pt-12"
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
                  className={`border-b pb-1 font-mono text-xs uppercase tracking-widest transition-colors ${nav === s.id ? 'border-accent text-head' : 'border-transparent text-ink hover:text-head'}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Slot is always there so the page doesn't jump when the globe mounts. */}
        <div className="hidden min-h-0 flex-1 items-center lg:flex">{desktop && <GlobePanel stop={stop} />}</div>

        <ul className="mt-6 flex flex-wrap gap-2 font-mono text-sm lg:mt-4 lg:gap-x-6 lg:gap-y-2">
          <li>
            <a href={`mailto:${profile.email}`} className={`${HEADER_LINK} border-accent text-accent hover:underline`}>
              Email
            </a>
          </li>
          <Links />
        </ul>
      </header>

      {/* Phones: one globe pinned half off the right edge; text runs beside it. Gone by Contact. */}
      {desktop === false && (
        <div className={`side-globe ${nav === 'top' || nav === 'journey' ? '' : nav === 'contact' ? 'side-globe--off' : 'side-globe--dim'}`} aria-hidden="true">
          <Globe stop={stop} shift={0.24} />
        </div>
      )}

      {/* Phones: Email and Résumé stay in reach between the header and Contact. */}
      {desktop === false && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 transition-transform duration-300 ${nav === 'top' || nav === 'contact' ? 'translate-y-full' : ''}`}
          inert={nav === 'top' || nav === 'contact' ? '' : undefined}
        >
          <a href={`mailto:${profile.email}`} className="flex min-h-11 flex-1 items-center justify-center rounded-md bg-accent font-medium text-bg">
            Email me
          </a>
          <a href="/shubham_resume.pdf" target="_blank" rel="noreferrer" onClick={() => track('Résumé opened')} className="flex min-h-11 flex-1 items-center justify-center rounded-md border border-line font-medium text-head">
            Résumé ↗
          </a>
        </div>
      )}

      <main className="relative z-10 lg:w-1/2 lg:py-24">
        <section id="about" data-stop="about" data-nav="about" className="scroll-mt-16 lg:min-h-[60vh]">
          <h2 className="label">About</h2>
          <p className="max-w-prose text-2xl font-medium leading-snug text-head sm:text-3xl">{profile.lead}</p>
          {/* The numbers come straight after the lead, so they're on the first screen. */}
          <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-line py-6 sm:grid-cols-4">
            {profile.highlights.map((h) => (
              <div key={h.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-1 text-xs leading-snug sm:text-sm">{h.label}</dt>
                <dd className="font-mono text-2xl font-medium text-accent sm:text-3xl">{h.value}</dd>
              </div>
            ))}
          </dl>
          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-xs">
            {[
              ['Now', `${profile.role}, ${profile.company}`],
              ['Studying', profile.education],
              ['Experience', profile.experience],
              ['Based in', profile.location],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="uppercase tracking-widest text-ink">{k}</dt>
                <dd className="mt-1 text-head">{v}</dd>
              </div>
            ))}
          </dl>
          {profile.intro.map((t) => (
            <p key={t} className="mt-5 max-w-prose leading-relaxed">
              {t}
            </p>
          ))}
          <p className="mt-10 font-mono text-xs text-ink">Scroll to follow the route ↓</p>
        </section>

        <section id="journey" className="mt-24 scroll-mt-16">
          <h2 className="label">Journey</h2>
          {journey.map((p, n) => (
            <PortStop key={p.id} p={p} n={n} active={stop === p.id} onOpen={openProject} />
          ))}
          <article data-stop="network" data-nav="journey" className={`reveal min-h-[70vh] py-12 transition-opacity duration-500 ${stop === 'network' ? '' : 'lg:opacity-70'}`}>
            <div className="pr-[34vw] lg:pr-0">
              <p className="font-mono text-xs uppercase tracking-widest text-accent">{String(journey.length + 1).padStart(2, '0')} · Network</p>
              <h3 className="mt-3 text-2xl font-semibold text-head sm:text-3xl">JSW Infrastructure</h3>
              <p className="mt-1 text-sm">Ten port concessions in India, plus Fujairah and Dibba in the UAE.</p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink">
                {network.map((p) => (
                  <li key={p.name}>{p.name}</li>
                ))}
              </ul>
            </div>
            <Built at="network" onOpen={openProject} />
          </article>
        </section>

        <section id="work" data-stop="network" data-nav="work" className="mt-24 scroll-mt-16">
          <h2 className="label">Work</h2>
          <Work onOpen={openProject} />
        </section>

        <section id="cases" data-stop="network" data-nav="cases" className="mt-32 scroll-mt-16">
          <h2 className="label">Case studies</h2>
          <div className="space-y-4">
            {cases.map((c, i) => (
              <CaseStudy key={c.project} c={c} open={i === 0} onOpen={openProject} />
            ))}
          </div>
        </section>

        <section id="method" data-stop="network" data-nav="cases" className="mt-32 scroll-mt-16">
          <h2 className="label">How I work</h2>
          <ol className="grid gap-5 sm:grid-cols-2">
            {method.map((m, i) => (
              <li key={m.step} className="reveal">
                <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="mt-1 font-medium text-head">{m.step}</h3>
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
        </section>

        <section id="skills" data-stop="network" data-nav="cases" className="mt-24 scroll-mt-16">
          <h2 className="label">Skills and tools</h2>
          <div className="space-y-10">
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
                    <span className="text-center font-mono text-xs leading-tight">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {commits && <Commits data={commits} />}
        </section>

        <section id="words" data-stop="network" data-nav="cases" className="mt-32 scroll-mt-16">
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
                  <p className="mt-1 font-mono text-xs text-ink">{t.note} · via LinkedIn</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="contact" data-stop="network" data-nav="contact" className="mt-32 min-h-[50vh] scroll-mt-16 pb-24">
          <h2 className="label">Contact</h2>
          <p className="max-w-prose text-2xl font-medium leading-snug text-head">Email is the quickest way to reach me. I reply within a day or two.</p>
          <p className="mt-3 max-w-prose">{profile.openTo}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}`} className="inline-flex min-h-11 items-center rounded-md bg-accent px-5 font-medium text-bg hover:bg-accent/90">
              Email me
            </a>
            <a href={profile.links[0].href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium text-head hover:border-accent">
              LinkedIn ↗
            </a>
            <a href="/shubham_resume.pdf" target="_blank" rel="noreferrer" onClick={() => track('Résumé opened')} className="inline-flex min-h-11 items-center rounded-md border border-line px-5 font-medium text-head hover:border-accent">
              Résumé ↗
            </a>
          </div>
          <CopyEmail />
        </section>
      </main>

      {open && <Viewer project={open} onClose={close} />}
    </div>
  )
}
