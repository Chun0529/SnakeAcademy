export type DrawMode = "pack" | "daily" | "ten";
export interface Drawable {
  id: string;
  rarity: string;
}
export interface DrawRecord {
  id: string;
  at: string;
  mode: DrawMode;
  cards: string[];
  guaranteed: boolean;
}
export interface Ledger {
  version: 2;
  collection: string[];
  dailyDate: string | null;
  history: DrawRecord[];
}
export const LEDGER_KEY = "snake-academy-ledger-v2";
export function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function nextResetDelay(now = Date.now()) {
  const day = 86_400_000,
    offset = 28_800_000;
  return day - ((now + offset) % day) + 100;
}
export function readLedger(): Ledger {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEDGER_KEY) || "null");
    if (
      parsed?.version === 2 &&
      Array.isArray(parsed.collection) &&
      Array.isArray(parsed.history)
    ) {
      return {
        version: 2,
        collection: Array.from(
          new Set<string>(
            parsed.collection.filter((x: unknown) => typeof x === "string")
          )
        ),
        dailyDate:
          typeof parsed.dailyDate === "string" ? parsed.dailyDate : null,
        history: parsed.history.slice(0, 100),
      };
    }
    const legacy = JSON.parse(
      localStorage.getItem("snake-academy-collection") || "[]"
    );
    const daily = JSON.parse(
      localStorage.getItem("snake-academy-daily-draw") || "null"
    );
    return {
      version: 2,
      collection: Array.isArray(legacy)
        ? legacy.filter(x => typeof x === "string")
        : [],
      dailyDate: daily?.date || null,
      history: [],
    };
  } catch {
    return { version: 2, collection: [], dailyDate: null, history: [] };
  }
}
export function writeLedger(ledger: Ledger) {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}
export function randomUnit() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return n[0] / 4294967296;
}
export function drawCards<T extends Drawable>(
  pool: T[],
  mode: DrawMode,
  owned: string[],
  rng: () => number = randomUnit
): { picked: T[]; guaranteed: boolean } {
  if (!pool.length) throw new Error("卡池尚未準備完成。");
  const amount = mode === "ten" ? 10 : mode === "daily" ? 1 : 5;
  const weights: Record<string, number> = { N: 65, R: 25, SR: 8, SSR: 2 };
  const chosen: T[] = [];
  const choose = (available: T[]) => {
    const rarityGroups = Object.keys(weights).filter(r =>
      available.some(c => c.rarity === r)
    );
    if (!rarityGroups.length) throw new Error("卡池稀有度資料無效。");
    const total = rarityGroups.reduce((sum, r) => sum + weights[r], 0);
    let ticket = rng() * total,
      rarity = rarityGroups[rarityGroups.length - 1];
    for (const r of rarityGroups) {
      ticket -= weights[r];
      if (ticket < 0) {
        rarity = r;
        break;
      }
    }
    const options = available.filter(c => c.rarity === rarity);
    return options[
      Math.min(options.length - 1, Math.floor(rng() * options.length))
    ];
  };
  for (let i = 0; i < amount; i++) {
    const unused = pool.filter(c => !chosen.some(p => p.id === c.id));
    const fresh = unused.filter(c => !owned.includes(c.id));
    chosen.push(choose(fresh.length ? fresh : unused.length ? unused : pool));
  }
  let guaranteed = false;
  if (
    mode === "ten" &&
    !chosen.some(c => c.rarity === "SR" || c.rarity === "SSR")
  ) {
    const high = pool.filter(c => c.rarity === "SR" || c.rarity === "SSR");
    if (!high.length) throw new Error("卡池缺少 SR 以上卡牌，無法執行保底。");
    const fresh = high.filter(c => !owned.includes(c.id));
    chosen[chosen.length - 1] = choose(fresh.length ? fresh : high);
    guaranteed = true;
  }
  return { picked: chosen, guaranteed };
}
