'use client'

import { useEffect, useRef } from 'react'

// Page background: a faint chart grid that drifts with scroll, and a glow that follows the cursor
// (on touch screens, the scroll position) and lights the grid around it.
// Only CSS variables and transforms change, so the browser never repaints the whole page for it.
export default function Backdrop() {
  const box = useRef(null)
  const grid = useRef(null)

  useEffect(() => {
    const root = document.documentElement
    // Variables live on the backdrop only, so a mouse move restyles three layers, not the whole page.
    const vars = box.current.style
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const hover = matchMedia('(hover: hover) and (pointer: fine)').matches
    let raf = 0, mx = innerWidth * 0.7, my = innerHeight * 0.3

    const apply = () => {
      raf = 0
      const y = scrollY
      // ponytail: grid cell is 64px, so moving it by (scroll × 0.15) mod 64 loops seamlessly.
      const gy = (y * 0.15) % 64
      grid.current.style.transform = `translate3d(0, ${-gy}px, 0)`
      vars.setProperty('--gy', `${gy}px`) // keeps the lit patch of grid under the cursor
      if (!hover) {
        // Phones: glow drifts down the right side as you read, near the globe.
        const p = y / Math.max(1, root.scrollHeight - innerHeight)
        mx = innerWidth * 0.8
        my = innerHeight * (0.2 + 0.6 * p)
      }
      vars.setProperty('--mx', `${mx}px`)
      vars.setProperty('--my', `${my}px`)
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply) }
    const move = (e) => { mx = e.clientX; my = e.clientY; queue() }

    apply()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue)
    if (hover) addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', queue)
      removeEventListener('resize', queue)
      removeEventListener('pointermove', move)
    }
  }, [])

  return (
    <div ref={box} className="backdrop" aria-hidden="true">
      <div ref={grid} className="backdrop-grid" />
      <div className="backdrop-glow" />
    </div>
  )
}
