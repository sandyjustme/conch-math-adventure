import { describe, it, expect } from "vitest";
import { validateGraph } from "./validateGraph";

describe("知识图谱", () => {
  it("无悬空依赖、无循环、无重复 ID", () => {
    const result = validateGraph();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});
