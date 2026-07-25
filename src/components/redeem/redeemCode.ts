export interface RedeemPayload {
  t: string; // 档位名，如「10～20 元」
  e: string; // 档位 emoji
  code: string; // 兑换码
  pin: string; // 6 位确认码
  cost: number; // 消耗珍珠
  ts: number; // 生成时间戳
}

export function encodePayload(p: RedeemPayload): string {
  return btoa(encodeURIComponent(JSON.stringify(p)));
}

export function decodePayload(s: string): RedeemPayload | null {
  try {
    const obj = JSON.parse(decodeURIComponent(atob(s)));
    if (
      obj &&
      typeof obj.code === "string" &&
      typeof obj.pin === "string" &&
      typeof obj.cost === "number" &&
      typeof obj.ts === "number" &&
      typeof obj.t === "string"
    )
      return obj as RedeemPayload;
    return null;
  } catch {
    return null;
  }
}

// 生成给咖啡师扫的核销网址：微信扫码可直接打开这个页面
export function buildVerifyUrl(p: RedeemPayload): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#verify=${encodePayload(p)}`;
}
