'use client'

import { useEffect, useRef } from 'react'

// Amber light that falls from the nav onto the globe, runs round its rim and pours off the sides.
// One WebGL2 fragment shader over the header; nothing is drawn inside the globe. Desktop only.

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uSize;   // canvas, css px
uniform float uDpr;
uniform float uTime;
uniform float uIntro; // 0 to 1 over the opening
uniform float uFlare; // 1 right after the globe moves to a new stop, decays to 0
uniform vec3 uGlobe;  // centre x, y and rim radius, css px
uniform float uTop;   // where the beam comes out (under the nav)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}
float sq(float x) { return x * x; }

const vec3 WHITE = vec3(1.0, 0.95, 0.85);
const vec3 AMBER = vec3(1.0, 0.69, 0.13);
const vec3 EMBER = vec3(1.0, 0.36, 0.08);
const vec3 SEA = vec3(0.35, 0.5, 0.85);

void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 c = uGlobe.xy;
  float R = uGlobe.z;
  vec2 q = p - c;
  float d = length(q) - R;
  if (d < -1.0) { o = vec4(0.0); return; }

  float t = uTime;
  float adx = abs(q.x);
  float rimTop = c.y - sqrt(max(R * R - q.x * q.x, 0.0));
  // The beam falls first, then the light runs round the rim, then it pours off the sides.
  float fall = clamp(uIntro / 0.3, 0.0, 1.0);
  float run = clamp((uIntro - 0.25) / 0.6, 0.0, 1.0);
  float pour = clamp((uIntro - 0.6) / 0.4, 0.0, 1.0);
  float front = mix(uTop, c.y - R, fall * fall);
  float breathe = 0.85 + 0.1 * sin(t * 1.3) + 0.1 * (noise(vec2(t * 0.6, 2.0)) - 0.5) + 0.6 * uFlare;

  vec3 col = vec3(0.0);

  // Beam: a thin hot core with an amber halo, coming out under the nav.
  float lit = smoothstep(front + 4.0, front - 40.0, p.y) * smoothstep(uTop - 2.0, uTop + 30.0, p.y) * step(p.y, rimTop + 1.0);
  col += (WHITE * 7.0 * exp(-adx / 1.1) + AMBER * (1.0 * exp(-adx / 6.0) + 0.22 * exp(-adx / 28.0))) * lit * breathe;

  // A splash where it lands.
  float hit = smoothstep(0.85, 1.0, fall);
  col += (WHITE * 1.4 * exp(-length(q - vec2(0.0, -R)) / 7.0) + AMBER * 0.5 * exp(-length(q - vec2(0.0, -R)) / 30.0)) * hit * breathe;

  // Rim: a white thread on the edge with an amber fan outside it. Streaks slide down so it flows.
  float th = atan(adx, -q.y);           // 0 at the top, PI at the bottom
  float s = th * R;                     // arc length from the top
  float reveal = 1.0 - smoothstep(run * 3.2 - 0.45, run * 3.2 + 0.05, th);
  float streak = 0.5 + 0.9 * noise(vec2(d * 0.05, s / 22.0 - t * 3.0));
  float thin = exp(-sq(max(d, 0.0) / (1.4 + 0.008 * s)));
  float fan = exp(-max(d, 0.0) / (5.0 + 0.08 * s));
  float fade = exp(-sq(th / 1.7)) + 0.2 * exp(-sq((th - 2.5) / 0.5));
  vec3 fanK = mix(AMBER, EMBER, smoothstep(0.7, 2.2, th));
  col += (WHITE * 2.0 * thin + fanK * 1.5 * fan) * streak * fade * reveal * breathe * smoothstep(-1.0, 0.5, d);

  // Pour: below the widest point the light leaves the sphere and falls straight down as a thin sheet.
  float side = adx - R;
  float drop = q.y;
  float sheet = exp(-sq(side / (2.0 + 0.06 * max(drop, 0.0)))) * smoothstep(0.0, 40.0, drop) * exp(-drop / (0.8 * R));
  float rain = 0.45 + 0.9 * noise(vec2(side * 0.25, drop / 22.0 - t * 7.0));
  col += mix(AMBER, EMBER, 0.5) * 1.3 * sheet * rain * pour * breathe;

  // Haze: slow smoke, lit amber near the beam and the rim, blue further out.
  float smoke = fbm(p * 0.011 + vec2(t * 0.015, -t * 0.05));
  float near = exp(-max(d, 0.0) / 70.0);
  col += (AMBER * 0.22 * exp(-adx / 45.0) * step(p.y, c.y) + SEA * 0.08) * smoke * near * run;

  col = 1.0 - exp(-col);
  o = vec4(col, max(col.r, max(col.g, col.b)));
}`

export default function Beam({ stop }) {
  const canvas = useRef(null)
  const flare = useRef(0)

  useEffect(() => {
    flare.current = performance.now()
  }, [stop])

  useEffect(() => {
    const el = canvas.current
    const header = el.parentElement
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const gl = el.getContext('webgl2', { premultipliedAlpha: true, antialias: false })
    if (!gl) return

    const shader = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const u = Object.fromEntries(['uSize', 'uDpr', 'uTime', 'uIntro', 'uFlare', 'uGlobe', 'uTop'].map((n) => [n, gl.getUniformLocation(prog, n)]))

    const t0 = performance.now()
    let raf
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      // ponytail: measures every frame (two rects); the header is sticky, so this is cheap and never stale.
      const g = header.querySelector('canvas.lens')
      if (!g) return
      const h = header.getBoundingClientRect()
      const r = g.getBoundingClientRect()
      const nav = header.querySelector('nav')
      const dpr = Math.min(devicePixelRatio, 1.5)
      const w = Math.round(h.width * dpr)
      const ht = Math.round(h.height * dpr)
      if (el.width !== w || el.height !== ht) {
        el.width = w
        el.height = ht
        gl.viewport(0, 0, w, ht)
      }
      const k = Math.min((now - t0) / 2600, 1)
      gl.uniform2f(u.uSize, h.width, h.height)
      gl.uniform1f(u.uDpr, dpr)
      gl.uniform1f(u.uTime, (now - t0) / 1000)
      gl.uniform1f(u.uIntro, 1 - (1 - k) ** 2)
      gl.uniform1f(u.uFlare, Math.exp(-(now - flare.current) / 500))
      gl.uniform3f(u.uGlobe, r.left - h.left + r.width / 2, r.top - h.top + r.height / 2, r.width * 0.425) // the .lens mask edge in globals.css
      gl.uniform1f(u.uTop, nav ? nav.getBoundingClientRect().bottom - h.top + 6 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 -z-10 h-full w-full" aria-hidden="true" />
}
