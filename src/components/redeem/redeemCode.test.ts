import { describe, it, expect } from "vitest";
import { encodePayload, decodePayload, type RedeemPayload } from "./redeemCode";

const payload: RedeemPayload = {
  t: "10～20 元",
  e: "🍰",
  code: "b-abc123",
  pin: "888888",
  cost: 15,
  ts: 1752600000000,
};

describe("兑换码编解码", () => {
  it("encode → decode 往返一致（含中文和 emoji）", () => {
    expect(decodePayload(encodePayload(payload))).toEqual(payload);
  });

  it("坏 base64 返回 null", () => {
    expect(decodePayload("!!!not-base64!!!")).toBeNull();
  });

  it("合法 base64 但不是 JSON 返回 null", () => {
    expect(decodePayload(btoa("hello"))).toBeNull();
  });

  it("JSON 但缺少必要字段返回 null", () => {
    const bad = btoa(encodeURIComponent(JSON.stringify({ foo: 1 })));
    expect(decodePayload(bad)).toBeNull();
  });
});
