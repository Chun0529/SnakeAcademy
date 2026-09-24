export async function makeCardFile(card: any): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("此瀏覽器無法繪製卡面。");
  const color =
    card.rarity === "SSR"
      ? "#9dea91"
      : card.rarity === "SR"
        ? "#d4af37"
        : card.rarity === "R"
          ? "#c7d2d3"
          : "#899e88";
  const background = ctx.createLinearGradient(0, 0, 900, 1350);
  background.addColorStop(0, "#24422c");
  background.addColorStop(1, "#08120d");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, 900, 1350);
  if (card.image) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const timeout = window.setTimeout(
        () => reject(new Error("圖片載入逾時，請稍後再試。")),
        15000
      );
      img.onload = () => {
        clearTimeout(timeout);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("無法載入人物圖片，請確認網路後再試。"));
      };
      img.src = card.image;
    });
    const x = 44,
      y = 145,
      w = 812,
      h = 1150;
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(
      image,
      x + (w - image.naturalWidth * scale) / 2,
      y + (h - image.naturalHeight * scale) * 0.35,
      image.naturalWidth * scale,
      image.naturalHeight * scale
    );
    ctx.restore();
  } else {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    [190, 220, 235].forEach(r => {
      ctx.beginPath();
      ctx.arc(450, 620, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    try {
      const crest = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("crest"));
        img.src = `${import.meta.env.BASE_URL}crest.png`;
      });
      ctx.drawImage(crest, 330, 500, 240, 280);
    } catch {
      ctx.font = "150px serif";
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("SA", 450, 670);
      ctx.textAlign = "left";
    }
    ctx.globalAlpha = 1;
  }
  const shade = ctx.createLinearGradient(0, 560, 0, 1290);
  shade.addColorStop(0, "rgba(5,15,9,0)");
  shade.addColorStop(0.55, "rgba(5,15,9,.62)");
  shade.addColorStop(1, "#051109");
  ctx.fillStyle = shade;
  ctx.fillRect(44, 145, 812, 1150);
  if (card.rarity === "SR" || card.rarity === "SSR") {
    const foil = ctx.createLinearGradient(0, 1200, 900, 0);
    foil.addColorStop(0, "transparent");
    foil.addColorStop(0.4, "rgba(171,228,147,0)");
    foil.addColorStop(0.47, "rgba(216,246,196,.14)");
    foil.addColorStop(0.51, "rgba(225,212,158,.21)");
    foil.addColorStop(0.57, "transparent");
    foil.addColorStop(1, "transparent");
    ctx.fillStyle = foil;
    ctx.fillRect(44, 145, 812, 1145);
  }
  const metal = ctx.createLinearGradient(0, 0, 900, 1350);
  metal.addColorStop(0, color);
  metal.addColorStop(0.3, "#f6ebca");
  metal.addColorStop(0.6, color);
  metal.addColorStop(1, "#4f6b43");
  ctx.strokeStyle = metal;
  ctx.lineWidth = 7;
  ctx.strokeRect(24, 24, 852, 1302);
  ctx.lineWidth = 1;
  ctx.strokeRect(39, 39, 822, 1272);
  [
    [48, 48],
    [852, 48],
    [48, 1302],
    [852, 1302],
  ].forEach(([x, y]) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = color;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  });
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    fill: string,
    font = '"Noto Sans TC", sans-serif'
  ) => {
    ctx.fillStyle = fill;
    ctx.font = `${size}px ${font}`;
    ctx.fillText(value, x, y);
  };
  text(
    "S N A K E  A C A D E M Y",
    65,
    91,
    24,
    "#eee7d1",
    '"DM Mono", monospace'
  );
  text(
    "COLLECTOR’S ARCHIVE  /  VOL. 01",
    66,
    125,
    13,
    "#92a58f",
    '"DM Mono", monospace'
  );
  ctx.textAlign = "right";
  text(card.rarity, 834, 99, 42, color, '"Cormorant Garamond", serif');
  ctx.textAlign = "left";
  text(`${card.department}  /  ${card.rarityName}`, 66, 990, 18, color);
  let fontSize = 48;
  ctx.font = `${fontSize}px "Noto Sans TC", sans-serif`;
  while (ctx.measureText(card.name).width > 768 && fontSize > 24) {
    fontSize--;
    ctx.font = `${fontSize}px "Noto Sans TC", sans-serif`;
  }
  text(card.name, 64, 1058, fontSize, "#f4f0df");
  text(card.roman, 66, 1100, 18, "#b6c9ae", '"DM Mono", monospace');
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(66, 1140);
  ctx.lineTo(834, 1140);
  ctx.stroke();
  text(card.role, 66, 1184, 22, "#e8e0c6");
  ctx.textAlign = "right";
  text(card.stat || "ARCHIVE VALID", 834, 1184, 18, color);
  ctx.textAlign = "left";
  text("智慧 · 野心 · 榮耀", 66, 1235, 17, "#a5b39a");
  text(
    "ARCHIVE EDITION · " + (card.series || "ORIGINAL"),
    66,
    1277,
    12,
    "#7d947c",
    '"DM Mono", monospace'
  );
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      value => (value ? resolve(value) : reject(new Error("PNG 產生失敗。"))),
      "image/png"
    )
  );
  return new File([blob], `${card.id}-snake-academy.png`, {
    type: "image/png",
  });
}
export function downloadCard(file: File) {
  const url = URL.createObjectURL(file),
    link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
