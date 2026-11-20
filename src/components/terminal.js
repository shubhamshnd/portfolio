'use client'

// A low-poly bulk and liquid terminal in three.js: anchorage, quay with grab unloaders, stockpiles and tanks,
// gate and weighbridge, control room and offices. Each zone has a hotspot; picking one flies the camera there.
// It's an illustration of where my systems sit, not a model of a real JSW port.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { zones } from '@/data/site'

// Hotspot anchor and camera view for each zone id in site.js.
const SPOTS = {
  anchorage: { at: [-6, 3, -46], cam: [-40, 26, -10], look: [-6, 0, -46] },
  quay: { at: [2, 15, -3], cam: [34, 22, 26], look: [0, 6, -4] },
  yard: { at: [-14, 8, 20], cam: [18, 26, 48], look: [-12, 2, 20] },
  gate: { at: [24, 6, 41], cam: [52, 20, 62], look: [22, 1, 40] },
  control: { at: [-36, 15, 38], cam: [-6, 22, 70], look: [-34, 6, 38] },
  admin: { at: [-18, 10, 41], cam: [8, 20, 72], look: [-18, 4, 40] },
}
const HOME = { cam: [62, 52, 78], look: [0, 0, 6] }

const C = {
  water: 0x0a1626,
  land: 0x172334,
  apron: 0x1d2b40,
  steel: 0x8094ad,
  dark: 0x2a3a52,
  hull: 0x3a4d68,
  accent: 0xffb020,
  coal: 0x2b2f36,
  ore: 0x7a3f2a,
  limestone: 0x8c8676,
  tank: 0x9aa9bb,
  edge: 0x5d7ea8,
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0.05, ...extra })
}

// A box with faint blueprint edges, the look that ties the scene together.
function box(w, h, d, color, edges = true) {
  const g = new THREE.BoxGeometry(w, h, d)
  const m = new THREE.Mesh(g, mat(color))
  if (edges) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.35 }))
    m.add(e)
  }
  return m
}

function at(obj, x, y, z) {
  obj.position.set(x, y, z)
  return obj
}

function bulkCarrier(length = 34) {
  const ship = new THREE.Group()
  ship.add(at(box(length, 4, 8, C.hull), 0, 1.2, 0))
  ship.add(at(box(length * 0.96, 0.6, 7.4, C.dark, false), 0, 3.4, 0))
  const holds = 5
  for (let i = 0; i < holds; i++) ship.add(at(box(length * 0.11, 0.8, 5, C.ore), -length * 0.32 + i * length * 0.14, 4, 0))
  ship.add(at(box(4.5, 5, 7, C.steel), length * 0.42, 5.5, 0))
  ship.add(at(box(1, 2.5, 1, C.accent, false), length * 0.44, 9.2, 0))
  return ship
}

function barge(color = C.dark) {
  const b = new THREE.Group()
  b.add(at(box(10, 1.6, 4, C.hull), 0, 0.6, 0))
  b.add(at(box(8, 1, 3.2, color, false), 0, 1.8, 0))
  b.add(at(box(1.6, 2, 2.4, C.steel), 4.4, 2.2, 0))
  return b
}

// Rail-mounted grab unloader: portal legs on the quay, a boom out over the ship, a trolley and grab that work.
function unloader() {
  const g = new THREE.Group()
  for (const x of [-2.2, 2.2]) for (const z of [1, 7]) g.add(at(box(0.7, 12, 0.7, C.steel), x, 6, z))
  g.add(at(box(5.4, 1.4, 7.4, C.dark), 0, 12.6, 4))
  g.add(at(box(3, 3, 3, C.accent), 0, 14.6, 5.5))
  const boom = at(box(1.4, 1, 24, C.steel), 0, 13.6, -6)
  g.add(boom)
  const trolley = at(box(2, 1, 2, C.dark), 0, 12.8, -8)
  const rope = at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 4), mat(C.steel)), 0, 0, 0)
  const grab = at(box(1.6, 1.2, 1.6, C.accent, false), 0, 0, 0)
  g.add(trolley, rope, grab)
  g.userData = { trolley, rope, grab }
  return g
}

function stockpile(r, h, color) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), mat(color))
  m.scale.z = 0.6
  return m
}

function truck() {
  const t = new THREE.Group()
  t.add(at(box(1.6, 1.4, 1.8, C.accent, false), 1.6, 0.9, 0))
  t.add(at(box(3, 1.6, 1.9, C.steel, false), -0.8, 1, 0))
  return t
}

function building(w, h, d, windows) {
  const b = box(w, h, d, C.dark)
  if (windows) {
    const rows = Math.max(1, Math.floor(h / 2.2))
    for (let r = 0; r < rows; r++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.82, 0.5, d + 0.05), new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.55 }))
      strip.position.y = -h / 2 + 1.4 + r * 2.2
      b.add(strip)
    }
  }
  return b
}

function build(scene) {
  const anim = { unloaders: [], barges: [], trucks: [] }

  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(C.water, { roughness: 0.35, metalness: 0.2 }))
  water.rotation.x = -Math.PI / 2
  scene.add(water)
  const grid = new THREE.GridHelper(400, 100, C.edge, C.edge)
  grid.material.transparent = true
  grid.material.opacity = 0.07
  grid.position.y = 0.02
  scene.add(grid)

  // Land and the quay apron, with an amber quay edge.
  scene.add(at(box(110, 1.4, 60, C.land, false), 0, 0.7, 30))
  scene.add(at(box(80, 0.2, 9, C.apron, false), 0, 1.5, 4.5))
  scene.add(at(box(80, 0.25, 0.3, C.accent, false), 0, 1.55, 0.15))

  // Ship at berth and the unloaders working it.
  scene.add(at(bulkCarrier(), 0, 0, -6))
  for (const [x, phase] of [[-9, 0], [7, 2.4]]) {
    const u = at(unloader(), x, 1.4, 0)
    u.userData.phase = phase
    scene.add(u)
    anim.unloaders.push(u)
  }

  // Conveyor from the quay to the stockyard, and a rake siding.
  const conveyor = at(box(1.2, 0.8, 22, C.steel), -2, 3.2, 14)
  scene.add(conveyor)
  scene.add(at(box(0.3, 3, 0.3, C.steel, false), -2, 1.8, 8), at(box(0.3, 3, 0.3, C.steel, false), -2, 1.8, 20))
  for (let i = 0; i < 7; i++) scene.add(at(box(4.2, 1.4, 1.6, C.hull), -40 + i * 4.6, 2.1, 30))

  // Stockpiles: coal, iron ore, limestone.
  ;[
    [-26, 18, 6, 6, C.coal],
    [-14, 18, 6, 7, C.ore],
    [-2, 22, 5, 5, C.limestone],
    [-30, 25, 5, 5, C.ore],
    [-18, 25, 5.5, 6, C.coal],
  ].forEach(([x, z, r, h, c]) => scene.add(at(stockpile(r, h, c), x, 1.4 + h / 2, z)))

  // Liquid terminal tanks.
  for (const [x, z] of [[18, 14], [26, 14], [34, 14], [22, 22], [30, 22]]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5, 14), mat(C.tank))
    t.position.set(x, 3.9, z)
    t.add(new THREE.LineSegments(new THREE.EdgesGeometry(t.geometry, 30), new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.3 })))
    scene.add(t)
  }

  // Gate: canopy, barrier and the weighbridge plate.
  scene.add(at(box(0.8, 5, 0.8, C.steel), 18, 4, 40), at(box(0.8, 5, 0.8, C.steel), 28, 4, 40), at(box(12, 0.6, 5, C.dark), 23, 6.6, 40))
  scene.add(at(box(6, 0.15, 3, C.accent, false), 23, 1.5, 34))
  scene.add(at(box(14, 0.08, 4, C.apron, false), 23, 1.45, 47))

  // Control room tower and offices.
  scene.add(at(building(8, 14, 8, true), -36, 8.4, 38))
  scene.add(at(building(14, 8, 8, true), -18, 5.4, 41))

  // Trucks loop from the gate, over the weighbridge, to the stockyard and back.
  const road = new THREE.CatmullRomCurve3(
    [[23, 52], [23, 40], [23, 34], [14, 30], [0, 31], [-10, 33], [-6, 38], [8, 37], [23, 44]].map(([x, z]) => new THREE.Vector3(x, 1.5, z)),
    true,
  )
  const roadLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(road.getPoints(120)), new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0.25 }))
  scene.add(roadLine)
  for (let i = 0; i < 4; i++) {
    const t = truck()
    t.userData = { road, u: i / 4 }
    scene.add(t)
    anim.trucks.push(t)
  }

  // Anchorage: an MBC offshore and barges shuttling to the berth.
  scene.add(at(bulkCarrier(40), -30, 0, -78))
  for (let i = 0; i < 3; i++) {
    const b = barge(i % 2 ? C.coal : C.ore)
    b.userData = { u: i / 3 }
    scene.add(b)
    anim.barges.push(b)
  }
  return anim
}

function step(anim, t, dt) {
  for (const u of anim.unloaders) {
    const { trolley, rope, grab } = u.userData
    const p = (Math.sin(t * 0.6 + u.userData.phase) + 1) / 2 // 0 over the hold, 1 over the hopper
    const z = -10 + p * 13
    const drop = Math.max(0, Math.sin(t * 1.2 + u.userData.phase)) * 6
    trolley.position.z = z
    const gy = 11.6 - drop - (1 - p) * 3
    grab.position.set(0, gy, z)
    rope.position.set(0, (12.4 + gy) / 2, z)
    rope.scale.y = Math.max(0.2, 12.4 - gy)
  }
  // Barges run a loop between the MBC and the berth's west end.
  for (const b of anim.barges) {
    b.userData.u = (b.userData.u + dt * 0.012) % 1
    const a = b.userData.u * Math.PI * 2
    b.position.set(-22 + Math.cos(a) * 20, 0.2, -40 + Math.sin(a) * 26)
    b.rotation.y = -a
  }
  for (const k of anim.trucks) {
    k.userData.u = (k.userData.u + dt * 0.03) % 1
    const p = k.userData.road.getPointAt(k.userData.u)
    const tan = k.userData.road.getTangentAt(k.userData.u)
    k.position.copy(p)
    k.rotation.y = Math.atan2(-tan.z, tan.x)
  }
}

export default function Terminal({ active, onSelect }) {
  const wrap = useRef(null)
  const labels = useRef({})
  const api = useRef(null)

  useEffect(() => {
    const el = wrap.current
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = matchMedia('(pointer: coarse)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    el.prepend(renderer.domElement)
    renderer.domElement.className = 'absolute inset-0 h-full w-full'

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b111c, 90, 230)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 500)
    camera.position.set(...HOME.cam)

    scene.add(new THREE.HemisphereLight(0x9fb8d8, 0x0b111c, 1.1))
    const sun = new THREE.DirectionalLight(0xffd59a, 1.6)
    sun.position.set(40, 60, 20)
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0x4a78c0, 0.5)
    fill.position.set(-50, 20, -40)
    scene.add(fill)

    const anim = build(scene)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(...HOME.look)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false // the wheel scrolls the page
    controls.enableRotate = !coarse // on phones a drag scrolls the page; the zone buttons move the camera
    controls.minPolarAngle = 0.35
    controls.maxPolarAngle = 1.2
    controls.autoRotate = !still
    controls.autoRotateSpeed = 0.35
    if (coarse) renderer.domElement.style.touchAction = 'pan-y'

    // Camera flight: ease position and target toward a goal; a drag cancels it.
    let goal = null
    const fly = (id) => {
      const s = SPOTS[id] ?? HOME
      goal = { cam: new THREE.Vector3(...s.cam), look: new THREE.Vector3(...s.look) }
      controls.autoRotate = !still && !SPOTS[id]
      if (still) {
        camera.position.copy(goal.cam)
        controls.target.copy(goal.look)
        goal = null
      }
    }
    controls.addEventListener('start', () => (goal = null))
    api.current = { fly }

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // Pull back on narrow screens so the whole terminal fits.
      camera.fov = w < 640 ? 52 : 38
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)

    const v = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return clock.getDelta()
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!still) step(anim, clock.elapsedTime, dt)
      if (goal) {
        const k = 1 - Math.exp(-3 * dt)
        camera.position.lerp(goal.cam, k)
        controls.target.lerp(goal.look, k)
        if (camera.position.distanceTo(goal.cam) < 0.1) goal = null
      }
      controls.update()
      renderer.render(scene, camera)
      // Hotspot labels follow their anchors on screen.
      const { clientWidth: w, clientHeight: h } = el
      for (const [id, s] of Object.entries(SPOTS)) {
        const node = labels.current[id]
        if (!node) continue
        v.set(...s.at).project(camera)
        const off = v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05
        node.style.opacity = off ? '0' : '1'
        node.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`
      }
    }
    if (still) step(anim, 1, 0)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        o.geometry?.dispose()
        o.material?.dispose?.()
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  useEffect(() => {
    api.current?.fly(active)
  }, [active])

  return (
    <div ref={wrap} className="absolute inset-0 overflow-hidden">
      {/* Hotspots duplicate the zone buttons below the scene, so they're hidden from assistive tech. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {zones.map((z, i) => (
          <button
            key={z.id}
            tabIndex={-1}
            ref={(n) => (labels.current[z.id] = n)}
            onClick={() => onSelect(active === z.id ? null : z.id)}
            className="group pointer-events-auto absolute left-0 top-0 flex items-center gap-2 transition-opacity duration-300"
          >
            <span className={`relative grid h-7 w-7 place-items-center rounded-full border font-mono text-xs ${active === z.id ? 'border-accent bg-accent text-bg' : 'border-accent/70 bg-bg/80 text-accent'}`}>
              {i + 1}
              {active !== z.id && <span className="ping absolute inset-0 rounded-full border border-accent" />}
            </span>
            <span className={`whitespace-nowrap rounded bg-bg/85 px-2 py-1 text-xs text-head max-sm:hidden ${active === z.id ? '' : 'opacity-0 group-hover:opacity-100'}`}>
              {z.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
