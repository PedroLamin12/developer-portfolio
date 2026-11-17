import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { roadmap } from "../content";
import { useCamp } from "../store";
import { CONSTELLATION_CENTERS, SKY_RADIUS } from "./layout";

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // keep on the far plane
}`;

const skyFrag = /* glsl */ `
precision highp float;
varying vec3 vDir;
uniform float uTime;
uniform vec3 uHorizon;
uniform vec3 uZenith;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

vec3 stars(vec3 d, float scale, float threshold, float t) {
  vec3 p = d * scale;
  vec3 c = floor(p);
  vec3 f = fract(p) - 0.5;
  float h = hash13(c);
  if (h < threshold) return vec3(0.0);
  vec3 off = vec3(hash13(c + 1.7), hash13(c + 4.1), hash13(c + 7.3)) - 0.5;
  float dist = length(f - off * 0.6);
  float size = 0.07 + 0.08 * hash13(c + 9.9);
  float s = 1.0 - smoothstep(0.0, size, dist);
  float tw = 0.65 + 0.35 * sin(t * (1.0 + 3.0 * hash13(c + 2.2)) + h * 40.0);
  vec3 tint = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.9, 0.75), hash13(c + 5.5));
  return tint * s * tw * (0.6 + 1.6 * (h - threshold) / (1.0 - threshold));
}

float curtain(vec2 p, float offset, float speed, float t) {
  float n = fbm(vec2(p.x * 0.35 + t * speed, offset));
  float line = p.y - (offset + sin(p.x * 0.45 + t * 0.07 + offset * 3.0) * 0.9 + (n - 0.5) * 2.6);
  float band = exp(-line * line * 1.6);
  float top = 1.0 - smoothstep(0.0, 1.8, abs(line + 0.6));
  float r = fbm(vec2(p.x * 4.0 + t * speed * 4.0, t * 0.05));
  float rays = 0.25 + 1.4 * r * r;
  return (band * 0.85 + top * 0.12) * rays;
}

void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  float t = uTime;
  vec3 col = mix(uHorizon, uZenith, smoothstep(-0.05, 0.65, h));

  // Stars, fading into the horizon haze.
  float starMask = smoothstep(0.02, 0.25, h);
  col += (stars(d, 260.0, 0.965, t) + stars(d, 520.0, 0.985, t * 1.3) * 0.7) * starMask;
  // A faint milky band.
  float milky = fbm(vec2(atan(d.z, d.x) * 3.0, d.y * 6.0)) * exp(-pow((d.x * 0.6 + d.y - 0.75) * 2.2, 2.0));
  col += vec3(0.12, 0.12, 0.2) * milky * starMask * 0.5;

  // Aurora: projected onto a curved ceiling, strongest towards -Z (north).
  if (h > 0.0) {
    vec2 p = vec2(d.x, -d.z) / (h + 0.18) * 1.6;
    float north = 1.0 - smoothstep(-0.9, 0.6, d.z);
    float a = curtain(p, 2.3, 0.025, t) + curtain(p + vec2(3.1, 0.0), 3.9, -0.018, t) * 0.8;
    float fade = smoothstep(0.02, 0.22, h) * (1.0 - smoothstep(0.7, 0.98, h));
    vec3 green = vec3(0.15, 0.95, 0.55);
    vec3 teal = vec3(0.1, 0.65, 0.75);
    vec3 violet = vec3(0.6, 0.25, 0.95);
    vec3 ac = mix(green, teal, smoothstep(0.1, 0.3, h));
    ac = mix(ac, violet, smoothstep(0.25, 0.6, h));
    col += ac * a * fade * north * 0.7;
  }


  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const HORIZON = new THREE.Color("#0b1326");

export function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uHorizon: { value: HORIZON.clone() },
          uZenith: { value: new THREE.Color("#02040c") },
        },
      }),
    [],
  );
  useFrame((state) => {
    mat.uniforms["uTime"]!.value = state.clock.elapsedTime;
  });
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[150, 48, 24]} />
    </mesh>
  );
}

const COLORS: Record<string, string> = { now: "#ffc46b", exploring: "#5ef2b0", future: "#c3a2ff" };

type Side = "top" | "bottom" | "left" | "right";
// Hand-drawn figures: offsets in degrees from the constellation center, label side, and edges.
const FIGURES: Record<string, { stars: [number, number, Side][]; edges: [number, number][] }> = {
  now: {
    stars: [
      [-6.5, -2.5, "left"],
      [-2.5, 2.5, "top"],
      [3, 4.5, "top"],
      [7, 0, "right"],
      [3, -5, "bottom"],
      [-3.5, -7.5, "bottom"],
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 4]],
  },
  exploring: {
    stars: [
      [0, 5.5, "top"],
      [6.5, 0.5, "right"],
      [-6.5, 0.5, "left"],
      [0, -5, "bottom"],
    ],
    edges: [[0, 1], [1, 3], [3, 2], [2, 0], [0, 3]],
  },
  future: {
    stars: [
      [5.5, 6.5, "top"],
      [1, 2.5, "left"],
      [6.5, -1.5, "right"],
      [-2, -1.5, "left"],
      [-6, -6, "bottom"],
    ],
    edges: [[4, 3], [3, 1], [1, 0], [0, 2], [2, 1]],
  },
};

function figurePoints(center: THREE.Vector3, offsets: [number, number, Side][]) {
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(up, center).normalize().negate();
  const tUp = new THREE.Vector3().crossVectors(center, right).normalize().negate();
  return offsets.map(([u, v]) =>
    center
      .clone()
      .add(right.clone().multiplyScalar(Math.tan(THREE.MathUtils.degToRad(u))))
      .add(tUp.clone().multiplyScalar(Math.tan(THREE.MathUtils.degToRad(v))))
      .normalize()
      .multiplyScalar(SKY_RADIUS),
  );
}

const starVert = /* glsl */ `
attribute vec3 aColor;
attribute float aGroup;
attribute float aSeed;
uniform float uTime;
uniform float uReveal;
uniform float uPixel;
uniform vec3 uHighlight;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  float g = aGroup < 0.5 ? uHighlight.x : aGroup < 1.5 ? uHighlight.y : uHighlight.z;
  float tw = 0.85 + 0.15 * sin(uTime * 2.2 + aSeed * 30.0);
  vAlpha = (0.3 + 0.7 * uReveal) * tw * g;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (9.0 + 15.0 * uReveal * g) * tw * uPixel;
}`;
const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = 1.0 - smoothstep(0.0, 0.09, d);
  float halo = (1.0 - smoothstep(0.0, 0.5, d));
  halo *= halo * 0.55;
  float sx = 1.0 - smoothstep(0.0, 0.025, abs(c.x));
  float sy = 1.0 - smoothstep(0.0, 0.025, abs(c.y));
  float spike = (sx + sy) * (1.0 - smoothstep(0.05, 0.5, d)) * 0.6;
  float a = (core + halo + spike) * vAlpha;
  gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.7), a);
}`;

const lineVert = /* glsl */ `
attribute vec3 color;
attribute float aT;
varying vec3 vColor;
varying float vT;
void main() {
  vColor = color;
  vT = aT;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const lineFrag = /* glsl */ `
uniform float uDraw;
uniform float uBase;
varying vec3 vColor;
varying float vT;
void main() {
  float drawn = 1.0 - smoothstep(uDraw - 0.02, uDraw, vT);
  gl_FragColor = vec4(vColor, uBase + drawn * 0.55);
}`;

const SIDE_CLASS: Record<Side, string> = { top: "is-top", bottom: "is-bottom", left: "is-left", right: "is-right" };

export function Constellations() {
  const focus = useCamp((s) => s.focus);
  const highlight = useCamp((s) => s.highlight);
  const reveal = useRef(0);
  const draw = useRef(0);
  const { gl } = useThree();

  const data = useMemo(
    () =>
      roadmap.map((c, gi) => {
        const fig = FIGURES[c.id]!;
        const pts = figurePoints(CONSTELLATION_CENTERS[c.id], fig.stars);
        const top = Math.max(...fig.stars.map((s) => s[1]));
        const namePos = figurePoints(CONSTELLATION_CENTERS[c.id], [[0, top + 6, "top"]])[0]!;
        return { c, gi, fig, pts, namePos };
      }),
    [],
  );

  const { starGeo, lineGeo, lineMat, starMat } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const grp: number[] = [];
    const seed: number[] = [];
    const lpos: number[] = [];
    const lcol: number[] = [];
    const lt: number[] = [];
    data.forEach(({ c, gi, fig, pts }) => {
      const color = new THREE.Color(COLORS[c.id]);
      pts.forEach((p, i) => {
        pos.push(p.x, p.y, p.z);
        col.push(color.r, color.g, color.b);
        grp.push(gi);
        seed.push(Math.sin(i * 12.9 + gi) * 0.5 + 0.5);
      });
      fig.edges.forEach(([a, b], e) => {
        const pa = pts[a]!;
        const pb = pts[b]!;
        lpos.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z);
        lcol.push(color.r, color.g, color.b, color.r, color.g, color.b);
        const n = fig.edges.length;
        lt.push((gi * 0.12 + (e / n) * 0.76) , (gi * 0.12 + ((e + 1) / n) * 0.76));
      });
    });
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    starGeo.setAttribute("aColor", new THREE.Float32BufferAttribute(col, 3));
    starGeo.setAttribute("aGroup", new THREE.Float32BufferAttribute(grp, 1));
    starGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(lpos, 3));
    lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lcol, 3));
    lineGeo.setAttribute("aT", new THREE.Float32BufferAttribute(lt, 1));
    const lineMat = new THREE.ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uDraw: { value: 0 }, uBase: { value: 0.06 } },
    });
    const starMat = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uPixel: { value: 1 }, uHighlight: { value: new THREE.Vector3(1, 1, 1) } },
    });
    return { starGeo, lineGeo, lineMat, starMat };
  }, [data]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const on = focus === "sky";
    reveal.current += ((on ? 1 : 0) - reveal.current) * (1 - Math.exp(-3 * dt));
    // Lines draw themselves in once the camera has turned to the sky.
    draw.current = on ? Math.min(1.05, draw.current + dt * 0.45) : Math.max(0, draw.current - dt * 1.5);
    starMat.uniforms["uTime"]!.value = state.clock.elapsedTime;
    starMat.uniforms["uReveal"]!.value = reveal.current;
    starMat.uniforms["uPixel"]!.value = gl.getPixelRatio();
    lineMat.uniforms["uDraw"]!.value = draw.current;
    lineMat.uniforms["uBase"]!.value = 0.05 + reveal.current * 0.05;
    const hl = starMat.uniforms["uHighlight"]!.value as THREE.Vector3;
    const g = (id: string) => (highlight == null ? 1 : highlight === id ? 1.3 : 0.3);
    hl.x += (g("now") - hl.x) * 0.12;
    hl.y += (g("exploring") - hl.y) * 0.12;
    hl.z += (g("future") - hl.z) * 0.12;
  });

  const visible = focus === "sky";
  return (
    <group>
      <points geometry={starGeo} material={starMat} frustumCulled={false} />
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      {/* Labels stay mounted and fade with CSS, so toggling the view never unmounts Html roots. */}
      {data.map(({ c, gi, fig, pts, namePos }) => {
        const dim = highlight != null && highlight !== c.id;
        return (
          <group key={c.id}>
            {pts.map((p, i) => (
              <Html key={i} position={p} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
                <div
                  className={`star-label ${SIDE_CLASS[fig.stars[i]![2]]}`}
                  data-visible={visible ? "" : undefined}
                  data-dim={dim ? "" : undefined}
                  style={{ ["--star" as string]: COLORS[c.id], transitionDelay: visible ? `${900 + gi * 250 + i * 80}ms` : "0ms" }}
                >
                  {c.stars[i]?.label}
                </div>
              </Html>
            ))}
            <Html position={namePos} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
              <div
                className="constellation-name"
                data-visible={visible ? "" : undefined}
                data-dim={dim ? "" : undefined}
                style={{ ["--star" as string]: COLORS[c.id], transitionDelay: visible ? `${700 + gi * 250}ms` : "0ms" }}
              >
                <span>{c.stage}</span>
                {c.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
