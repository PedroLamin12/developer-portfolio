import { useMemo, useLayoutEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type Part = { geometry: THREE.BufferGeometry; material: THREE.Material; matrix: THREE.Matrix4 };

/**
 * Extracts a GLB's meshes with matrices that normalize the model once:
 * scaled to `size` along `fit`, centered on XZ, base at y=0.
 * Cached scene is never mutated (only its materials are tuned for the night look).
 */
export function useModelParts(url: string, size: number, fit: "height" | "width" = "height"): Part[] {
  const { scene } = useGLTF(url);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const dim = box.getSize(new THREE.Vector3());
    const ref = fit === "height" ? dim.y : Math.max(dim.x, dim.z);
    const s = size / (ref || 1);
    const center = box.getCenter(new THREE.Vector3());
    const norm = new THREE.Matrix4()
      .makeTranslation(-center.x * s, -box.min.y * s, -center.z * s)
      .multiply(new THREE.Matrix4().makeScale(s, s, s));
    const parts: Part[] = [];
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) tuneMaterial(mat);
      const matrix = norm.clone().multiply(m.matrixWorld);
      if (Array.isArray(m.material)) {
        // Split multi-material meshes into groups.
        for (const g of m.geometry.groups) {
          const geo = m.geometry.clone();
          geo.clearGroups();
          geo.setDrawRange(g.start, g.count);
          const mat = m.material[g.materialIndex ?? 0];
          if (mat) parts.push({ geometry: geo, material: mat, matrix });
        }
      } else {
        parts.push({ geometry: m.geometry, material: m.material, matrix });
      }
    });
    return parts;
  }, [scene, size, fit]);
}

const NIGHT_PALETTE: [string, string][] = [
  ["woodbark", "#6a4532"],
  ["wood", "#8a5a3c"],
  ["leafs", "#2c6e5c"],
  ["dirt", "#7a5a44"],
  ["grass", "#3c7a52"],
  ["colorred", "#b9473f"],
];

function tuneMaterial(mat: THREE.Material) {
  if (mat.userData["tuned"]) return;
  mat.userData["tuned"] = true;
  const m = mat as THREE.MeshStandardMaterial;
  if ("metalness" in m) {
    m.metalness = 0;
    m.roughness = Math.max(0.75, m.roughness ?? 1);
  }
  // Re-grade the bright daytime kit palette for a night forest.
  const name = mat.name.toLowerCase();
  const remap = NIGHT_PALETTE.find(([k]) => name.startsWith(k));
  if (remap && m.color) m.color.set(remap[1]);
}

type Xform = { position?: [number, number, number]; rotation?: number; scale?: number };

export function Model({ url, size, fit, position, rotation = 0, scale = 1 }: { url: string; size: number; fit?: "height" | "width" } & Xform) {
  const parts = useModelParts(url, size, fit);
  return (
    <group position={position ?? [0, 0, 0]} rotation-y={rotation} scale={scale}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} matrix={p.matrix} matrixAutoUpdate={false} />
      ))}
    </group>
  );
}

export type Instance = { x: number; y?: number; z: number; rot: number; scale: number };

/** Draws many copies of a model with one draw call per mesh. */
export function Instances({ url, size, fit, items }: { url: string; size: number; fit?: "height" | "width"; items: Instance[] }) {
  const parts = useModelParts(url, size, fit);
  return (
    <>
      {parts.map((p, i) => (
        <InstancedPart key={i} part={p} items={items} />
      ))}
    </>
  );
}

function InstancedPart({ part, items }: { part: Part; items: Instance[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rot);
      m.compose(new THREE.Vector3(it.x, it.y ?? 0, it.z), q, new THREE.Vector3(it.scale, it.scale, it.scale));
      m.multiply(part.matrix);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, part]);
  return <instancedMesh ref={ref} args={[part.geometry, part.material, items.length]} frustumCulled={false} />;
}
