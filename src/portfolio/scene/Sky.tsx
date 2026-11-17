import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { roadmap } from "../content";
import { useCamp } from "../store";
import { CONSTELLATION_CENTERS, SKY_RADIUS, mulberry32 } from "./layout";

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
  float rays = 0.55 + 0.45 * fbm(vec2(p.x * 3.2 + t * speed * 4.0, t * 0.05));
  return (band * 0.8 + top * 0.35) * rays;
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
    col += ac * a * fade * north * 1.15;
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

const COLORS: Record<string, string> = { now: "#ffc46b", exploring: "#5ef2b0", future: "#b993ff" };

function constellationPoints(center: THREE.Vector3, count: number, seed: number) {
  // Build a local tangent basis around the center direction and lay stars on a gentle path.
  const up = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(center, up).normalize().negate();
  const tUp = new THREE.Vector3().crossVectors(right, center).normalize().negate();
  const rnd = mulberry32(seed);
  const pts: THREE.Vector3[] = [];
  const spread = 0.2;
  for (let i = 0; i < count; i++) {
    const u = (i / Math.max(1, count - 1) - 0.5) * spread * 1.15 + (rnd() - 0.5) * 0.03;
    const v = Math.sin(i * 1.9 + seed) * spread * 0.38 + (rnd() - 0.5) * 0.06;
    const dir = center.clone().add(right.clone().multiplyScalar(u)).add(tUp.clone().multiplyScalar(v)).normalize();
    pts.push(dir.multiplyScalar(SKY_RADIUS));
  }
  return pts;
}

const starVert = /* glsl */ `
attribute vec3 aColor;
attribute float aGroup;
attribute float aSeed;
uniform float uTime;
uniform float uReveal;
uniform vec3 uHighlight; // per group emphasis
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  float g = aGroup < 0.5 ? uHighlight.x : aGroup < 1.5 ? uHighlight.y : uHighlight.z;
  float tw = 0.8 + 0.2 * sin(uTime * 2.0 + aSeed * 30.0);
  vAlpha = (0.35 + 0.65 * uReveal) * tw * g;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (7.0 + 9.0 * uReveal * g) * tw;
}`;
const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float core = 1.0 - smoothstep(0.0, 0.18, d);
  float halo = (1.0 - smoothstep(0.0, 0.5, d)) * 0.45;
  float spike = (2.0 - smoothstep(0.0, 0.04, abs(c.x)) - smoothstep(0.0, 0.04, abs(c.y))) * (1.0 - smoothstep(0.1, 0.5, d)) * 0.5;
  float a = (core + halo + spike) * vAlpha;
  gl_FragColor = vec4(vColor * (1.0 + core), a);
}`;

export function Constellations() {
  const focus = useCamp((s) => s.focus);
  const highlight = useCamp((s) => s.highlight);
  const reveal = useRef(0);

  const data = useMemo(() => {
    return roadmap.map((c, gi) => {
      const pts = constellationPoints(CONSTELLATION_CENTERS[c.id], c.stars.length, 11 + gi * 7);
      return { c, gi, pts };
    });
  }, []);

  const { starGeo, lineGeo, lineMat, starMat } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const grp: number[] = [];
    const seed: number[] = [];
    const lpos: number[] = [];
    const lcol: number[] = [];
    data.forEach(({ c, gi, pts }) => {
      const color = new THREE.Color(COLORS[c.id]);
      pts.forEach((p, i) => {
        pos.push(p.x, p.y, p.z);
        col.push(color.r, color.g, color.b);
        grp.push(gi);
        seed.push(Math.sin(i * 12.9 + gi) * 0.5 + 0.5);
        const a = pts[i - 1];
        if (a) {
          lpos.push(a.x, a.y, a.z, p.x, p.y, p.z);
          lcol.push(color.r, color.g, color.b, color.r, color.g, color.b);
        }
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
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.1, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
    const starMat = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uHighlight: { value: new THREE.Vector3(1, 1, 1) } },
    });
    return { starGeo, lineGeo, lineMat, starMat };
  }, [data]);

  useFrame((state, dt) => {
    const target = focus === "sky" ? 1 : 0;
    reveal.current += (target - reveal.current) * (1 - Math.exp(-3 * Math.min(dt, 0.05)));
    starMat.uniforms["uTime"]!.value = state.clock.elapsedTime;
    starMat.uniforms["uReveal"]!.value = reveal.current;
    const hl = starMat.uniforms["uHighlight"]!.value as THREE.Vector3;
    const ids = ["now", "exploring", "future"];
    const g = (id: string) => (highlight == null ? 1 : highlight === id ? 1.25 : 0.35);
    hl.x += (g(ids[0]!) - hl.x) * 0.1;
    hl.y += (g(ids[1]!) - hl.y) * 0.1;
    hl.z += (g(ids[2]!) - hl.z) * 0.1;
    lineMat.opacity = 0.08 + reveal.current * 0.5;
  });

  return (
    <group>
      <points geometry={starGeo} material={starMat} frustumCulled={false} />
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      {focus === "sky" &&
        data.map(({ c, pts }) => (
          <group key={c.id}>
            {pts.map((p, i) => (
              <Html key={i} position={p} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
                <div
                  className="star-label"
                  data-dim={highlight != null && highlight !== c.id ? "" : undefined}
                  style={{ ["--star" as string]: COLORS[c.id], animationDelay: `${i * 90}ms` }}
                >
                  {c.stars[i]?.label}
                </div>
              </Html>
            ))}
            <Html position={(pts[Math.floor(pts.length / 2)] ?? new THREE.Vector3()).clone().add(new THREE.Vector3(0, 13, 0))} center zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
              <div className="constellation-name" style={{ ["--star" as string]: COLORS[c.id] }}>
                <span>{c.stage}</span>
                {c.name}
              </div>
            </Html>
          </group>
        ))}
    </group>
  );
}
