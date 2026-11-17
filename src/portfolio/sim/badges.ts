// Tiny 2D rigid-box physics for the skill badges. Pure TS: no React, no DOM.

export type Body = {
  id: string;
  x: number; // center
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  dragged: boolean;
};

export type World = { width: number; height: number; bodies: Body[] };

export const GRAVITY = 2200;
export const AIR_DRAG = 0.6;
export const RESTITUTION = 0.32;
export const FLOOR_FRICTION = 7;
const ITERATIONS = 5;

export function createWorld(width: number, height: number, sizes: { id: string; w: number; h: number }[], seed = 1): World {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const bodies = sizes.map((b, i) => ({
    id: b.id,
    w: b.w,
    h: b.h,
    x: Math.min(width - b.w / 2, Math.max(b.w / 2, b.w / 2 + rnd() * (width - b.w))),
    y: -b.h * (1 + i * 1.2),
    vx: (rnd() - 0.5) * 200,
    vy: 0,
    dragged: false,
  }));
  return { width, height, bodies };
}

export function step(world: World, dtRaw: number) {
  const dt = Math.min(dtRaw, 1 / 30);
  const { bodies, width, height } = world;
  for (const b of bodies) {
    if (b.dragged) continue;
    b.vy += GRAVITY * dt;
    const damp = Math.exp(-AIR_DRAG * dt);
    b.vx *= damp;
    b.vy *= damp;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  for (let it = 0; it < ITERATIONS; it++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) collide(bodies[i]!, bodies[j]!);
    }
    for (const b of bodies) walls(b, width, height, dt);
  }
}

function walls(b: Body, width: number, height: number, dt: number) {
  const hw = b.w / 2;
  const hh = b.h / 2;
  if (b.x - hw < 0) {
    b.x = hw;
    if (b.vx < 0) b.vx = -b.vx * RESTITUTION;
  }
  if (b.x + hw > width) {
    b.x = width - hw;
    if (b.vx > 0) b.vx = -b.vx * RESTITUTION;
  }
  if (b.y + hh > height) {
    b.y = height - hh;
    if (b.vy > 0) b.vy = Math.abs(b.vy) < 60 ? 0 : -b.vy * RESTITUTION;
    b.vx *= Math.exp(-FLOOR_FRICTION * dt);
  }
}

function collide(a: Body, b: Body) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ox = (a.w + b.w) / 2 - Math.abs(dx);
  const oy = (a.h + b.h) / 2 - Math.abs(dy);
  if (ox <= 0 || oy <= 0) return;
  const wa = a.dragged ? 0 : b.dragged ? 1 : 0.5;
  const wb = 1 - wa;
  if (a.dragged && b.dragged) return;
  if (ox < oy) {
    const sx = Math.sign(dx) || 1;
    a.x -= sx * ox * wa;
    b.x += sx * ox * wb;
    const rel = b.vx - a.vx;
    if (rel * sx < 0) {
      const imp = -(1 + RESTITUTION) * rel;
      if (!a.dragged) a.vx -= imp * wa;
      if (!b.dragged) b.vx += imp * wb;
    }
  } else {
    const sy = Math.sign(dy) || 1;
    a.y -= sy * oy * wa;
    b.y += sy * oy * wb;
    const rel = b.vy - a.vy;
    if (rel * sy < 0) {
      const imp = -(1 + RESTITUTION) * rel;
      if (!a.dragged) a.vy -= imp * wa;
      if (!b.dragged) b.vy += imp * wb;
      // Friction between stacked badges.
      const fr = (b.vx - a.vx) * 0.15;
      if (!a.dragged) a.vx += fr;
      if (!b.dragged) b.vx -= fr;
    }
  }
}

export function grab(world: World, id: string) {
  const b = world.bodies.find((x) => x.id === id);
  if (b) b.dragged = true;
}

export function dragTo(world: World, id: string, x: number, y: number, dt: number) {
  const b = world.bodies.find((x) => x.id === id);
  if (!b) return;
  const nx = Math.min(world.width - b.w / 2, Math.max(b.w / 2, x));
  const ny = Math.min(world.height - b.h / 2, Math.max(b.h / 2, y));
  const d = Math.max(dt, 1 / 120);
  b.vx = (nx - b.x) / d;
  b.vy = (ny - b.y) / d;
  b.x = nx;
  b.y = ny;
}

export function release(world: World, id: string) {
  const b = world.bodies.find((x) => x.id === id);
  if (!b) return;
  b.dragged = false;
  const max = 2400;
  b.vx = Math.max(-max, Math.min(max, b.vx));
  b.vy = Math.max(-max, Math.min(max, b.vy));
}

export function shake(world: World, strength = 900) {
  for (const b of world.bodies) {
    if (b.dragged) continue;
    b.vy -= strength * (0.6 + Math.random() * 0.6);
    b.vx += (Math.random() - 0.5) * strength;
  }
}
