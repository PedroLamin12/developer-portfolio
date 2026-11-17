import * as THREE from "three";

// World layout of the camp. The campfire sits at the origin.
export const FIRE = new THREE.Vector3(0, 0, 0);
export const CHEST = new THREE.Vector3(3.3, 0, 1.7);
export const TELESCOPE = new THREE.Vector3(2.7, 0, -2.3);
export const TENT = new THREE.Vector3(-4.3, 0, -3.1);
export const LANTERN = new THREE.Vector3(-2.35, 0, -1.55);

function dirFromAzEl(azDeg: number, elDeg: number) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  // az 0 = towards -Z, positive az turns towards +X.
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

export const SKY_RADIUS = 95;
export const CONSTELLATION_CENTERS = {
  now: dirFromAzEl(-6, 37),
  exploring: dirFromAzEl(9, 51),
  future: dirFromAzEl(24, 36),
} as const;
export const SKY_DIR = dirFromAzEl(7, 45);
export const MOON_DIR = dirFromAzEl(-38, 24);

export type Waypoint = { pos: THREE.Vector3; target: THREE.Vector3 };

const skyEye = new THREE.Vector3(2.1, 1.55, -1.2);

export const SKY_PORTRAIT: Waypoint = { pos: skyEye, target: skyEye.clone().add(dirFromAzEl(12, 46).multiplyScalar(40)) };

export const WAYPOINTS: Record<"intro" | "overview" | "fire" | "skills" | "sky" | "tent", Waypoint> = {
  intro: { pos: new THREE.Vector3(-6, 9, 17), target: new THREE.Vector3(0, 3.5, -4) },
  overview: { pos: new THREE.Vector3(0.6, 3.3, 9.2), target: new THREE.Vector3(-0.2, 0.9, -0.6) },
  fire: { pos: new THREE.Vector3(2.3, 1.9, 4.4), target: new THREE.Vector3(0, 0.8, 0) },
  skills: { pos: new THREE.Vector3(6.3, 2.3, 5.4), target: new THREE.Vector3(3.2, 0.5, 1.6) },
  sky: { pos: skyEye, target: skyEye.clone().add(SKY_DIR.clone().multiplyScalar(40)) },
  tent: { pos: new THREE.Vector3(0.4, 2.4, 3.2), target: new THREE.Vector3(-3.5, 0.9, -2.5) },
};

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
