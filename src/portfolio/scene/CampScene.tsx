import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useCamp, perfStats } from "../store";
import { WAYPOINTS } from "./layout";
import { SkyDome, Constellations, HORIZON } from "./Sky";
import { Fire } from "./Fire";
import { Ground, Forest, CampProps, Hotspots, MODEL_URLS } from "./Camp";

MODEL_URLS.forEach((u) => useGLTF.preload(u));

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const IDLE_BEFORE_DRIFT = 7;

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const focus = useCamp((s) => s.focus);
  const entered = useCamp((s) => s.entered);
  const key = entered ? focus : "intro";
  const anim = useRef({ active: true, t: 0, dur: 1.8, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3() });
  const lastInput = useRef(0);
  const offset = useRef({ x: 0, y: 0 });
  const first = useRef(true);

  useEffect(() => {
    const c = controls.current;
    const a = anim.current;
    if (first.current) {
      first.current = false;
      camera.position.copy(WAYPOINTS.intro.pos);
      c?.target.copy(WAYPOINTS.intro.target);
    }
    a.fromPos.copy(camera.position);
    a.fromTarget.copy(c ? c.target : WAYPOINTS.intro.target);
    a.t = 0;
    const dist = a.fromPos.distanceTo(WAYPOINTS[key].pos);
    a.dur = key === "overview" && a.fromPos.y > 6 ? 3.2 : THREE.MathUtils.clamp(1.1 + dist * 0.12, 1.2, 2.2);
    a.active = true;
    if (useCamp.getState().snap) {
      // Deep link (?ponto=...): jump straight to the waypoint.
      a.fromPos.copy(WAYPOINTS[key].pos);
      a.fromTarget.copy(WAYPOINTS[key].target);
      a.t = 0.999;
      useCamp.getState().setSnap(false);
    }
  }, [key, camera]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const c = controls.current;
    if (!c) return;
    const a = anim.current;
    const wp = WAYPOINTS[key];

    if (a.active) {
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = easeInOut(a.t);
      const lift = Math.min(1.6, a.fromPos.distanceTo(wp.pos) * 0.12);
      camera.position.lerpVectors(a.fromPos, wp.pos, e);
      camera.position.y += Math.sin(Math.PI * e) * lift;
      c.target.lerpVectors(a.fromTarget, wp.target, e);
      if (a.t >= 1) a.active = false;
    }

    // Relax orbit limits while flying or star-gazing so the clamp never fights the path.
    const relaxed = a.active || key === "sky" || key === "intro";
    c.minDistance = relaxed ? 0.1 : 1.6;
    c.maxDistance = relaxed ? 200 : 16;
    c.minPolarAngle = relaxed ? 0 : 0.25;
    c.maxPolarAngle = relaxed ? Math.PI : Math.PI * 0.47;
    c.enableRotate = entered && key !== "sky";
    c.enableZoom = entered && key !== "sky";
    c.autoRotate = key === "intro" || (key === "overview" && !a.active && performance.now() / 1000 - lastInput.current > IDLE_BEFORE_DRIFT);
    c.autoRotateSpeed = key === "intro" ? 0.6 : 0.25;

    // Shift the framing so the focused object sits beside the open panel.
    const panel = entered && key !== "overview" && key !== "intro";
    const desktop = size.width >= 1024;
    const goalX = panel && desktop ? Math.min(260, size.width * 0.2) : 0;
    const goalY = panel && !desktop ? size.height * 0.24 : 0;
    const k = 1 - Math.exp(-4 * dt);
    offset.current.x += (goalX - offset.current.x) * k;
    offset.current.y += (goalY - offset.current.y) * k;
    const cam = camera as THREE.PerspectiveCamera;
    const fov = size.width / size.height < 0.8 ? 62 : 50;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    if (Math.abs(offset.current.x) > 0.5 || Math.abs(offset.current.y) > 0.5) {
      cam.setViewOffset(size.width, size.height, offset.current.x, offset.current.y, size.width, size.height);
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }
    c.update();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enablePan={false}
      rotateSpeed={0.55}
      zoomSpeed={0.6}
      onStart={() => {
        anim.current.active = false;
        lastInput.current = Number.POSITIVE_INFINITY;
      }}
      onEnd={() => {
        lastInput.current = performance.now() / 1000;
      }}
    />
  );
}

function ReadySignal() {
  const setReady = useCamp((s) => s.setReady);
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 3) setReady(true);
  });
  return null;
}

function Stats() {
  const { gl } = useThree();
  const acc = useRef({ t: 0, n: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n++;
    if (a.t >= 0.5) {
      perfStats.fps = Math.round(a.n / a.t);
      perfStats.calls = gl.info.render.calls;
      perfStats.triangles = gl.info.render.triangles;
      a.t = 0;
      a.n = 0;
    }
  });
  return null;
}

function Lights() {
  return (
    <>
      <hemisphereLight args={["#5a6fb0", "#1a140e", 0.9]} />
      <directionalLight position={[-12, 22, -10]} intensity={0.55} color="#a9bcff" />
      <directionalLight position={[6, 14, -24]} intensity={0.35} color="#58f0b4" />
      <ambientLight intensity={0.12} color="#8090c0" />
      <Environment resolution={64} environmentIntensity={0.35}>
        <Lightformer intensity={1.5} color="#ff9a4a" position={[0, 1, 0]} scale={[3, 2, 1]} />
        <Lightformer intensity={0.8} color="#5ef2b0" position={[0, 10, -20]} scale={[30, 6, 1]} />
        <Lightformer intensity={0.6} color="#8a6cff" position={[-15, 8, 10]} rotation-y={Math.PI / 2} scale={[20, 4, 1]} />
      </Environment>
    </>
  );
}

export default function CampScene() {
  const ready = useCamp((s) => s.ready);
  const fogColor = useMemo(() => HORIZON.clone(), []);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: WAYPOINTS.intro.pos.toArray(), fov: 50, near: 0.1, far: 400 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => useCamp.getState().setHovered(null)}
      >
        <color attach="background" args={["#03050c"]} />
        <fog attach="fog" args={[fogColor, 16, 46]} />
        <Lights />
        <SkyDome />
        <Constellations />
        <Ground />
        <Fire />
        <Suspense fallback={null}>
          <Forest />
          <CampProps />
          <Hotspots />
          <ReadySignal />
        </Suspense>
        <CameraRig />
        <Stats />
      </Canvas>
    </div>
  );
}
