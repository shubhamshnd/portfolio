'use client'

// A low-poly bulk and liquid terminal in three.js: anchorage, quay with grab unloaders, stockyard with a
// stacker-reclaimer, rail siding, tank farm and jetty, gate and weighbridge, control room and offices.
// Each zone has a hotspot; picking one flies the camera there. It illustrates where my systems sit,
// it isn't a model of a real JSW port.
//
// Everything that doesn't move is merged into one mesh per material, so the scene stays at a few dozen
// draw calls however much detail it has.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { zones } from '@/data/site'

// Hotspot anchor and camera view for each zone id in site.js.
const SPOTS = {
  anchorage: { at: [-22, 6, -46], cam: [-58, 30, -8], look: [-22, 0, -46] },
  quay: { at: [-1, 21, -2], cam: [36, 24, 28], look: [0, 8, -4] },
  liquid: { at: [30, 10, 14], cam: [64, 26, 38], look: [28, 2, 6] },
  yard: { at: [-20, 10, 21], cam: [16, 28, 52], look: [-18, 2, 22] },
  gate: { at: [23, 10, 40], cam: [54, 20, 64], look: [22, 1, 40] },
  control: { at: [-38, 20, 40], cam: [-8, 24, 74], look: [-34, 6, 40] },
  admin: { at: [-18, 12, 43], cam: [10, 20, 76], look: [-18, 4, 42] },
}
const HOME = { cam: [64, 54, 82], look: [0, 0, 8] }

const V = THREE.Vector3
const BOX = new THREE.BoxGeometry(1, 1, 1)
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 8)

function std(color, roughness = 0.8, metalness = 0.05, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, ...extra })
}

function materials() {
  return {
    land: std(0x1c2839, 0.95),
    apron: std(0x283850, 0.9),
    asphalt: std(0x141b26, 0.95),
    marking: std(0xdfe6ee, 0.6),
    accent: std(0xffb020, 0.45, 0.25),
    steel: std(0xa3b3c6, 0.45, 0.65),
    dark: std(0x2c3c53, 0.7, 0.3),
    hull: std(0x22344f, 0.55, 0.25),
    red: std(0x8f2d24, 0.7),
    white: std(0xc9d2dc, 0.6),
    roof: std(0x5d6b7e, 0.8, 0.2),
    hatch: std(0x3f6b5c, 0.6, 0.2),
    coal: std(0x23262b, 1),
    ore: std(0x7d3f29, 1),
    lime: std(0x9b9483, 1),
    tank: std(0xa9b6c4, 0.45, 0.5),
    rubber: std(0x12161c, 0.95),
    glass: new THREE.MeshStandardMaterial({ color: 0x15263a, emissive: 0xffb020, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.4 }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xffd98a }),
  }
}

// Collects static parts per material, then merges each material into a single mesh.
class Static {
  parts = new Map()

  add(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone()
    const q = r instanceof THREE.Quaternion ? r : new THREE.Quaternion().setFromEuler(new THREE.Euler(...r))
    g.applyMatrix4(new THREE.Matrix4().compose(new V(...p), q, new V(...s)))
    if (!this.parts.has(mat)) this.parts.set(mat, [])
    this.parts.get(mat).push(g)
  }

  box(w, h, d, mat, p, r) {
    this.add(BOX, mat, p, r, [w, h, d])
  }

  // A strut from a to b, square (box) or round (cylinder).
  beam(a, b, t, mat, round = false) {
    const A = new V(...a)
    const B = new V(...b)
    const dir = B.clone().sub(A)
    const len = dir.length()
    const q = new THREE.Quaternion().setFromUnitVectors(new V(0, 1, 0), dir.normalize())
    this.add(round ? CYL : BOX, mat, A.add(B).multiplyScalar(0.5).toArray(), q, [t, len, t])
  }

  build(scene) {
    for (const [mat, list] of this.parts) {
      const mesh = new THREE.Mesh(mergeGeometries(list), mat)
      mesh.castShadow = mat !== scene.userData.noShadow
      mesh.receiveShadow = true
      scene.add(mesh)
      list.forEach((g) => g.dispose())
    }
  }
}

// A lattice girder along z between z0 and z1, centred on (x, y).
function truss(S, x, y, z0, z1, h, w, mat) {
  const ys = [y - h / 2, y + h / 2]
  const xs = [x - w / 2, x + w / 2]
  for (const xx of xs) for (const yy of ys) S.beam([xx, yy, z0], [xx, yy, z1], 0.24, mat)
  const n = Math.max(2, Math.round(Math.abs(z1 - z0) / 1.6))
  const dz = (z1 - z0) / n
  for (let i = 0; i < n; i++) {
    const za = z0 + i * dz
    const zb = za + dz
    for (const xx of xs) S.beam([xx, ys[i % 2], za], [xx, ys[(i + 1) % 2], zb], 0.12, mat)
    S.beam([xs[0], ys[1], za], [xs[1], ys[1], za], 0.1, mat)
    S.beam([xs[0], ys[0], za], [xs[1], ys[0], za], 0.1, mat)
  }
}

// Ship hull seen from above: square stern at -x, rounded bow at +x. Extruded upward from y = 0.
function hullGeo(L, W, H, bow) {
  const h = W / 2
  const s = new THREE.Shape()
  s.moveTo(-L / 2, -h * 0.85)
  s.quadraticCurveTo(-L / 2, -h, -L / 2 + 1, -h)
  s.lineTo(L / 2 - bow, -h)
  s.quadraticCurveTo(L / 2, -h * 0.55, L / 2, 0)
  s.quadraticCurveTo(L / 2, h * 0.55, L / 2 - bow, h)
  s.lineTo(-L / 2 + 1, h)
  s.quadraticCurveTo(-L / 2, h, -L / 2, h * 0.85)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false, curveSegments: 6 })
  g.rotateX(-Math.PI / 2)
  return g
}

// A stockpile ridge along x: a triangular prism with a cone at each end.
function stockpile(S, x, z, len, r, h, mat) {
  const tri = new THREE.Shape()
  tri.moveTo(-r, 0)
  tri.lineTo(r, 0)
  tri.lineTo(0, h)
  tri.closePath()
  const g = new THREE.ExtrudeGeometry(tri, { depth: len, bevelEnabled: false })
  g.rotateY(Math.PI / 2)
  S.add(g, mat, [x - len / 2, 1.4, z])
  const cone = new THREE.ConeGeometry(r, h, 7)
  for (const end of [-1, 1]) S.add(cone, mat, [x + (end * len) / 2, 1.4 + h / 2, z], [0, 0, 0], [0.85, 1, 1])
}

function bulkCarrier(S, M, cx, cz, L, W) {
  S.add(hullGeo(L, W, 1.8, 5), M.red, [cx, -1.2, cz])
  S.add(hullGeo(L, W, 3.2, 5), M.hull, [cx, 0.6, cz])
  S.box(L - 8, 0.25, W * 0.9, M.dark, [cx - 2, 3.9, cz])
  const holds = 5
  const span = L - 14
  for (let i = 0; i < holds; i++) {
    const hx = cx - L / 2 + 8 + (i + 0.5) * (span / holds)
    S.box(span / holds - 1.4, 0.9, W * 0.62, M.hatch, [hx, 4.4, cz])
    // Deck cranes between holds.
    if (i < holds - 1) {
      const kx = hx + span / holds / 2
      S.add(CYL, M.white, [kx, 5.4, cz + W * 0.32], [0, 0, 0], [0.9, 3, 0.9])
      S.beam([kx, 6.6, cz + W * 0.32], [kx + 4, 9.5, cz - W * 0.1], 0.35, M.white)
    }
  }
  // Accommodation aft, with lit windows, bridge wings and funnel.
  const ax = cx - L / 2 + 3.6
  S.box(5, 6.4, W * 0.8, M.white, [ax, 7.1, cz])
  for (let f = 0; f < 3; f++) S.box(5.05, 0.45, W * 0.81, M.glass, [ax, 5.4 + f * 1.9, cz])
  S.box(2.4, 1, W + 1.2, M.white, [ax + 1, 10.6, cz])
  S.box(2.42, 0.4, W + 1.22, M.glass, [ax + 1, 10.6, cz])
  S.box(1.8, 3, 2, M.dark, [ax - 1.6, 11.6, cz])
  S.box(1.85, 0.6, 2.05, M.red, [ax - 1.6, 12.6, cz])
  S.box(3, 1, W * 0.6, M.hull, [cx + L / 2 - 4, 4.3, cz])
}

function tanker(S, M, cx, cz, L, W) {
  S.add(hullGeo(L, W, 1.4, 3), M.red, [cx, -1, cz])
  S.add(hullGeo(L, W, 2.4, 3), M.hull, [cx, 0.4, cz])
  S.box(L - 5, 0.2, W * 0.86, M.dark, [cx - 1, 2.9, cz])
  // Cargo line along the deck and a manifold midships.
  S.add(CYL, M.accent, [cx, 3.3, cz + 0.6], [0, 0, Math.PI / 2], [0.35, L - 6, 0.35])
  S.add(CYL, M.steel, [cx, 3.3, cz - 0.6], [0, 0, Math.PI / 2], [0.3, L - 6, 0.3])
  for (const dz of [-1.6, -0.6, 0.6, 1.6]) S.add(CYL, M.steel, [cx + 1, 3.8, cz + dz], [0, 0, 0], [0.3, 1.6, 0.3])
  S.box(3, 0.3, W * 0.9, M.steel, [cx + 1, 4.5, cz])
  const ax = cx - L / 2 + 2.6
  S.box(3.6, 4.6, W * 0.8, M.white, [ax, 5.2, cz])
  for (let f = 0; f < 2; f++) S.box(3.65, 0.4, W * 0.81, M.glass, [ax, 4.2 + f * 1.8, cz])
  S.box(1.2, 2.2, 1.4, M.dark, [ax - 1.2, 8.4, cz])
}

// Grab ship unloader on quay rails at x0. Returns the moving trolley, rope and grab.
function unloader(S, M, x0) {
  const top = 13.5
  for (const dx of [-2.4, 2.4])
    for (const z of [1, 7]) {
      S.box(0.8, top - 1.5, 0.8, M.accent, [x0 + dx, (top + 1.5) / 2, z])
      S.box(1.6, 0.7, 1.4, M.dark, [x0 + dx, 1.9, z])
    }
  for (const z of [1, 7]) S.box(5.6, 1, 0.9, M.accent, [x0, top, z])
  for (const dx of [-2.4, 2.4]) S.box(0.9, 1, 7, M.accent, [x0 + dx, top, 4])
  S.beam([x0 - 2.4, 4, 1], [x0 - 2.4, top - 1, 7], 0.3, M.accent)
  S.beam([x0 + 2.4, 4, 1], [x0 + 2.4, top - 1, 7], 0.3, M.accent)
  truss(S, x0, 15, -15, 10, 1.4, 1.7, M.steel)
  S.box(5.4, 3, 4.6, M.accent, [x0, 15.6, 7])
  S.box(5.45, 0.4, 4.65, M.dark, [x0, 17.2, 7])
  // A-frame and tie rods to the boom.
  const apex = [x0, 23.5, 4]
  for (const dx of [-2, 2]) {
    S.beam([x0 + dx, 15.6, 2.5], apex, 0.35, M.accent)
    S.beam([x0 + dx, 15.6, 8.5], apex, 0.35, M.accent)
  }
  S.beam(apex, [x0, 15.7, -15], 0.12, M.steel, true)
  S.beam(apex, [x0, 15.7, -6], 0.12, M.steel, true)
  S.box(1.7, 1.5, 1.8, M.glass, [x0 + 1.3, 13.3, -1])
  // Hopper on the landside.
  S.box(4, 3, 3.6, M.dark, [x0, 3.5, 4])
  S.add(new THREE.CylinderGeometry(2.6, 1.6, 2, 4), M.steel, [x0, 6, 4], [0, Math.PI / 4, 0])

  const trolley = new THREE.Mesh(BOX, M.dark)
  trolley.scale.set(2.3, 1, 2.3)
  const rope = new THREE.Mesh(CYL, M.steel)
  rope.scale.set(0.12, 1, 0.12)
  const grab = new THREE.Group()
  const shell = new THREE.Mesh(new THREE.ConeGeometry(1, 1.4, 6), M.accent)
  shell.rotation.x = Math.PI
  grab.add(shell)
  for (const m of [trolley, rope, shell]) m.castShadow = true
  return { x0, trolley, rope, grab }
}

function bargeMesh(M, cargo) {
  const g = new THREE.Group()
  const hull = new THREE.Mesh(hullGeo(11, 4, 1.6, 1.6), M.hull)
  hull.position.y = -0.6
  const heap = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.4, 6), cargo)
  heap.scale.set(2.6, 1, 1)
  heap.position.set(-0.6, 1.6, 0)
  const house = new THREE.Mesh(BOX, M.white)
  house.scale.set(1.6, 1.6, 2.6)
  house.position.set(4.2, 1.8, 0)
  g.add(hull, heap, house)
  g.traverse((o) => o.isMesh && (o.castShadow = true))
  return g
}

function tugMesh(M) {
  const g = new THREE.Group()
  const hull = new THREE.Mesh(hullGeo(5.5, 2.4, 1.4, 1.2), M.red)
  hull.position.y = -0.5
  const deck = new THREE.Mesh(hullGeo(5.5, 2.4, 0.5, 1.2), M.hull)
  deck.position.y = 0.9
  const cabin = new THREE.Mesh(BOX, M.white)
  cabin.scale.set(1.8, 1.4, 1.6)
  cabin.position.set(0.4, 2, 0)
  const win = new THREE.Mesh(BOX, M.glass)
  win.scale.set(1.85, 0.4, 1.65)
  win.position.set(0.4, 2.3, 0)
  g.add(hull, deck, cabin, win)
  g.traverse((o) => o.isMesh && (o.castShadow = true))
  return g
}

function truckMesh(M) {
  const t = new THREE.Group()
  const add = (geo, mat, s, p, r = [0, 0, 0]) => {
    const m = new THREE.Mesh(geo, mat)
    m.scale.set(...s)
    m.position.set(...p)
    m.rotation.set(...r)
    m.castShadow = true
    t.add(m)
  }
  add(BOX, M.accent, [1.4, 1.5, 1.9], [1.7, 1.25, 0])
  add(BOX, M.glass, [0.1, 0.6, 1.7], [2.42, 1.55, 0])
  add(BOX, M.dark, [5, 0.35, 1.6], [0, 0.55, 0])
  add(BOX, M.steel, [3.1, 1.4, 1.95], [-0.8, 1.45, 0])
  for (const x of [1.7, -0.3, -1.6]) for (const z of [-0.85, 0.85]) add(CYL, M.rubber, [0.75, 0.4, 0.75], [x, 0.38, z], [Math.PI / 2, 0, 0])
  return t
}

function stackerMesh(M) {
  const g = new THREE.Group()
  const add = (geo, mat, s, p, r = [0, 0, 0], parent = g) => {
    const m = new THREE.Mesh(geo, mat)
    m.scale.set(...s)
    m.position.set(...p)
    m.rotation.set(...r)
    m.castShadow = true
    parent.add(m)
    return m
  }
  add(BOX, M.dark, [4, 1.2, 3.2], [0, 2.2, 0])
  add(BOX, M.accent, [2.4, 3.4, 2.4], [0, 4.4, 0])
  const slew = new THREE.Group()
  slew.position.y = 6.2
  g.add(slew)
  add(BOX, M.steel, [0.9, 0.9, 13], [0, 0.9, -6], [-0.12, 0, 0], slew)
  add(BOX, M.dark, [2, 1.6, 2.4], [0, 0.2, 2.6], [0, 0, 0], slew)
  add(new THREE.CylinderGeometry(1.4, 1.4, 0.6, 10), M.accent, [1, 1, 1], [0, -0.1, -12.4], [0, 0, Math.PI / 2], slew)
  g.userData.slew = slew
  return g
}

// Animated water: gentle swell computed in the vertex shader, normals to match.
function water(M, segments, time) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0c1c30, roughness: 0.4, metalness: 0.1, envMapIntensity: 0.12 })
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <beginnormal_vertex>',
        `float ax = position.x * 0.12 + uTime * 0.8;
        float ay = position.y * 0.19 + uTime * 1.1;
        vec3 objectNormal = normalize(vec3(-cos(ax) * 0.03, -cos(ay) * 0.034, 1.0));`,
      )
      .replace('#include <begin_vertex>', 'vec3 transformed = position; transformed.z += sin(ax) * 0.25 + sin(ay) * 0.18;')
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(420, 420, segments, segments), mat)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.1
  mesh.receiveShadow = true
  return mesh
}

function build(scene, coarse, time) {
  const M = materials()
  scene.userData.noShadow = M.lamp
  const S = new Static()
  const anim = { unloaders: [], barges: [], trucks: [], tugs: [] }

  scene.add(water(M, coarse ? 80 : 160, time))
  const grid = new THREE.GridHelper(420, 105, 0x5d7ea8, 0x5d7ea8)
  grid.material.transparent = true
  grid.material.opacity = 0.05
  grid.position.y = 0.3
  scene.add(grid)

  // Land, quay apron, quay edge, fenders, bollards, crane rails and markings.
  S.box(112, 1.4, 62, M.land, [0, 0.7, 31])
  S.box(84, 0.12, 10, M.apron, [0, 1.46, 5])
  S.box(84, 0.2, 0.35, M.accent, [0, 1.55, 0.2])
  for (let x = -40; x <= 40; x += 4) {
    S.box(0.7, 1.2, 0.5, M.rubber, [x, 0.9, -0.2])
    S.add(CYL, M.dark, [x + 2, 1.75, 0.8], [0, 0, 0], [0.45, 0.5, 0.45])
  }
  for (const z of [1, 7]) S.box(84, 0.12, 0.25, M.steel, [0, 1.56, z])
  for (let x = -38; x <= 38; x += 3) S.box(1.6, 0.03, 0.18, M.marking, [x, 1.53, 9.6])

  // Ship at berth and the unloaders working it.
  bulkCarrier(S, M, 0, -6.4, 36, 8)
  for (const [x, phase] of [[-8, 0], [8, 2.4]]) {
    const u = unloader(S, M, x)
    u.phase = phase
    scene.add(u.trolley, u.rope, u.grab)
    anim.unloaders.push(u)
  }

  // Conveyors: quay belt, up to the yard, and along the stacker rail.
  S.box(22, 0.7, 1.1, M.steel, [-1, 2.6, 8.6])
  S.box(1.1, 0.7, 13, M.steel, [-12, 2.6, 15])
  S.box(36, 0.6, 1, M.steel, [-24, 2.2, 21.6])
  for (const [x, z] of [[-12, 10], [-12, 15], [-12, 20], [8, 8.6], [-1, 8.6]]) S.box(0.3, 1.2, 0.3, M.dark, [x, 1.9, z])
  for (const z of [20.4, 22.6]) S.box(38, 0.12, 0.2, M.steel, [-24, 1.48, z])

  // Stockyard: two rows of ridged piles either side of the stacker-reclaimer.
  ;[
    [-34, 15, 10, 4, 4.5, M.coal],
    [-20, 15, 12, 4.2, 5, M.ore],
    [-7, 15, 6, 3.4, 3.6, M.lime],
    [-34, 28, 12, 4, 4.8, M.ore],
    [-19, 28, 10, 4, 4.4, M.coal],
  ].forEach(([x, z, len, r, h, m]) => stockpile(S, x, z, len, r, h, m))
  const stacker = stackerMesh(M)
  scene.add(stacker)

  // Rail siding with a rake being loaded.
  for (const z of [33, 34.4]) S.box(48, 0.12, 0.2, M.steel, [-26, 1.48, z])
  S.box(4.6, 2.4, 2.2, M.accent, [-2.6, 2.7, 33.7])
  S.box(1.6, 0.6, 2.25, M.glass, [-1, 3.6, 33.7])
  for (let i = 0; i < 9; i++) {
    const x = -8 - i * 4.4
    S.box(4, 1.8, 2.2, M.hull, [x, 2.5, 33.7])
    S.box(3.6, 0.5, 1.8, i % 3 ? M.coal : M.ore, [x, 3.5, 33.7])
  }

  // Liquid jetty: tanker alongside, loading arms, pipe rack to the tank farm.
  tanker(S, M, 30, -4.6, 18, 5)
  for (const x of [28.6, 31.4]) {
    S.box(0.6, 6, 0.6, M.steel, [x, 4.5, 1.2])
    S.beam([x, 7.4, 1.2], [x, 6, -1.6], 0.35, M.accent)
    S.beam([x, 6, -1.6], [x - 1.4, 3.8, -2.6], 0.3, M.accent)
  }
  for (const dx of [-0.5, 0, 0.5]) S.add(CYL, dx ? M.steel : M.accent, [30 + dx, 3.4, 6.5], [Math.PI / 2, 0, 0], [0.35, 11, 0.35])
  for (let z = 2; z <= 11; z += 3) S.box(2, 1.8, 0.3, M.dark, [30, 2.4, z])
  for (const dx of [-0.5, 0, 0.5]) S.add(CYL, M.steel, [24 + dx, 3.4, 12], [0, 0, Math.PI / 2], [0.3, 12, 0.3])

  // Tank farm inside a bund wall.
  S.box(26, 1, 0.5, M.dark, [26, 1.9, 9.5])
  S.box(26, 1, 0.5, M.dark, [26, 1.9, 27.5])
  S.box(0.5, 1, 18, M.dark, [13, 1.9, 18.5])
  S.box(0.5, 1, 18, M.dark, [39, 1.9, 18.5])
  const tankGeo = new THREE.CylinderGeometry(3, 3, 5.5, 20)
  const dome = new THREE.SphereGeometry(3, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  const band = new THREE.CylinderGeometry(3.06, 3.06, 0.25, 20)
  for (const [x, z] of [[18, 14.5], [26, 14.5], [34, 14.5], [22, 22.5], [30, 22.5]]) {
    S.add(tankGeo, M.tank, [x, 4.15, z])
    S.add(dome, M.tank, [x, 6.9, z], [0, 0, 0], [1, 0.28, 1])
    S.add(band, M.accent, [x, 5.6, z])
    S.add(band, M.dark, [x, 3, z])
  }

  // Gate: canopy over four lanes, booths, barriers, weighbridge and the road loop.
  S.box(14, 0.5, 6, M.dark, [23, 7.4, 40])
  S.box(14.05, 0.18, 6.05, M.accent, [23, 7.1, 40])
  for (const x of [16.5, 20.2, 23.8, 27.5]) S.box(0.6, 5.7, 0.6, M.steel, [x, 4.3, 40])
  for (const x of [18.4, 25.6]) {
    S.box(1.4, 2.4, 1.6, M.white, [x, 2.6, 42])
    S.box(1.45, 0.6, 1.65, M.glass, [x, 3, 42])
  }
  for (const x of [17.4, 21, 24.6, 28.2]) S.box(0.12, 0.12, 3, M.accent, [x, 2.4, 38.2], [0, 0, 0])
  S.box(6, 0.18, 3.2, M.steel, [14, 1.5, 32])
  S.box(6.1, 0.06, 3.3, M.accent, [14, 1.55, 32])
  const road = new THREE.CatmullRomCurve3(
    [[23, 54], [23, 42], [22, 34], [14, 32], [2, 31], [-4, 26], [-2, 20], [6, 18], [10, 24], [12, 30], [23, 46]].map(([x, z]) => new V(x, 1.42, z)),
    true,
  )
  S.add(new THREE.TubeGeometry(road, 160, 1.6, 4, true), M.asphalt, [0, 0, 0], [0, 0, 0], [1, 0.04, 1])
  for (let i = 0; i < 5; i++) {
    const t = truckMesh(M)
    t.userData = { road, u: i / 5 }
    scene.add(t)
    anim.trucks.push(t)
  }

  // Control tower, offices and a warehouse.
  S.box(8, 13, 8, M.dark, [-38, 7.9, 40])
  S.box(9.4, 2.8, 9.4, M.glass, [-38, 15.8, 40])
  S.box(10, 0.6, 10, M.roof, [-38, 17.5, 40])
  S.beam([-38, 17.8, 40], [-38, 22, 40], 0.18, M.steel, true)
  S.box(15, 8, 8, M.dark, [-18, 5.4, 43])
  for (let r = 0; r < 3; r++) S.box(13.6, 0.55, 8.06, M.glass, [-18, 3 + r * 2.2, 43])
  S.box(15.4, 0.4, 8.4, M.roof, [-18, 9.6, 43])
  S.box(12, 4.5, 9, M.steel, [2, 3.6, 44])
  const roof = new THREE.Shape()
  roof.moveTo(-4.7, 0)
  roof.lineTo(4.7, 0)
  roof.lineTo(0, 2)
  roof.closePath()
  const roofGeo = new THREE.ExtrudeGeometry(roof, { depth: 12.2, bevelEnabled: false })
  roofGeo.rotateY(Math.PI / 2)
  S.add(roofGeo, M.dark, [-4.1, 5.85, 44])

  // Lamp masts.
  for (const [x, z] of [[-36, 10], [-18, 10], [0, 10], [18, 10], [36, 10], [-40, 21.6], [-2, 25], [8, 38], [36, 34], [-28, 37]]) {
    S.add(CYL, M.dark, [x, 8.4, z], [0, 0, 0], [0.3, 14, 0.3])
    S.box(1.6, 0.35, 0.9, M.lamp, [x, 15.5, z])
  }

  // Anchorage: a mother vessel, tugs, and barges shuttling to the berth.
  bulkCarrier(S, M, -30, -80, 46, 10)
  for (let i = 0; i < 3; i++) {
    const b = bargeMesh(M, i % 2 ? M.coal : M.ore)
    b.userData = { u: i / 3 }
    scene.add(b)
    anim.barges.push(b)
  }
  for (const [x, z, ry] of [[22, -17, 0.4], [-44, -70, 2]]) {
    const t = tugMesh(M)
    t.position.set(x, 0, z)
    t.rotation.y = ry
    t.userData.base = [x, z]
    scene.add(t)
    anim.tugs.push(t)
  }

  S.build(scene)
  anim.stacker = stacker
  return { anim, M }
}

function step(anim, t, dt) {
  for (const u of anim.unloaders) {
    const p = (Math.sin(t * 0.55 + u.phase) + 1) / 2 // 0 over the hold, 1 over the hopper
    const z = -10 + p * 14
    const dip = Math.max(0, Math.sin(t * 1.1 + u.phase)) * (1 - p) * 7.5
    const gy = 12.2 - dip - (1 - p) * 1.5
    u.trolley.position.set(u.x0, 13.9, z)
    u.grab.position.set(u.x0, gy, z)
    u.rope.position.set(u.x0, (13.4 + gy + 0.7) / 2, z)
    u.rope.scale.y = Math.max(0.2, 13.4 - gy - 0.7)
  }
  // Barges loop between the mother vessel and the west end of the berth.
  for (const b of anim.barges) {
    b.userData.u = (b.userData.u + dt * 0.011) % 1
    const a = b.userData.u * Math.PI * 2
    b.position.set(-22 + Math.cos(a) * 22, Math.sin(t * 1.3 + a * 3) * 0.08, -42 + Math.sin(a) * 26)
    b.rotation.y = -a
  }
  for (const k of anim.trucks) {
    k.userData.u = (k.userData.u + dt * 0.028) % 1
    const p = k.userData.road.getPointAt(k.userData.u)
    const tan = k.userData.road.getTangentAt(k.userData.u)
    k.position.copy(p)
    k.rotation.y = Math.atan2(-tan.z, tan.x)
  }
  for (const g of anim.tugs) {
    g.position.y = Math.sin(t * 1.4 + g.userData.base[0]) * 0.12
    g.rotation.z = Math.sin(t * 1.1 + g.userData.base[1]) * 0.03
  }
  const s = anim.stacker
  s.position.set(-24 + Math.sin(t * 0.12) * 14, 0, 21.5)
  s.userData.slew.rotation.y = Math.PI / 2 + Math.sin(t * 0.3) * 0.5
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
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 1.75))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    el.prepend(renderer.domElement)
    renderer.domElement.className = 'absolute inset-0 h-full w-full'

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0b111c, 110, 260)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.35

    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 600)
    camera.position.set(...HOME.cam)

    scene.add(new THREE.HemisphereLight(0x9fb8d8, 0x0b111c, 0.7))
    const sun = new THREE.DirectionalLight(0xffd59a, 2.2)
    sun.position.set(55, 85, 45)
    sun.target.position.set(0, 0, 10)
    sun.castShadow = true
    sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048)
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 10, far: 260 })
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.04
    scene.add(sun, sun.target)
    const fill = new THREE.DirectionalLight(0x4a78c0, 0.6)
    fill.position.set(-60, 25, -50)
    scene.add(fill)

    const time = { value: 0 }
    const { anim, M } = build(scene, coarse, time)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(...HOME.look)
    controls.enableDamping = true
    controls.enablePan = false
    controls.enableZoom = false // the wheel scrolls the page
    controls.enableRotate = !coarse // on phones a drag scrolls the page; the zone buttons move the camera
    controls.minPolarAngle = 0.35
    controls.maxPolarAngle = 1.2
    controls.autoRotate = !still
    controls.autoRotateSpeed = 0.3
    if (coarse) renderer.domElement.style.touchAction = 'pan-y'

    // Camera flight: ease position and target toward a goal; a drag cancels it.
    // On tall, narrow screens every view backs off along its own line of sight so the scene still fits.
    let fit = 1
    let current = null
    const view = (s) => {
      const look = new V(...s.look)
      return { look, cam: new V(...s.cam).sub(look).multiplyScalar(fit).add(look) }
    }
    let goal = null
    const fly = (id) => {
      current = id
      const s = SPOTS[id] ?? HOME
      goal = view(s)
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
      camera.fov = w < 640 ? 46 : 38
      camera.updateProjectionMatrix()
      const next = camera.aspect < 1.2 ? 1 + (1.2 - camera.aspect) * 0.9 : 1
      if (Math.abs(next - fit) > 0.01) {
        fit = next
        const v0 = view(SPOTS[current] ?? HOME)
        if (!goal) camera.position.copy(v0.cam)
        else goal = v0
      }
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)

    const v = new V()
    const clock = new THREE.Clock()
    let raf
    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return clock.getDelta()
      const dt = Math.min(clock.getDelta(), 0.05)
      if (!still) {
        time.value = clock.elapsedTime
        step(anim, clock.elapsedTime, dt)
      }
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
      scene.traverse((o) => o.geometry?.dispose())
      Object.values(M).forEach((m) => m.dispose())
      env.dispose()
      pmrem.dispose()
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
