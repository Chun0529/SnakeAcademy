import reference from "./reference-data.json";
export const REFERENCE_URL = "https://xiang1224.github.io/SnakeAcademy/";
function publicAsset(url: string) {
  if (!/^https?:\/\//i.test(url)) return url;
  return new URL(url).href;
}
const types: Record<string, string> = {
  faculty: "教授",
  leader: "學生幹部",
  gifted: "資優生",
  student: "學生",
};
export const roster = reference.people
  .filter(p => !p.intelOnly && (!p.house || p.house === "snake"))
  .map(p => ({
    id: `source-${p.type}-${p.id}`,
    name: p.name,
    roman: `ACADEMY DOSSIER · ${String(p.id).padStart(3, "0")}`,
    role: p.title,
    department:
      p.type === "faculty"
        ? p.expertise || "學院教學"
        : p.type === "leader"
          ? "班級事務"
          : p.type === "gifted"
            ? "資優生組"
            : "學院學生",
    year: "2026",
    type: types[p.type],
    bio: p.bio || "原站尚未提供更多個人簡介。",
    quote: "",
    image: publicAsset(
      ("sourceImage" in p && p.sourceImage) || p.image
    ),
    color: p.type === "faculty" ? "gold" : "green",
    source: REFERENCE_URL,
    series: "師生名錄",
  }));
export const academyCards = roster.map(p => ({
  ...p,
  rarity:
    p.type === "教授"
      ? "SR"
      : ["學生幹部", "資優生"].includes(p.type)
        ? "R"
        : "N",
  rarityName:
    p.type === "教授"
      ? "SUPER RARE"
      : ["學生幹部", "資優生"].includes(p.type)
        ? "RARE"
        : "NORMAL",
  desc: p.bio,
  stat: `檔案 ${p.id.split("-").pop()?.padStart(3, "0")}`,
  icon: undefined,
}));
export const specialCards = academyCards
  .filter(p => p.type === "教授")
  .map(p => ({
    ...p,
    id: p.id + "-ssr",
    role: p.role + " · 全圖典藏版",
    rarity: "SSR",
    rarityName: "SECRET SUPER RARE",
    series: "典藏特別版",
    stat: "LIMITED EDITION",
  }));
export const typeFilters = ["全部", "教授", "學生", "學生幹部", "資優生"];
export const deptFilters = [
  "全部系所",
  ...Array.from(new Set(roster.map(p => p.department))),
];
