import { describe, it, expect } from "vitest";
import {
  filterCollection,
  reachedMilestones,
  MILESTONES,
} from "./collection-progress";
const cards = [
  { id: "a", rarity: "SSR" },
  { id: "b", rarity: "SSR" },
  { id: "c", rarity: "SR" },
  { id: "d", rarity: "R" },
  { id: "e", rarity: "N" },
];
describe("collection filters", () => {
  it("filters each rarity independently", () => {
    for (const rarity of ["SSR", "SR", "R", "N"] as const)
      expect(
        filterCollection(cards, [], rarity, false).every(
          c => c.rarity === rarity
        )
      ).toBe(true);
  });
  it("combines ownership and rarity without changing source or progress", () => {
    const owned = ["a", "c"];
    expect(filterCollection(cards, owned, "SSR", true)).toEqual([cards[0]]);
    expect(filterCollection(cards, owned, "N", true)).toEqual([]);
    expect(cards).toHaveLength(5);
    expect(owned).toHaveLength(2);
  });
  it("All restores full catalogue, or only owned when toggled", () => {
    expect(filterCollection(cards, ["a", "e"], "全部", false)).toHaveLength(5);
    expect(filterCollection(cards, ["a", "e"], "全部", true)).toHaveLength(2);
  });
});
describe("exact collection milestones", () => {
  it("does not award anything at zero or with an empty catalogue", () => {
    expect(reachedMilestones(0, 45)).toEqual([]);
    expect(reachedMilestones(0, 0)).toEqual([]);
  });
  for (const m of MILESTONES) {
    it(`unlocks ${m.percent}% only when mathematically reached`, () => {
      const required = Math.ceil((45 * m.percent) / 100);
      expect(
        reachedMilestones(required - 1, 45).some(x => x.percent === m.percent)
      ).toBe(false);
      expect(
        reachedMilestones(required, 45).some(x => x.percent === m.percent)
      ).toBe(true);
    });
  }
  it("a collection jump unlocks every crossed milestone", () =>
    expect(reachedMilestones(45, 45).map(m => m.percent)).toEqual([
      25, 50, 75, 100,
    ]));
});
