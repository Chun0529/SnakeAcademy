import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { academyCards, specialCards } from "./academy-data";

const source = readFileSync(
  new URL("../pages/Home.tsx", import.meta.url),
  "utf8"
);

describe("card pack uses directory portraits", () => {
  it("every roster and special-edition card points at the original site", () => {
    for (const card of [...academyCards, ...specialCards])
      expect(card.image).toMatch(
        /^https:\/\/xiang1224\.github\.io\/SnakeAcademy\/.+\.webp$/
      );
  });
  it("the live pack does not include generated cards without directory photos", () => {
    const pool = source.slice(
      source.indexOf("const cards:"),
      source.indexOf("function scrollToId")
    );
    expect(pool).not.toContain("legacyCards");
    expect(pool).not.toContain("manus-storage");
  });
  it("card IDs stay unique", () => {
    const ids = [...academyCards, ...specialCards].map(card => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(33);
  });
});
