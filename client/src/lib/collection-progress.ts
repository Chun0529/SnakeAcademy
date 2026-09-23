export const RARITY_FILTERS = ["全部", "SSR", "SR", "R", "N"] as const;
export type RarityFilter = (typeof RARITY_FILTERS)[number];
export const MILESTONES = [
  {
    percent: 25,
    title: "翠影尋跡者",
    english: "EMERALD SEEKER",
    description: "在學院的暗影中，找到了第一批秘密。",
  },
  {
    percent: 50,
    title: "秘典收藏家",
    english: "ARCHIVE KEEPER",
    description: "半座學院的故事，已由你妥善珍藏。",
  },
  {
    percent: 75,
    title: "禁書守護者",
    english: "FORBIDDEN GUARDIAN",
    description: "只差最後幾頁，禁忌之書即將完整。",
  },
  {
    percent: 100,
    title: "萬蛇典藏之主",
    english: "MASTER OF SERPENTS",
    description: "每一張卡牌、每一個秘密，盡收於此。",
  },
] as const;
export type Milestone = (typeof MILESTONES)[number];
export const ACHIEVEMENT_KEY = "snake-academy-achievements-v1";
export interface AchievementRecord {
  unlocked: number[];
  celebrated: number[];
  equipped: number | null;
}
export function reachedMilestones(owned: number, total: number): Milestone[] {
  if (total <= 0) return [];
  return MILESTONES.filter(m => Math.max(0, owned) * 100 >= total * m.percent);
}
export function readAchievements(): AchievementRecord {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACHIEVEMENT_KEY) || "{}");
    const valid = (list: unknown): number[] =>
      Array.isArray(list)
        ? Array.from(
            new Set(list.filter(x => MILESTONES.some(m => m.percent === x)))
          )
        : [];
    const unlocked = valid(parsed.unlocked);
    return {
      unlocked,
      celebrated: valid(parsed.celebrated),
      equipped: unlocked.includes(parsed.equipped) ? parsed.equipped : null,
    };
  } catch {
    return { unlocked: [], celebrated: [], equipped: null };
  }
}
export function filterCollection<T extends { id: string; rarity: string }>(
  cards: T[],
  owned: string[],
  rarity: RarityFilter,
  onlyOwned: boolean
) {
  const ids = new Set(owned);
  return cards.filter(
    card =>
      (rarity === "全部" || card.rarity === rarity) &&
      (!onlyOwned || ids.has(card.id))
  );
}
