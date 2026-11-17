import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "./layout";
import { useCamp } from "../store";

// Flames and embers are animated entirely on the GPU: each particle derives its
// position from time and a per-particle seed, so the CPU never touches them.

const FLAME_COUNT = 160;
const EMBER_COUNT = 90;
const FIRE_BASE = 0.22;

const flameVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uScale;
varying float vLife;
varying float vSeed;
void main() {
  float speed = 0.8 + aSeed.y * 0.7;
  float life = fract(uTime * speed + aSeed.x);
  vLife = life;
  vSeed = aSeed.w;
  float ang = aSeed.z * 6.2831;
  float r = (0.32 * (1.0 - life * 0.85)) * sqrt(aSeed.w);
  vec3 p = vec3(cos(ang) * r, life * (0.9 + aSeed.y * 0.7), sin(ang) * r);
  p.x += sin(uTime * 3.0 + aSeed.z * 20.0 + life * 4.0) * 0.07 * life;
  p.z += cos(uTime * 2.6 + aSeed.x * 20.0) * 0.06 * life;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = mix(0.55, 0.12, life) * (0.7 + aSeed.w * 0.6);
  gl_PointSize = size * uScale / -mv.z;
}`;
const flameFrag = /* glsl */ `
varying float vLife;
varying float vSeed;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float soft = 1.0 - smoothstep(0.0, 0.5, d);
  vec3 hot = vec3(1.0, 0.92, 0.65);
  vec3 mid = vec3(1.0, 0.55, 0.12);
  vec3 cool = vec3(0.85, 0.16, 0.04);
  vec3 col = mix(hot, mid, smoothstep(0.0, 0.35, vLife));
  col = mix(col, cool, smoothstep(0.35, 0.85, vLife));
  float a = soft * soft * (1.0 - smoothstep(0.55, 1.0, vLife)) * smoothstep(0.0, 0.06, vLife);
  gl_FragColor = vec4(col * 1.4, a * 0.55);
}`;

const emberVert = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform float uScale;
varying float vLife;
varying float vFlick;
void main() {
  float speed = 0.12 + aSeed.y * 0.16;
  float life = fract(uTime * speed + aSeed.x);
  vLife = life;
  float ang = aSeed.z * 6.2831 + life * (2.0 + aSeed.w * 3.0);
  float r = 0.15 + life * (0.6 + aSeed.w * 1.2);
  vec3 p = vec3(cos(ang) * r, 0.3 + life * (2.8 + aSeed.y * 2.6), sin(ang) * r);
  p.x += sin(uTime * 0.7 + aSeed.z * 9.0) * 0.4 * life;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vFlick = 0.6 + 0.4 * sin(uTime * (8.0 + aSeed.w * 10.0) + aSeed.x * 50.0);
  gl_PointSize = (0.05 + aSeed.w * 0.05) * uScale / -mv.z;
}`;
const emberFrag = /* glsl */ `
varying float vLife;
varying float vFlick;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.1, 0.5, d)) * (1.0 - smoothstep(0.5, 1.0, vLife)) * smoothstep(0.0, 0.08, vLife) * vFlick;
  gl_FragColor = vec4(vec3(1.0, 0.6, 0.2) * 1.6, a);
}`;

function seeds(count: number, seed: number) {
  const rnd = mulberry32(seed);
  const arr = new Float32Array(count * 4);
  for (let i = 0; i < arr.length; i++) arr[i] = rnd();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(arr, 4));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 6);
  return geo;
}

export function radialTexture(stops: [number, string][], size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function Fire() {
  const { gl, size } = useThree();
  const light = useRef<THREE.PointLight>(null);
  const glow = useRef<THREE.Sprite>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const hovered = useCamp((s) => s.hovered === "fire");

  const { flameGeo, flameMat, emberGeo, emberMat, glowMap, poolMap } = useMemo(() => {
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
    return {
      flameGeo: seeds(FLAME_COUNT, 7),
      emberGeo: seeds(EMBER_COUNT, 99),
      flameMat: new THREE.ShaderMaterial({ ...common, vertexShader: flameVert, fragmentShader: flameFrag, uniforms: { uTime: { value: 0 }, uScale: { value: 800 } } }),
      emberMat: new THREE.ShaderMaterial({ ...common, vertexShader: emberVert, fragmentShader: emberFrag, uniforms: { uTime: { value: 0 }, uScale: { value: 800 } } }),
      glowMap: radialTexture([[0, "rgba(255,170,80,0.9)"], [0.25, "rgba(255,110,30,0.35)"], [1, "rgba(255,80,10,0)"]]),
      poolMap: radialTexture([[0, "rgba(255,140,60,0.55)"], [0.35, "rgba(255,90,30,0.18)"], [1, "rgba(255,60,10,0)"]]),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Point size scales with the drawing buffer height so particles keep their size across screens.
    const scale = size.height * gl.getPixelRatio() * 1.1;
    for (const m of [flameMat, emberMat]) {
      m.uniforms["uTime"]!.value = t;
      m.uniforms["uScale"]!.value = scale;
    }
    const flick = 0.82 + 0.1 * Math.sin(t * 11.3) + 0.06 * Math.sin(t * 23.7 + 1.3) + 0.05 * Math.sin(t * 5.1);
    if (light.current) {
      light.current.intensity = 34 * flick * (hovered ? 1.15 : 1);
      light.current.position.set(Math.sin(t * 7.1) * 0.05, 0.9 + Math.sin(t * 9.3) * 0.04, Math.cos(t * 6.3) * 0.05);
    }
    if (glow.current) glow.current.scale.setScalar(2.6 * (0.92 + flick * 0.1));
    if (pool.current) pool.current.opacity = 0.75 * flick;
  });

  return (
    <group position={[0, FIRE_BASE, 0]}>
      <pointLight ref={light} color="#ff8a3a" intensity={34} distance={0} decay={1.7} />
      <points geometry={flameGeo} material={flameMat} frustumCulled={false} />
      <points geometry={emberGeo} material={emberMat} frustumCulled={false} />
      <sprite ref={glow} position={[0, 0.45, 0]} scale={2.6}>
        <spriteMaterial map={glowMap} blending={THREE.AdditiveBlending} depthWrite={false} transparent fog={false} />
      </sprite>
      <mesh rotation-x={-Math.PI / 2} position={[0, -FIRE_BASE + 0.02, 0]} renderOrder={1}>
        <planeGeometry args={[9, 9]} />
        <meshBasicMaterial ref={pool} map={poolMap} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
      </mesh>
    </group>
  );
}
