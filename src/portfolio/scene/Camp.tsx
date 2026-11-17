import { useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import tentModel from "@/assets/models/tent.glb.asset.json";
import stonesModel from "@/assets/models/campfire-stones.glb.asset.json";
import logsModel from "@/assets/models/campfire-logs.glb.asset.json";
import pineA from "@/assets/models/pine-tall-a.glb.asset.json";
import pineB from "@/assets/models/pine-tall-b.glb.asset.json";
import pineRound from "@/assets/models/pine-round.glb.asset.json";
import pineDefault from "@/assets/models/pine-default.glb.asset.json";
import rockLarge from "@/assets/models/rock-large.glb.asset.json";
import rockSmall from "@/assets/models/rock-small.glb.asset.json";
import logSeat from "@/assets/models/log-round.glb.asset.json";
import stumpModel from "@/assets/models/stump.glb.asset.json";
import mushroomsModel from "@/assets/models/mushrooms.glb.asset.json";
import chestModel from "@/assets/models/chest.glb.asset.json";
import axeModel from "@/assets/models/axe.glb.asset.json";
import grassModel from "@/assets/models/grass.glb.asset.json";
import { Instances, Model, type Instance } from "./models";
import { CHEST, LANTERN, TELESCOPE, TENT, SKY_DIR, mulberry32 } from "./layout";
import { useCamp } from "../store";
import { sections, type SectionId } from "../content";
import { radialTexture } from "./Fire";

export const MODEL_URLS = [tentModel, stonesModel, logsModel, pineA, pineB, pineRound, pineDefault, rockLarge, rockSmall, logSeat, stumpModel, mushroomsModel, chestModel, axeModel, grassModel].map((m) => m.url);

/* ---------------- Ground ---------------- */

export function Ground() {
  const map = useMemo(() => {
    const size = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.fillStyle = "#1f2b1c";
    g.fillRect(0, 0, size, size);
    const rnd = mulberry32(3);
    // Mottled grass and moss.
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = 2 + rnd() * 14;
      const tone = rnd();
      g.fillStyle = tone < 0.5 ? `rgba(48,66,38,${0.25 + rnd() * 0.3})` : tone < 0.8 ? `rgba(28,40,26,${0.3 + rnd() * 0.3})` : `rgba(70,62,40,${0.2 + rnd() * 0.2})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // Trodden dirt clearing around the fire.
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.16);
    grad.addColorStop(0, "rgba(92,70,48,1)");
    grad.addColorStop(0.6, "rgba(78,60,40,0.85)");
    grad.addColorStop(1, "rgba(60,50,34,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const a = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * size * 0.14;
      g.fillStyle = `rgba(${rnd() < 0.5 ? "120,96,70" : "50,40,30"},${0.2 + rnd() * 0.4})`;
      g.fillRect(size / 2 + Math.cos(a) * d, size / 2 + Math.sin(a) * d, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
      <circleGeometry args={[60, 48]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

/* ---------------- Forest ---------------- */

function blocked(x: number, z: number) {
  // Keep the clearing, the overview camera's line of sight and the sky view free.
  const r = Math.hypot(x, z);
  if (r < 8.5) return true;
  if (z > 5 && Math.abs(x) < 4 + (z - 5) * 0.55) return true;
  if (z < 0 && Math.abs(Math.atan2(x, -z)) < 0.75 && r < 15) return true;
  return false;
}

function useForest() {
  return useMemo(() => {
    const rnd = mulberry32(42);
    const groups: [Instance[], Instance[], Instance[], Instance[]] = [[], [], [], []];
    let tries = 0;
    while (tries++ < 900 && groups.reduce((n, g) => n + g.length, 0) < 95) {
      const a = rnd() * Math.PI * 2;
      const r = 8.5 + Math.pow(rnd(), 0.8) * 24;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (blocked(x, z)) continue;
      const near = groups.flat().some((t) => Math.hypot(t.x - x, t.z - z) < 2.1);
      if (near) continue;
      const k = Math.floor(rnd() * 4) as 0 | 1 | 2 | 3;
      groups[k].push({ x, z, rot: rnd() * Math.PI * 2, scale: 0.75 + rnd() * 0.55 });
    }
    const rocks: Instance[] = [];
    const smallRocks: Instance[] = [];
    const grass: Instance[] = [];
    const shrooms: Instance[] = [];
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 7.5 + rnd() * 14;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (z > 5 && Math.abs(x) < 3) continue;
      (rnd() < 0.4 ? rocks : smallRocks).push({ x, z, rot: rnd() * 6.28, scale: 0.6 + rnd() * 0.8 });
    }
    for (let i = 0; i < 130; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 3.6 + rnd() * 16;
      grass.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, rot: rnd() * 6.28, scale: 0.6 + rnd() * 0.9 });
    }
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 5 + rnd() * 6;
      shrooms.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, rot: rnd() * 6.28, scale: 0.7 + rnd() * 0.6 });
    }
    return { groups, rocks, smallRocks, grass, shrooms };
  }, []);
}

export function Forest() {
  const f = useForest();
  return (
    <group>
      <Instances url={pineA.url} size={8} items={f.groups[0]} />
      <Instances url={pineB.url} size={7.2} items={f.groups[1]} />
      <Instances url={pineRound.url} size={5.4} items={f.groups[2]} />
      <Instances url={pineDefault.url} size={6.2} items={f.groups[3]} />
      <Instances url={rockLarge.url} size={0.7} items={f.rocks} />
      <Instances url={rockSmall.url} size={0.45} items={f.smallRocks} />
      <Instances url={grassModel.url} size={0.35} items={f.grass} />
      <Instances url={mushroomsModel.url} size={0.32} items={f.shrooms} />
    </group>
  );
}

/* ---------------- Camp props ---------------- */

export function CampProps() {
  const seats = [
    { a: 0.55, r: 2.35 },
    { a: 2.35, r: 2.45 },
    { a: -2.0, r: 2.4 },
  ];
  return (
    <group>
      <Model url={stonesModel.url} size={1.5} fit="width" />
      <Model url={logsModel.url} size={1.0} fit="width" position={[0, 0.02, 0]} rotation={0.4} />
      {seats.map((s, i) => (
        <Model key={i} url={logSeat.url} size={1.45} fit="width" position={[Math.cos(s.a) * s.r, 0, Math.sin(s.a) * s.r]} rotation={-s.a + Math.PI / 2} />
      ))}
    </group>
  );
}

/* ---------------- Hotspots ---------------- */

function Hotspot({ id, children, markerY, position, hit }: { id: SectionId; children: ReactNode; markerY: number; position: THREE.Vector3; hit: [number, number] }) {
  const setFocus = useCamp((s) => s.setFocus);
  const setHovered = useCamp((s) => s.setHovered);
  const hovered = useCamp((s) => s.hovered === id);
  const focus = useCamp((s) => s.focus);
  const entered = useCamp((s) => s.entered);
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const section = sections.find((s) => s.id === id)!;

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-10 * Math.min(dt, 0.05));
    if (group.current) {
      const target = hovered ? 1.05 : 1;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, target, k));
    }
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      const goal = hovered ? 0.9 : focus === id ? 0.35 : 0.0;
      m.opacity = THREE.MathUtils.lerp(m.opacity, goal + Math.sin(state.clock.elapsedTime * 3) * 0.05 * goal, k);
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(null);
    document.body.style.cursor = "";
  };

  return (
    <group position={position}>
      <group
        ref={group}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation();
          setFocus(id);
        }}
      >
        {children}
        <mesh position={[0, hit[1] / 2, 0]} visible={false}>
          <cylinderGeometry args={[hit[0], hit[0], hit[1], 10]} />
        </mesh>
      </group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.95, 1.12, 48]} />
        <meshBasicMaterial color="#ffc27a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {entered && focus === "overview" && (
        <Html position={[0, markerY, 0]} center zIndexRange={[30, 20]}>
          <button
            type="button"
            className="hotspot-pin"
            data-active={hovered ? "" : undefined}
            onClick={() => setFocus(id)}
            onPointerEnter={() => setHovered(id)}
            onPointerLeave={() => setHovered(null)}
            aria-label={`${section.place}: ${section.title}`}
          >
            <span className="hotspot-dot">{section.index}</span>
            <span className="hotspot-label">
              <strong>{section.place}</strong>
              <em>{section.title}</em>
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}

export function Hotspots() {
  return (
    <>
      <Hotspot id="fire" position={new THREE.Vector3(0, 0, 0)} markerY={2.1} hit={[0.85, 1.6]}>
        {null}
      </Hotspot>
      <Hotspot id="skills" position={CHEST} markerY={1.35} hit={[0.75, 0.9]}>
        <Model url={chestModel.url} size={0.95} fit="width" rotation={-2.1} />
        <Model url={axeModel.url} size={0.8} position={[0.62, 0, 0.2]} rotation={0.6} />
      </Hotspot>
      <Hotspot id="sky" position={TELESCOPE} markerY={2.2} hit={[0.5, 1.8]}>
        <Telescope />
      </Hotspot>
      <Hotspot id="tent" position={TENT} markerY={3} hit={[1.5, 2.2]}>
        <Model url={tentModel.url} size={2.9} fit="width" rotation={0.9} />
        <group position={[LANTERN.x - TENT.x, 0, LANTERN.z - TENT.z]}>
          <Model url={stumpModel.url} size={0.5} />
          <Lantern />
        </group>
      </Hotspot>
    </>
  );
}

/* ---------------- Telescope (procedural) ---------------- */

const brass = new THREE.MeshStandardMaterial({ color: "#c79a52", metalness: 0.55, roughness: 0.35 });
const darkWood = new THREE.MeshStandardMaterial({ color: "#4a3324", roughness: 0.85 });
const blackMetal = new THREE.MeshStandardMaterial({ color: "#1b1d22", metalness: 0.4, roughness: 0.5 });

function Telescope() {
  const mountY = 1.12;
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), SKY_DIR), []);
  const legs = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
  return (
    <group>
      {legs.map((a, i) => {
        const foot = new THREE.Vector3(Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45);
        const top = new THREE.Vector3(0, mountY, 0);
        const mid = foot.clone().add(top).multiplyScalar(0.5);
        const len = foot.distanceTo(top);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
        return (
          <mesh key={i} position={mid} quaternion={q} material={darkWood}>
            <cylinderGeometry args={[0.025, 0.035, len, 6]} />
          </mesh>
        );
      })}
      <mesh position={[0, mountY, 0]} material={blackMetal}>
        <sphereGeometry args={[0.07, 12, 8]} />
      </mesh>
      <group position={[0, mountY + 0.05, 0]} quaternion={quat}>
        <mesh position={[0, 0.2, 0]} material={brass}>
          <cylinderGeometry args={[0.075, 0.06, 1.05, 16]} />
        </mesh>
        <mesh position={[0, 0.74, 0]} material={blackMetal}>
          <cylinderGeometry args={[0.095, 0.085, 0.12, 16]} />
        </mesh>
        <mesh position={[0, -0.4, 0]} material={blackMetal}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 10]} />
        </mesh>
        <mesh position={[0.09, 0.32, 0]} material={blackMetal}>
          <cylinderGeometry args={[0.022, 0.022, 0.32, 8]} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- Lantern (procedural) ---------------- */

function Lantern() {
  const lit = useCamp((s) => s.lanternLit);
  const light = useRef<THREE.PointLight>(null);
  const glass = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const level = useRef(0);
  const haloMap = useMemo(() => radialTexture([[0, "rgba(255,210,130,0.9)"], [0.3, "rgba(255,170,80,0.25)"], [1, "rgba(255,150,60,0)"]]), []);
  const [frame] = useState(() => new THREE.MeshStandardMaterial({ color: "#2b2b2e", metalness: 0.5, roughness: 0.45 }));

  useFrame((state, dt) => {
    level.current = THREE.MathUtils.lerp(level.current, lit ? 1 : 0.06, 1 - Math.exp(-2.5 * Math.min(dt, 0.05)));
    const t = state.clock.elapsedTime;
    const f = level.current * (0.93 + 0.07 * Math.sin(t * 13.0) * Math.sin(t * 4.7));
    if (light.current) light.current.intensity = 7 * f;
    if (glass.current) glass.current.emissiveIntensity = 0.2 + 3.2 * f;
    if (halo.current) halo.current.opacity = f;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <mesh position={[0, 0.03, 0]} material={frame}>
        <cylinderGeometry args={[0.11, 0.12, 0.06, 12]} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.22, 12]} />
        <meshStandardMaterial ref={glass} color="#ffe2ad" emissive="#ffb54d" emissiveIntensity={0.2} transparent opacity={0.85} roughness={0.2} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.095, 0.17, Math.sin((i * Math.PI) / 2) * 0.095]} material={frame}>
          <boxGeometry args={[0.014, 0.24, 0.014]} />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0]} material={frame}>
        <coneGeometry args={[0.12, 0.1, 12]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={frame}>
        <torusGeometry args={[0.05, 0.008, 6, 16]} />
      </mesh>
      <pointLight ref={light} position={[0, 0.2, 0]} color="#ffbf66" intensity={0} distance={0} decay={1.8} />
      <sprite position={[0, 0.18, 0]} scale={1.1}>
        <spriteMaterial ref={halo} map={haloMap} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0} fog={false} />
      </sprite>
    </group>
  );
}
