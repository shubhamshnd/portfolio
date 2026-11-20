'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import dynamic from 'next/dynamic'
import { track } from '@vercel/analytics'
import { profile, zones, abroad, journey, network, projects, capabilities, tech, cases, testimonials } from '@/data/site'

// three.js only loads in the browser, after the first paint.
const Terminal = dynamic(() => import('@/components/terminal'), { ssr: false })

const NAV = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'cases', label: 'Cases' },
  { id: 'work', label: 'Work' },
  { id: 'words', label: 'References' },
  { id: 'contact', label: 'Contact' },
]

const isVideo = (src) => /\.(mp4|webm)$/i.test(src)
const AREAS = ['All', 'AI', 'Data', 'IoT/OT', 'ERP', 'Apps']
const hasArea = (p, area) => area === 'All' || p.areas?.includes(area)

// Runs a DOM update inside a View Transition when the browser has it.
function transition(update) {
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update()
  document.startViewTransition(() => flushSync(update))
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
    <details id={`case-${c.project}`} open={open} className="group scroll-mt-16 rounded-lg border border-line bg-panel p-5 open:border-accent/50" onToggle={(e) => e.currentTarget.open && track('Case study opened', { case: c.project })}>
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


const byId = (id) => projects.find((p) => p.id === id)

// The 3D terminal with its zone buttons; the panel lists what I built for the picked zone.
function TerminalSection({ onOpen }) {
  const [zone, setZone] = useState(null)
  const z = zones.find((x) => x.id === zone)
  const pick = (id) => {
    setZone(id)
    if (id) track('Zone opened', { zone: id })
  }
  return (
    <section id="terminal" data-nav="terminal" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="label">A terminal, system by system</h2>
        <p className="max-w-prose text-head">
          Every system I've built has a place in the port. Pick a zone to see what runs there.
          <span className="max-sm:hidden"> Drag to look around.</span>
        </p>
      </div>
      <div className="relative mt-6 h-[62vh] min-h-[380px] w-full border-y border-line bg-[radial-gradient(ellipse_at_center,rgb(var(--panel))_0%,rgb(var(--bg))_70%)] sm:h-[72vh]">
        <Terminal active={zone} onSelect={pick} />
        {z && (
          <div className="fade absolute bottom-3 right-3 top-3 z-10 hidden w-[380px] overflow-y-auto rounded-lg border border-line bg-bg/92 p-5 backdrop-blur md:block">
            <ZoneBody z={z} onOpen={onOpen} onClose={() => pick(null)} />
          </div>
        )}
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Terminal zones">
          {zones.map((x, i) => (
            <button
              key={x.id}
              onClick={() => pick(zone === x.id ? null : x.id)}
              aria-pressed={zone === x.id}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm ${zone === x.id ? 'border-accent bg-accent text-bg' : 'border-line text-head hover:border-accent'}`}
            >
              <span className="font-mono text-xs opacity-70">{i + 1}</span> {x.name}
            </button>
          ))}
        </div>
        {/* Phones and tablets: the zone panel sits under the scene instead of over it. */}
        {z && (
          <div className="fade mt-4 rounded-lg border border-line bg-panel p-5 md:hidden">
            <ZoneBody z={z} onOpen={onOpen} onClose={() => pick(null)} />
          </div>
        )}
      </div>
    </section>
  )
}

function ZoneBody({ z, onOpen, onClose }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-head">{z.name}</h3>
        <button onClick={onClose} className="min-h-11 shrink-0 font-mono text-xs text-ink hover:text-accent" aria-label="Back to the whole terminal">
          ✕
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{z.text}</p>
      <ul className="mt-4 space-y-3">
        {z.projects.map(byId).filter(Boolean).map((p) => (
          <li key={p.id} className="border-t border-line pt-3">
            <p className="font-medium text-head">{p.name}</p>
            <p className="mt-1 line-clamp-3 text-sm leading-relaxed">{p.summary}</p>
            <Stats items={p.stats} />
            <Sites items={p.sites} />
            {p.media.length > 0 && (
              <button onClick={() => onOpen(p)} className="mt-1 min-h-11 font-mono text-xs uppercase tracking-widest text-accent hover:underline">
                View screens →
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

// Work: every project as a card with its first screen, filtered by area.
function Work({ onOpen }) {
  const [area, setArea] = useState('All')
  const shown = projects.filter((p) => hasArea(p, area))
  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter work">
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
      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((p) => (
          <li key={p.id} id={p.id} className="group relative flex scroll-mt-20 flex-col rounded-lg border border-line bg-panel p-3 hover:border-accent/60">
            <Thumb project={p} />
            <h3 className="mt-3 px-1 font-medium text-head">
              {p.media.length ? (
                <button onClick={() => onOpen(p)} className="text-left after:absolute after:inset-0 group-hover:text-accent">
                  {p.name}
                </button>
              ) : (
                p.name
              )}
            </h3>
            <p className="mt-1 line-clamp-3 px-1 text-sm leading-relaxed">{p.summary}</p>
            <p className="mt-auto px-1 pt-3 font-mono text-xs text-ink">{p.areas?.join(' · ')}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

const BTN = 'inline-flex min-h-11 items-center rounded-md px-5 font-medium'

function Actions({ from }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={`mailto:${profile.email}`} onClick={() => track('Email clicked', { from })} className={`${BTN} bg-accent text-bg hover:bg-accent/90`}>
        Email me
      </a>
      <a href="/resume" target="_blank" rel="noreferrer" onClick={() => track('Résumé opened', { from })} className={`${BTN} border border-line text-head hover:border-accent`}>
        Résumé ↗
      </a>
      <a href={profile.links[0].href} target="_blank" rel="noreferrer" onClick={() => track('LinkedIn opened', { from })} className={`${BTN} border border-line text-head hover:border-accent`}>
        LinkedIn ↗
      </a>
    </div>
  )
}

export default function Portfolio() {
  const [nav, setNav] = useState(null)
  const [open, setOpen] = useState(null)

  // The section crossing the middle of the screen lights its nav link. Each section is counted once per visit.
  useEffect(() => {
    const seen = new Set()
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const id = e.target.id
          setNav(e.target.dataset.nav)
          if (seen.has(id)) return
          seen.add(id)
          track('Section reached', { section: id })
        }),
      { rootMargin: '-50% 0px -50% 0px' },
    )
    document.querySelectorAll('section[id]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const openProject = (p) => transition(() => setOpen(p))
  const close = () => transition(() => setOpen(null))

  // Share links: /#portbird scrolls to that project and opens its screens; /#case-portbird opens that case study.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1))
      const el = id && document.getElementById(id)
      if (!el) return
      if (el.tagName === 'DETAILS') el.open = true
      el.scrollIntoView({ block: 'start' })
      track('Share link opened', { id })
      const p = byId(id)
      if (p?.media.length) setOpen(p)
    }
    go()
    addEventListener('hashchange', go)
    return () => removeEventListener('hashchange', go)
  }, [])

  const wrap = 'mx-auto max-w-6xl px-4 sm:px-6'

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className={`${wrap} flex h-14 items-center justify-between gap-4`}>
          <a href="#top" className="font-semibold text-head">
            {profile.name}
          </a>
          <nav aria-label="Sections" className="max-md:hidden">
            <ul className="flex gap-6">
              {NAV.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={`font-mono text-xs uppercase tracking-widest ${nav === s.id ? 'text-accent' : 'text-ink hover:text-head'}`}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="/resume" target="_blank" rel="noreferrer" onClick={() => track('Résumé opened', { from: 'header' })} className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-widest text-accent hover:underline">
            Résumé ↗
          </a>
        </div>
      </header>

      <main id="top">
        <section id="about" data-nav="about" className={`${wrap} pb-14 pt-14 sm:pt-20`}>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">{profile.title}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-head sm:text-6xl">{profile.lead}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed">
            {profile.name}, {profile.role} at {profile.company}. {profile.domains}.
          </p>
          <p className="mt-5 max-w-2xl border-l-2 border-accent pl-4 text-head">{profile.openTo}</p>
          <div className="mt-8">
            <Actions from="hero" />
          </div>
          <dl className="mt-12 grid grid-cols-2 gap-6 border-y border-line py-6 lg:grid-cols-4">
            {profile.highlights.map((h) => (
              <div key={h.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-1 text-sm leading-snug">{h.label}</dt>
                <dd className="font-mono text-3xl font-medium text-accent sm:text-4xl">{h.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <TerminalSection onOpen={openProject} />

        <section id="profile" data-nav="terminal" className={`${wrap} mt-24 grid gap-12 lg:grid-cols-[1.2fr_1fr]`}>
          <div>
            <h2 className="label">About</h2>
            {profile.intro.map((t) => (
              <p key={t} className="mb-5 max-w-prose leading-relaxed">
                {t}
              </p>
            ))}
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
          </div>
          <div id="abroad" className="rounded-lg border border-accent/40 bg-panel p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-accent">For hiring teams outside India</h2>
            <dl className="mt-5 space-y-4 text-sm leading-relaxed">
              {abroad.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-xs uppercase tracking-widest text-head">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="ports" data-nav="terminal" className={`${wrap} mt-24`}>
          <h2 className="label">Ports I've worked at</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((p, n) => (
              <li key={p.id} className="rounded-lg border border-line p-5">
                <p className="font-mono text-xs text-accent">
                  {String(n + 1).padStart(2, '0')}
                  {p.when && ` · ${p.when}`}
                </p>
                <h3 className="mt-2 font-semibold text-head">{p.port}</h3>
                <p className="text-sm">{p.place}</p>
                <p className="mt-3 font-mono text-xs text-ink">{p.facts.join(' · ')}</p>
                <p className="mt-3 text-sm text-head">
                  {projects
                    .filter((x) => x.ports?.includes(p.id))
                    .map((x) => x.name)
                    .join(', ')}
                </p>
              </li>
            ))}
            <li className="rounded-lg border border-line p-5">
              <p className="font-mono text-xs text-accent">{String(journey.length + 1).padStart(2, '0')} · Network</p>
              <h3 className="mt-2 font-semibold text-head">JSW Infrastructure</h3>
              <p className="text-sm">Port concessions across India, plus Fujairah and Dibba in the UAE.</p>
              <p className="mt-3 font-mono text-xs text-ink">{network.map((x) => x.name).join(' · ')}</p>
            </li>
          </ol>
        </section>

        <section id="cases" data-nav="cases" className={`${wrap} mt-28 scroll-mt-20`}>
          <h2 className="label">Case studies</h2>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {cases.slice(0, 4).map((c, i) => (
              <CaseStudy key={c.project} c={c} open={i === 0} onOpen={openProject} />
            ))}
          </div>
        </section>

        <section id="work" data-nav="work" className={`${wrap} mt-28 scroll-mt-20`}>
          <h2 className="label">All work</h2>
          <Work onOpen={openProject} />
        </section>

        <section id="words" data-nav="words" className={`${wrap} mt-28 scroll-mt-20`}>
          <h2 className="label">What people say</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <figure key={t.name} className={`reveal flex flex-col rounded-lg border border-line bg-panel p-5 ${i === 0 ? 'sm:col-span-2' : ''}`}>
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

        <section id="skills" data-nav="words" className={`${wrap} mt-20`}>
          <h2 className="label">Skills</h2>
          <p className="max-w-4xl text-sm leading-relaxed text-head">{capabilities.Advisory.join(' · ')}</p>
          <p className="mt-3 max-w-4xl font-mono text-xs leading-relaxed">{tech.map(([n]) => n).join(' · ')}</p>
        </section>

        <section id="contact" data-nav="contact" className={`${wrap} mt-28 scroll-mt-20 pb-28`}>
          <h2 className="label">Contact</h2>
          <p className="max-w-3xl text-3xl font-medium leading-snug text-head">Hiring for a port or terminal? Email is the quickest way to reach me. I reply within a day or two.</p>
          <p className="mt-4 max-w-2xl">{profile.openTo}</p>
          <div className="mt-8">
            <Actions from="contact" />
          </div>
          <CopyEmail />
        </section>
      </main>

      {open && <Viewer project={open} onClose={close} />}
    </>
  )
}
