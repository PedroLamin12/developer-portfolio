import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MOON_DIR, mulberry32 } from "./layout";
import { radialTexture } from "./Fire";

/* ---------------- Distant mountain silhouettes ---------------- */

function ridge(radius: number, base: number, amp: number, seed: number, bottom: string, top: string) {
  const rnd = mulberry32(seed);
  const N = 160;
  const phases = [rnd() * 6, rnd() * 6, rnd() * 6];
  const pos: number[] = [];
  const col: number[] = [];
  const cb = new THREE.Color(bottom);
  const ct = new THREE.Color(top);
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const h =
      base +
      amp * (0.55 * Math.sin(a * 3 + phases[0]!) + 0.3 * Math.sin(a * 7 + phases[1]!) + 0.15 * Math.sin(a * 17 + phases[2]!)) +
      amp * 0.35 * Math.abs(Math.sin(a * 11 + phases[1]!));
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    pos.push(x, -4, z, x, Math.max(base * 0.4, h), z);
    col.push(cb.r, cb.g, cb.b, ct.r, ct.g, ct.b);
  }
  const idx: number[] = [];
  for (let i = 0; i < N; i++) {
    const k = i * 2;
    idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

export function Mountains() {
  const [far, near] = useMemo(
    () => [ridge(125, 14, 9, 5, "#0b1428", "#16264a"), ridge(100, 7, 6, 9, "#060a16", "#0c1630")],
    [],
  );
  return (
    <group>
      <mesh geometry={far}>
        <meshBasicMaterial vertexColors fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={near}>
        <meshBasicMaterial vertexColors fog={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ---------------- Moon ---------------- */

export function Moon() {
  const { disc, halo } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(118, 116, 10, 128, 128, 110);
    grad.addColorStop(0, "#fbf4e2");
    grad.addColorStop(0.85, "#e6dcc4");
    grad.addColorStop(1, "#cfc3a6");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(128, 128, 110, 0, Math.PI * 2);
    g.fill();
    const rnd = mulberry32(17);
    for (let i = 0; i < 26; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * 90;
      g.fillStyle = `rgba(150,140,120,${0.12 + rnd() * 0.2})`;
      g.beginPath();
      g.arc(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 4 + rnd() * 16, 0, Math.PI * 2);
      g.fill();
    }
    const disc = new THREE.CanvasTexture(c);
    disc.colorSpace = THREE.SRGBColorSpace;
    const halo = radialTexture([[0, "rgba(200,215,255,0.35)"], [0.25, "rgba(160,185,255,0.12)"], [1, "rgba(120,150,255,0)"]]);
    return { disc, halo };
  }, []);
  const p = MOON_DIR.clone().multiplyScalar(130);
  return (
    <group position={p}>
      <sprite scale={46}>
        <spriteMaterial map={halo} blending={THREE.AdditiveBlending} depthWrite={false} transparent fog={false} />
      </sprite>
      <sprite scale={7}>
        <spriteMaterial map={disc} depthWrite={false} transparent fog={false} />
      </sprite>
    </group>
  );
}

/* ---------------- Shooting star ---------------- */

export function ShootingStar() {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    return l;
  }, []);
  const st = useRef({ next: 4, t0: -10, from: new THREE.Vector3(), dir: new THREE.Vector3(), rnd: mulberry32(77) });
  useFrame((state) => {
    const s = st.current;
    const t = state.clock.elapsedTime;
    if (t > s.next) {
      const az = (s.rnd() - 0.5) * 2.4;
      const el = 0.45 + s.rnd() * 0.5;
      s.from.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).multiplyScalar(110);
      s.dir.set(s.rnd() - 0.5, -0.35 - s.rnd() * 0.3, s.rnd() - 0.5).normalize();
      s.t0 = t;
      s.next = t + 6 + s.rnd() * 8;
    }
    const k = (t - s.t0) / 0.9;
    const pos = line.geometry.attributes["position"] as THREE.BufferAttribute;
    const mat = line.material as THREE.LineBasicMaterial;
    if (k < 0 || k > 1) {
      mat.opacity = 0;
      return;
    }
    const head = s.from.clone().addScaledVector(s.dir, k * 38);
    const tail = s.from.clone().addScaledVector(s.dir, Math.max(0, k * 38 - 9));
    pos.setXYZ(0, head.x, head.y, head.z);
    pos.setXYZ(1, tail.x, tail.y, tail.z);
    pos.needsUpdate = true;
    mat.opacity = Math.sin(k * Math.PI);
  });
  return <primitive object={line} />;
}

/* ---------------- Fireflies ---------------- */

const flyVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uScale;
varying float vBlink;
void main() {
  vec3 p = position;
  float t = uTime * (0.15 + aSeed.y * 0.2);
  p.x += sin(t * 2.1 + aSeed.x * 20.0) * 0.9;
  p.y += sin(t * 3.3 + aSeed.z * 20.0) * 0.35;
  p.z += cos(t * 1.7 + aSeed.w * 20.0) * 0.9;
  vBlink = pow(max(0.0, sin(uTime * (0.8 + aSeed.y) + aSeed.x * 40.0)), 6.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 0.16 * uScale / -mv.z;
}`;
const flyFrag = /* glsl */ `
varying float vBlink;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.0, 0.5, d));
  a = a * a * vBlink;
  gl_FragColor = vec4(vec3(0.78, 1.0, 0.45) * 1.4, a);
}`;

/* ---------------- Smoke ---------------- */

const smokeVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uScale;
varying float vLife;
void main() {
  float life = fract(uTime * (0.06 + aSeed.y * 0.03) + aSeed.x);
  vLife = life;
  vec3 p = vec3(0.0);
  p.y = 1.2 + life * 7.0;
  p.x = sin(life * 3.0 + aSeed.z * 6.0) * (0.2 + life * 1.4) + life * 1.2;
  p.z = cos(life * 2.0 + aSeed.w * 6.0) * (0.2 + life * 1.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (0.6 + life * 3.2) * uScale / -mv.z;
}`;
const smokeFrag = /* glsl */ `
varying float vLife;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.1, 0.5, d)) * smoothstep(0.0, 0.15, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
  gl_FragColor = vec4(vec3(0.42, 0.44, 0.52), a * 0.07);
}`;

function seeded(count: number, seed: number, place?: (r: () => number) => [number, number, number]) {
  const rnd = mulberry32(seed);
  const s = new Float32Array(count * 4);
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) s[i * 4 + k] = rnd();
    if (place) {
      const [x, y, z] = place(rnd);
      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = z;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(s, 4));
  return g;
}

export function Particles() {
  const { gl, size } = useThree();
  const { flyGeo, flyMat, smokeGeo, smokeMat } = useMemo(() => {
    const flyGeo = seeded(70, 21, (r) => {
      const a = r() * Math.PI * 2;
      const d = 4.5 + r() * 12;
      return [Math.cos(a) * d, 0.4 + r() * 2.2, Math.sin(a) * d];
    });
    const smokeGeo = seeded(26, 31);
    const common = { transparent: true, depthWrite: false };
    return {
      flyGeo,
      smokeGeo,
      flyMat: new THREE.ShaderMaterial({ ...common, blending: THREE.AdditiveBlending, vertexShader: flyVert, fragmentShader: flyFrag, uniforms: { uTime: { value: 0 }, uScale: { value: 800 } } }),
      smokeMat: new THREE.ShaderMaterial({ ...common, vertexShader: smokeVert, fragmentShader: smokeFrag, uniforms: { uTime: { value: 0 }, uScale: { value: 800 } } }),
    };
  }, []);
  useFrame((state) => {
    const scale = size.height * gl.getPixelRatio() * 1.1;
    for (const m of [flyMat, smokeMat]) {
      m.uniforms["uTime"]!.value = state.clock.elapsedTime;
      m.uniforms["uScale"]!.value = scale;
    }
  });
  return (
    <>
      <points geometry={flyGeo} material={flyMat} frustumCulled={false} />
      <points geometry={smokeGeo} material={smokeMat} frustumCulled={false} />
    </>
  );
}

/* ---------------- Ground mist ---------------- */

export function Mist() {
  const tex = useMemo(() => {
    const s = 256;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d")!;
    const rnd = mulberry32(8);
    for (let i = 0; i < 40; i++) {
      const x = s / 2 + (rnd() - 0.5) * s * 0.55;
      const y = s / 2 + (rnd() - 0.5) * s * 0.55;
      const r = 30 + rnd() * 60;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(130,150,200,0.09)");
      grad.addColorStop(1, "rgba(130,150,200,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }
    // Feather the edges so no plane border is ever visible.
    g.globalCompositeOperation = "destination-in";
    const mask = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.6, "rgba(0,0,0,0.6)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = mask;
    g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const patches = useMemo(() => {
    const rnd = mulberry32(12);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.5;
      const d = 11 + rnd() * 10;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 14 + rnd() * 10, y: 0.25 + rnd() * 0.6, rot: rnd() * 6, speed: (rnd() - 0.5) * 0.02 };
    });
  }, []);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    refs.current.forEach((m, i) => {
      if (m) m.rotation.z += patches[i]!.speed * Math.min(dt, 0.05);
    });
  });
  return (
    <group>
      {patches.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={[p.x, p.y, p.z]}
          rotation={[-Math.PI / 2, 0, p.rot]}
          renderOrder={2}
        >
          <planeGeometry args={[p.s, p.s]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}
