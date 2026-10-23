'use client'

import { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import { journey, network } from '@/data/site'

const AMBER = [1, 0.69, 0.13]
const DIM = [0.35, 0.45, 0.6]
const INDIA = [20, 76]
const HUB = journey.find((p) => p.id === 'jaigarh').location

// cobe's camera angles for a [lat, lon] facing the viewer.
const toAngles = ([lat, lon]) => [Math.PI - ((lon * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180]

// Where the camera sits for each scroll stop. sway = how far it drifts either side (radians).
function view(stop) {
  const i = journey.findIndex((p) => p.id === stop)
  if (i >= 0) return { at: journey[i].location, scale: 5, step: i, sway: 0.03 }
  if (stop === 'network') return { at: [19, 72], scale: 1.25, step: journey.length, sway: 0.35 }
  return { at: INDIA, scale: 1.05, step: -1, spin: true }
}

// shift: fraction of the canvas width to move the focused spot left of centre
// (on phones the globe sits half off-screen, so the port has to land in the visible half).
export default function Globe({ stop, shift = 0, className = '' }) {
  const canvas = useRef(null)
  const target = useRef(null)
  target.current = { ...view(stop), shift }

  useEffect(() => {
    const el = canvas.current
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const [phi0, theta0] = toAngles(INDIA)
    // Start dark and small, then grow while the dots come up: the "turns digital" moment.
    const cur = { phi: phi0, theta: theta0, scale: still ? 1.05 : 0.7, bright: still ? 1 : 0 }
    let size = el.offsetWidth
    let raf
    let last = 0
    let arcStep = null

    const globe = createGlobe(el, {
      // ponytail: phones get fewer pixels; the dots are big enough that nobody sees the difference.
      devicePixelRatio: Math.min(window.devicePixelRatio, size < 500 ? 1.5 : 2),
      width: size,
      height: size,
      phi: cur.phi,
      theta: cur.theta,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 60000,
      mapBrightness: 0,
      baseColor: [0.16, 0.22, 0.32],
      markerColor: AMBER,
      glowColor: [0.12, 0.2, 0.35],
      arcColor: AMBER,
      arcWidth: 0.6,
      arcHeight: 0.15,
      markerElevation: 0,
      markers: [],
    })
    // cobe rewrites a <style> in <head> every frame for marker labels we don't use, which forces a
    // whole-page style recalc per frame. Detached, those writes cost nothing.
    const cobeStyle = document.head.lastElementChild
    if (cobeStyle?.tagName === 'STYLE' && /^(:root\{\})?$/.test(cobeStyle.textContent)) cobeStyle.remove()

    const onResize = () => {
      size = el.offsetWidth
      globe.update({ width: size, height: size })
    }
    window.addEventListener('resize', onResize)

    const tick = (t) => {
      // ponytail: phones draw the globe at ~30 fps; it moves slowly, and it leaves the CPU for scrolling.
      if (size < 500 && t - last < 30) return (raf = requestAnimationFrame(tick))
      // Ease by elapsed time, not frames, so 30, 60 and 120 Hz all move the same.
      const f = Math.min((t - (last || t)) / 16.7, 4)
      last = t
      const ease = still ? 1 : 1 - Math.pow(0.94, f)
      const { at, scale, step, spin, sway, shift } = target.current
      let [phi, theta] = toAngles(at)
      // Globe radius is ~0.4 of the canvas per unit of scale; rotate so the spot lands `shift` left of centre.
      if (shift) phi -= Math.asin(Math.min(shift / (0.4 * cur.scale), 0.9))
      if (spin) {
        if (!still) cur.phi += 0.002 * f
      } else {
        // Ease to the stop the shortest way round, with a slow drift so the globe never looks frozen.
        const d = phi + (still ? 0 : Math.sin(t / 3000) * sway) - cur.phi
        cur.phi += Math.atan2(Math.sin(d), Math.cos(d)) * ease
      }
      cur.theta += (theta - cur.theta) * ease
      cur.scale += (scale - cur.scale) * ease
      cur.bright += (1 - cur.bright) * (still ? 1 : 1 - Math.pow(0.975, f))

      // Markers scale with the globe, so shrink them as we zoom in.
      const k = 2.2 / Math.max(cur.scale, 1.6)
      const pulse = (0.05 + Math.sin(t / 250) * 0.015) * k
      const all = step >= journey.length
      const markers = [
        ...journey.map((p, i) => ({
          location: p.location,
          size: i === step ? pulse : (i < step ? 0.035 : 0.025) * k,
          color: i <= step ? AMBER : DIM,
        })),
        ...network.map((p) => ({ location: p.location, size: (all ? 0.04 : 0.02) * k, color: all ? AMBER : DIM })),
      ]
      const next = { phi: cur.phi, theta: cur.theta, scale: cur.scale, mapBrightness: 7 * cur.bright, opacity: cur.bright, markers }
      // Arcs trace the route travelled so far; only re-upload them when the stop changes.
      if (step !== arcStep) {
        arcStep = step
        next.arcs = journey.slice(1, step + 1).map((p, i) => ({ from: journey[i].location, to: p.location }))
        if (all) network.forEach((p) => next.arcs.push({ from: HUB, to: p.location }))
      }
      globe.update(next)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      globe.destroy()
    }
  }, [])

  return <canvas ref={canvas} className={`lens aspect-square w-full ${className}`} aria-hidden="true" />
}
