'use client'

import { useEffect, useRef } from 'react'
import { geoOrthographic, geoPath, geoGraticule, geoInterpolate, geoDistance } from 'd3-geo'
import { feature } from 'topojson-client'
import { journey, network } from '@/data/site'

// Navigation-chart globe: vector coastlines, a lat/long grid, labelled ports. Drawn on a 2D canvas
// and only redrawn while something moves, so it costs nothing when parked on a port.

const INDIA = [20, 76]
const HUB = journey.find((p) => p.id === 'jaigarh').location
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
    const path = geoPath(proj, ctx)
    const sphere = { type: 'Sphere' }
    const grid10 = geoGraticule().step([10, 10])()
    const grid1 = geoGraticule().step([1, 1]).extent([[50, 0], [95, 35]])()
    const cam = { lon: INDIA[1], lat: INDIA[0], z: still ? 1 : 0.75, shift: 0 }
    const state = { step: -1, spin: true, alpha: still ? 1 : 0 }
    let w = 0, dpr = 1, lo = null, hi = null
    let anim = null, raf = 0, last = 0, drawn = 0, dead = false

    const draw = () => {
      if (!w) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, w)
      ctx.globalAlpha = state.alpha
      proj.translate([w / 2 - cam.shift * w, w / 2]).scale(w * 0.44 * cam.z).rotate([-cam.lon, -cam.lat])

      ctx.beginPath(); path(sphere); ctx.fillStyle = C.sea; ctx.fill()
      ctx.beginPath(); path(cam.z > 3 ? grid1 : grid10); ctx.strokeStyle = C.grid; ctx.lineWidth = 0.6; ctx.stroke()
      const shape = cam.z > 2.2 && hi ? hi : lo
      if (shape) {
        ctx.beginPath(); path(shape)
        ctx.fillStyle = C.land; ctx.fill()
        ctx.strokeStyle = C.coast; ctx.lineWidth = 0.9; ctx.stroke()
      }
      ctx.beginPath(); path(sphere); ctx.strokeStyle = C.rim; ctx.lineWidth = 1; ctx.stroke()

      // Route travelled so far, then spokes to the wider network.
      const { step } = state
      const all = step >= journey.length
      const port = step >= 0 && !all
      ctx.setLineDash([5, 4]); ctx.strokeStyle = C.amber; ctx.lineWidth = 1.4
      const line = (a, b) => { ctx.beginPath(); path({ type: 'LineString', coordinates: [ll(a), ll(b)] }); ctx.stroke() }
      for (let k = 1; k <= Math.min(step, journey.length - 1); k++) line(journey[k - 1].location, journey[k].location)
      if (all) network.forEach((p) => line(HUB, p.location))
      ctx.setLineDash([])

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
        cam.lon += dt * 0.004
        more = true
      }
      // ponytail: phones redraw at ~30 fps; the chart moves slowly and scrolling gets the rest.
      if (w >= 500 || t - drawn >= 30 || !more) { draw(); drawn = t }
      if (more && !dead) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const kick = () => { if (!raf && !dead) raf = requestAnimationFrame(tick) }

    const go = (v, sh) => {
      state.step = v.step
      state.spin = !!v.spin
      if (v.z > 2.2 && !hi) loadLand('50m').then((f) => { hi = f; draw() })
      const from = [cam.lon, cam.lat], to = ll(v.at)
      if (still) { cam.lon = to[0]; cam.lat = to[1]; cam.z = v.z; cam.shift = sh; draw(); return }
      anim = { t0: performance.now(), ms: 1600, rot: geoInterpolate(from, to), z0: cam.z, z1: v.z, s0: cam.shift, s1: sh, dip: Math.min(1.6, geoDistance(from, to) * 25) }
      kick()
    }

    const resize = () => {
      w = el.clientWidth
      dpr = Math.min(devicePixelRatio, 2)
      el.width = Math.round(w * dpr)
      el.height = Math.round(w * dpr)
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
