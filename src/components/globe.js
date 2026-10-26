'use client'

import { useEffect, useRef } from 'react'
import { geoOrthographic, geoPath, geoGraticule, geoInterpolate, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import { journey, network } from '@/data/site'

// Navigation-chart globe: vector coastlines, a lat/long grid, labelled ports. Drawn on a 2D canvas
// and only redrawn while something moves, so it costs nothing when parked on a port.

const INDIA = [20, 76]
const HUB = journey.find((p) => p.id === 'jaigarh').location
const at = (id) => journey.find((p) => p.id === id).location
// Origin ports from the PortBird vessel lists; drawn faintly on the opening spin as trade lanes.
const LANES = [
  [[33.07, 131.86], at('dharamtar')], // Tsukumi, Japan
  [[19.66, 57.7], at('dharamtar')], // Duqm, Oman
  [[44.72, 37.77], at('dharamtar')], // Novorossiysk
  [[22.6, 120.3], at('jnpa')], // Kaohsiung
  [[35.5, 129.4], at('jnpa')], // Ulsan
  [[12.68, 101.15], at('jnpa')], // Map Ta Phut
  [[27.0, 49.66], at('jnpa')], // Jubail
  [[33.1, -8.63], at('jnpa')], // Jorf Lasfar
  [[-32.95, -60.64], at('jnpa')], // Rosario
]
const C = {
  sea: '#0d1828',
  land: '#16263d',
  coast: '#7da2d1',
  grid: 'rgba(125,162,209,0.13)',
  rim: 'rgba(125,162,209,0.55)',
  amber: '#ffb020',
  label: '#ffe3ad',
  dim: '#6a7f9e',
  muted: 'rgba(148,163,184,0.9)',
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const ll = ([lat, lon]) => [lon, lat]

// Camera for each scroll stop: where to look, zoom (1 = whole globe), route progress.
function view(stop) {
  const i = journey.findIndex((p) => p.id === stop)
  if (i >= 0) return { at: journey[i].location, z: 14, step: i }
  if (stop === 'network') return { at: [19, 72], z: 1.6, step: journey.length }
  return { at: INDIA, z: 1, step: -1, spin: true }
}

const land = {}
const loadLand = (res) =>
  (land[res] ??= fetch(`/geo/land-${res}.json`)
    .then((r) => r.json())
    .then((t) => feature(t, t.objects.land)))

// shift: fraction of the canvas width to move the focus left of centre
// (on phones the globe sits half off-screen, so the port has to land in the visible half).
export default function Globe({ stop, shift = 0, className = '' }) {
  const canvas = useRef(null)
  const api = useRef(null)

  useEffect(() => {
    const el = canvas.current
    const ctx = el.getContext('2d')
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const mono = getComputedStyle(document.body).getPropertyValue('--font-mono').trim() || 'monospace'
    const proj = geoOrthographic().clipAngle(90).precision(0.3)
    // Unclipped twin, so arc points lifted above the far side can still be placed.
    const raw = geoOrthographic().clipAngle(null)
    // Sea, grid and coastlines only change when the camera moves: draw them once into `base`, then
    // each frame is one image copy plus the arcs and markers.
    const base = document.createElement('canvas')
    const bctx = base.getContext('2d')
    const bpath = geoPath(proj, bctx)
    let baseKey = ''
    const sphere = { type: 'Sphere' }
    const grid10 = geoGraticule().step([10, 10])()
    const grid1 = geoGraticule().step([1, 1]).extent([[50, 0], [95, 35]])()
    const cam = { lon: INDIA[1], lat: INDIA[0], z: still ? 1 : 0.75, shift: 0 }
    // boost: extra spin speed (°/ms) that decays away; the opening spin uses it to whirl in and settle on India.
    const state = { step: -1, spin: true, alpha: still ? 1 : 0, boost: 0, shift: 0, intro: !still }
    let w = 0, dpr = 1, lo = null, hi = null
    let anim = null, raf = 0, last = 0, drawn = 0, dead = false

    const drawBase = () => {
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bctx.clearRect(0, 0, w, w)
      bctx.beginPath(); bpath(sphere); bctx.fillStyle = C.sea; bctx.fill()
      bctx.beginPath(); bpath(cam.z > 3 ? grid1 : grid10); bctx.strokeStyle = C.grid; bctx.lineWidth = 0.6; bctx.stroke()
      const shape = cam.z > 2.2 && hi ? hi : lo
      if (shape) {
        bctx.beginPath(); bpath(shape)
        bctx.fillStyle = C.land; bctx.fill()
        bctx.strokeStyle = C.coast; bctx.lineWidth = 0.9; bctx.stroke()
      }
      bctx.beginPath(); bpath(sphere); bctx.strokeStyle = C.rim; bctx.lineWidth = 1; bctx.stroke()
    }

    // Great-circle path bowed upward on screen like a bridge, rising with the length of the hop,
    // so routes read as floating above the chart from any camera angle.
    const N = 40
    const arcPoints = (a, b) => {
      const from = ll(a), to = ll(b)
      const along = geoInterpolate(from, to)
      const centre = [cam.lon, cam.lat]
      const [ax, ay] = raw(from), [bx, by] = raw(to)
      const rise = Math.min(Math.hypot(bx - ax, by - ay) * 0.35, w * 0.3)
      const pts = []
      for (let i = 0; i <= N; i++) {
        const s = i / N, p = along(s)
        const [x, y] = raw(p)
        pts.push([x, y - rise * Math.sin(Math.PI * s), geoDistance(p, centre) < Math.PI / 2])
      }
      return pts
    }
    const trace = (pts, i0, i1) => {
      ctx.beginPath()
      let pen = false
      for (let i = i0; i <= i1; i++) {
        const [x, y, on] = pts[i]
        if (!on) { pen = false; continue }
        pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        pen = true
      }
      ctx.stroke()
    }
    const floatArc = (a, b, k, t, faint = false) => {
      const pts = arcPoints(a, b)
      ctx.lineCap = 'round'
      if (faint) {
        ctx.strokeStyle = 'rgba(125,180,230,0.35)'; ctx.lineWidth = 0.9; trace(pts, 0, N)
      } else {
        ctx.strokeStyle = 'rgba(255,176,32,0.16)'; ctx.lineWidth = 5; trace(pts, 0, N)
        ctx.strokeStyle = 'rgba(255,196,90,0.85)'; ctx.lineWidth = 1.3; trace(pts, 0, N)
      }
      if (still) return
      // A light pulse runs along each arc, staggered so they don't move in lockstep.
      const head = Math.floor((((t / 1900) + k * 0.37) % 1) * N)
      ctx.strokeStyle = 'rgba(255,243,214,0.9)'; ctx.lineWidth = 2.2; trace(pts, Math.max(0, head - 6), head)
      const [x, y, on] = pts[head]
      if (on) { ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fillStyle = '#fff3d6'; ctx.fill() }
    }

    const draw = (t = performance.now()) => {
      if (!w) return
      proj.translate([w / 2 - cam.shift * w, w / 2]).scale(w * 0.44 * cam.z).rotate([-cam.lon, -cam.lat])
      raw.translate(proj.translate()).scale(proj.scale()).rotate(proj.rotate())
      const key = [w, dpr, cam.lon, cam.lat, cam.z, cam.shift, lo ? 1 : 0, hi ? 1 : 0].join()
      if (key !== baseKey) { baseKey = key; drawBase() }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, el.width, el.height)
      ctx.globalAlpha = state.alpha
      ctx.drawImage(base, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Route travelled so far, then spokes to the wider network, floating above the chart.
      const { step } = state
      const all = step >= journey.length
      const port = step >= 0 && !all
      // The opening spin shows the whole network so the globe isn't bare before you scroll.
      const intro = state.spin
      let k = 0
      if (intro) LANES.forEach(([a, b]) => floatArc(a, b, k++, t, true))
      const upTo = intro ? journey.length - 1 : Math.min(step, journey.length - 1)
      for (let i = 1; i <= upTo; i++) floatArc(journey[i - 1].location, journey[i].location, k++, t)
      if (all || intro) network.forEach((p) => floatArc(HUB, p.location, k++, t))

      // Markers and labels; labels skip any spot already taken so close ports don't overprint.
      const centre = [cam.lon, cam.lat]
      const taken = []
      const free = (x, y, wd, h) => {
        if (taken.some((r) => x < r[0] + r[2] && x + wd > r[0] && y < r[1] + r[3] && y + h > r[1])) return false
        taken.push([x, y, wd, h])
        return true
      }
      const below = shift > 0 // phones: label under the dot so it stays in the visible half
      const mark = (loc, on, main, name) => {
        if (geoDistance(ll(loc), centre) > Math.PI / 2 - 0.02) return
        const [x, y] = proj(ll(loc))
        ctx.beginPath(); ctx.arc(x, y, main ? 5 : 3, 0, Math.PI * 2); ctx.fillStyle = on ? C.amber : C.dim; ctx.fill()
        if (main) { ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,176,32,0.6)'; ctx.lineWidth = 1; ctx.stroke() }
        if (!name) return
        const big = main ? 12 : 10
        ctx.font = `${main ? 500 : 400} ${big}px ${mono}`
        const text = name.toUpperCase()
        const tw = ctx.measureText(text).width
        const coords = main ? `${loc[0].toFixed(2)}°N ${loc[1].toFixed(2)}°E` : ''
        const bw = Math.max(tw, coords ? tw * 0.85 : 0)
        const bx = below ? x - bw / 2 : x + (main ? 16 : 8)
        const by = below ? y + 16 : y - (main ? 13 : 6)
        if (!free(bx, by, bw, main ? 26 : 12)) return
        ctx.textAlign = below ? 'center' : 'left'
        ctx.textBaseline = 'top'
        const tx = below ? x : bx
        if (main && !below) { ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(bx - 3, y); ctx.strokeStyle = 'rgba(255,227,173,0.6)'; ctx.stroke() }
        // Sea-coloured halo so labels stay readable over coastlines and the route.
        const write = (str, yy, color) => {
          ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = C.sea; ctx.strokeText(str, tx, yy)
          ctx.fillStyle = color; ctx.fillText(str, tx, yy)
        }
        write(text, by, main ? C.label : 'rgba(226,232,240,0.75)')
        if (coords) { ctx.font = `400 10px ${mono}`; write(coords, by + 15, C.muted) }
      }
      if (port) mark(journey[step].location, true, true, journey[step].port)
      journey.forEach((p, k) => k !== step && mark(p.location, k <= step, false, (cam.z > 3 && k < step) || all ? p.port : null))
      network.forEach((p) => mark(p.location, all, false, all ? p.name : null))
      ctx.globalAlpha = 1
    }

    const tick = (t) => {
      raf = 0
      const dt = Math.min(t - (last || t), 64)
      last = t
      let more = false
      if (state.alpha < 1) { state.alpha = Math.min(1, state.alpha + dt / 900); more = true }
      if (anim) {
        const e = Math.min((t - anim.t0) / anim.ms, 1), k = ease(e)
        ;[cam.lon, cam.lat] = anim.rot(k)
        // Zoom in log space, easing out a little between two far-apart close-ups.
        cam.z = Math.exp(Math.log(anim.z0) + (Math.log(anim.z1) - Math.log(anim.z0)) * k - anim.dip * 4 * k * (1 - k))
        cam.shift = anim.s0 + (anim.s1 - anim.s0) * k
        if (e < 1) more = true
        else anim = null
      } else if (state.spin && !still) {
        cam.lon += dt * (0.008 + state.boost)
        state.boost *= Math.exp(-dt / 700)
        const k = 1 - Math.exp(-dt / 400)
        cam.z += (1 - cam.z) * k
        cam.shift += (state.shift - cam.shift) * k
        more = true
      }
      if ((state.step >= 1 || state.spin) && !still) more = true // arcs on screen: keep the pulses moving
      // ponytail: phones redraw at ~30 fps; the chart moves slowly and scrolling gets the rest.
      if (w >= 500 || t - drawn >= 30 || !more) { draw(t); drawn = t }
      if (more && !dead) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(tick) }

    const go = (v, sh) => {
      state.step = v.step
      state.spin = !!v.spin
      state.shift = sh
      // First load: start ~270° east of India and let the decaying boost whirl it round onto India.
      if (state.intro && v.spin) {
        state.intro = false
        cam.lon = INDIA[1] - 270
        state.boost = 270 / 700
        kick()
        return
      }
      state.intro = false
      if (v.z > 2.2 && !hi) loadLand('50m').then((f) => { hi = f; draw() })
      const from = [cam.lon, cam.lat], to = ll(v.at)
      if (still) { cam.lon = to[0]; cam.lat = to[1]; cam.z = v.z; cam.shift = sh; draw(); return }
      anim = { t0: performance.now(), ms: 1600, rot: geoInterpolate(from, to), z0: cam.z, z1: v.z, s0: cam.shift, s1: sh, dip: Math.min(1.6, geoDistance(from, to) * 25) }
      kick()
    }

    const resize = () => {
      w = el.clientWidth
      dpr = Math.min(devicePixelRatio, 2)
      base.width = el.width = Math.round(w * dpr)
      base.height = el.height = Math.round(w * dpr)
      baseKey = ''
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    loadLand('110m').then((f) => { lo = f; draw(); kick() })
    loadLand('50m') // warm the detailed coastline before the first close-up

    api.current = { go }
    return () => {
      dead = true
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [shift])

  useEffect(() => {
    api.current?.go(view(stop), shift)
  }, [stop, shift])

  return <canvas ref={canvas} className={`lens aspect-square w-full ${className}`} aria-hidden="true" />
}
