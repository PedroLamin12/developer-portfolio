import { describe, expect, it } from "vitest";
import { createWorld, step, grab, dragTo, release } from "./badges";
import { filterSkills, skills, levelLabel } from "../content";

const sizes = Array.from({ length: 8 }, (_, i) => ({ id: `b${i}`, w: 110, h: 34 }));

describe("badge physics", () => {
  it("keeps every badge inside the box after settling", () => {
    const world = createWorld(400, 220, sizes);
    for (let i = 0; i < 600; i++) step(world, 1 / 60);
    for (const b of world.bodies) {
      expect(b.x - b.w / 2).toBeGreaterThanOrEqual(-0.5);
      expect(b.x + b.w / 2).toBeLessThanOrEqual(400.5);
      expect(b.y + b.h / 2).toBeLessThanOrEqual(220.5);
    }
  });

  it("a thrown badge keeps its throw speed on release", () => {
    const world = createWorld(400, 220, sizes.slice(0, 1));
    for (let i = 0; i < 200; i++) step(world, 1 / 60);
    grab(world, "b0");
    dragTo(world, "b0", 100, 100, 1 / 60);
    dragTo(world, "b0", 120, 100, 1 / 60);
    release(world, "b0");
    expect(world.bodies[0].vx).toBeGreaterThan(500);
  });
});

describe("skill filter", () => {
  it("returns only the chosen category, strongest first", () => {
    const front = filterSkills(skills, "Front-end");
    expect(front.every((s) => s.category === "Front-end")).toBe(true);
    for (let i = 1; i < front.length; i++) expect(front[i - 1].level).toBeGreaterThanOrEqual(front[i].level);
    expect(filterSkills(skills, "Todas")).toHaveLength(skills.length);
  });

  it("labels levels by threshold", () => {
    expect(levelLabel(90)).toBe("Domínio");
    expect(levelLabel(72)).toBe("Avançado");
    expect(levelLabel(60)).toBe("Intermediário");
    expect(levelLabel(40)).toBe("Em formação");
  });
});
