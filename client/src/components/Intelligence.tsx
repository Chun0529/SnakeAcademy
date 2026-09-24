import { useEffect, useRef, useState } from "react";
import { ArrowRight, Lock, Search, X, ExternalLink } from "lucide-react";
import reference from "@/lib/reference-data.json";
import GatheringMap from "@/components/GatheringMap";
function asset(url?: string) {
  if (!url) return "";
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}
function IntelShot({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt: string;
  caption: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <figure className="intel-shot">
      <img src={asset(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
function ProfessorCard({
  person,
}: {
  person: {
    id: number;
    type: string;
    name: string;
    title: string;
    house?: string;
    expertise?: string;
    bio?: string;
    note?: string;
    image?: string;
    sourceImage?: string;
    liveUrl?: string;
  };
}) {
  const [failed, setFailed] = useState(false);
  const src = asset(
    ("sourceImage" in person && person.sourceImage) || person.image
  );
  return (
    <article className="intel-professor">
      <div className="intel-portrait">
        {failed || !src ? (
          <span className="intel-portrait-fallback">{person.name.slice(0, 1)}</span>
        ) : (
          <img
            src={src}
            alt={person.name}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
        {person.liveUrl ? (
          <a href={person.liveUrl} target="_blank" rel="noreferrer">
            前往直播間 <ExternalLink size={12} />
          </a>
        ) : (
          <span>尚未放上連結</span>
        )}
      </div>
      <small>
        {person.house === "snake" ? "毒蛇學院" : person.house || "學院教職員"} /{" "}
        {person.title}
      </small>
      <h4>{person.name}</h4>
      <p>
        <b>授課專長</b> {person.expertise || "學院教學與指導"}
      </p>
      <p>{person.bio || "原站尚未補充簡介。"}</p>
      {person.note && <p className="intel-warning">注意 / {person.note}</p>}
    </article>
  );
}
export const intelTabs = [
  { id: "gathering", title: "採集相關", english: "GATHERING" },
  { id: "stones", title: "魔法石相關", english: "MAGIC STONES" },
  { id: "tablets", title: "禁忌的石碑", english: "FORBIDDEN TABLETS" },
  { id: "professors", title: "教授們相關", english: "PROFESSORS" },
];
const sessionKey = "snake-intel-session";
function sessionValid() {
  try {
    return Number(sessionStorage.getItem(sessionKey)) > Date.now();
  } catch {
    return false;
  }
}
export default function Intelligence({
  request,
}: {
  request: { tab: string; tick: number };
}) {
  const [tab, setTab] = useState("gathering"),
    [unlocked, setUnlocked] = useState(sessionValid),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [stoneKind, setStoneKind] = useState("全部");
  const dialog = useRef<HTMLDialogElement>(null),
    expiry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startExpiry = () => {
    if (expiry.current) clearTimeout(expiry.current);
    let remaining = 0;
    try {
      remaining = Number(sessionStorage.getItem(sessionKey)) - Date.now();
    } catch {}
    expiry.current = setTimeout(
      () => setUnlocked(false),
      Math.max(0, remaining)
    );
  };
  useEffect(() => {
    if (unlocked) startExpiry();
    return () => {
      if (expiry.current) clearTimeout(expiry.current);
    };
  }, [unlocked]);
  const go = (next: string) => {
    setTab(next);
    setSearch("");
    setStoneKind("全部");
    const valid = sessionValid();
    setUnlocked(valid);
    if (next !== "professors" && !valid) {
      setError("");
      dialog.current?.showModal();
    } else
      document.getElementById("intel")?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (request.tick) go(request.tab);
  }, [request.tick]);
  const active = intelTabs.find(t => t.id === tab)!;
  const matches = (v: unknown) =>
    JSON.stringify(v).toLowerCase().includes(search.toLowerCase());
  const professors = reference.people
    .filter(p => p.type === "faculty")
    .filter(matches);
  const stoneKinds = [
    "全部",
    ...Array.from(new Set(reference.magicStones.map(stone => stone.kind))),
  ];
  const stones = reference.magicStones.filter(
    stone =>
      (stoneKind === "全部" || stone.kind === stoneKind) && matches(stone)
  );
  const foundTablets = reference.forbiddenTablets.filter(
    tablet => tablet.discovered
  ).length;
  return (
    <section id="intel" className="intel-section content-section">
      <div className="section-heading">
        <div>
          <p className="section-kicker">03 / ACADEMY INTELLIGENCE</p>
          <h2>
            情報<span>區</span>
          </h2>
        </div>
        <div className="heading-aside">
          <Lock size={15} />
          <br />
          {unlocked ? "ACCESS GRANTED" : "MEMBERS ARCHIVE"}
        </div>
      </div>
      <div className="intel-panel">
        <div className="intel-tab-list" role="tablist" aria-label="情報分類">
          {intelTabs.map(t => (
            <button
              key={t.id}
              role="tab"
              id={"tab-" + t.id}
              aria-selected={tab === t.id}
              aria-controls="intel-content"
              className={tab === t.id ? "active" : ""}
              onClick={() => go(t.id)}
            >
              <span>{t.title}</span>
              <small>{t.english}</small>
            </button>
          ))}
        </div>
        <div
          id="intel-content"
          role="tabpanel"
          aria-labelledby={"tab-" + tab}
          className="intel-tab-content"
        >
          <div className="intel-content-title">
            <div>
              <p className="section-kicker">{active.english} / ARCHIVE</p>
              <h3>{active.title}</h3>
            </div>
            {(unlocked || tab === "professors") && (
              <label className="search-box">
                <Search size={16} />
                <input
                  aria-label="搜尋情報"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜尋名稱、用途或專長"
                />
              </label>
            )}
          </div>
          {!unlocked && tab !== "professors" ? (
            <div className="intel-lock-card">
              <Lock size={32} />
              <h4>情報區已上鎖</h4>
              <p>輸入學院通行密語，開啟採集資源與失落的歷史。</p>
              <button
                className="button-primary"
                onClick={() => dialog.current?.showModal()}
              >
                輸入密語 <ArrowRight size={15} />
              </button>
              <small>前端互動入口，不是安全認證機制。</small>
            </div>
          ) : (
            <>
              {tab === "gathering" && (
                <>
                  <div className="intel-records">
                    {reference.gatheringSpots.filter(matches).map(item => (
                      <article key={item.id}>
                        <small>
                          GATHERING / {String(item.id).padStart(2, "0")}
                        </small>
                        <span className="intel-type">{item.type}</span>
                        <h4>{item.name}</h4>
                        <p>
                          <b>用途</b> {item.use}
                        </p>
                        <IntelShot
                          src={item.image}
                          alt={`${item.name}採集物`}
                          caption="採集物照片"
                        />
                        <div className="intel-shot-row">
                          <div>
                            <GatheringMap item={item} />
                          </div>
                          <IntelShot
                            src={item.actualImage}
                            alt={`${item.name}實際位置`}
                            caption="實際位置"
                          />
                        </div>
                        <p className="intel-location">位置 / {item.location}</p>
                      </article>
                    ))}
                  </div>
                  <details className="recipe-details">
                    <summary>藥水合成表 · 9 項配方</summary>
                    {reference.craftingRecipes.map(recipe => (
                      <p key={recipe.id}>
                        <b>{recipe.name}</b>
                        <span>
                          {recipe.materials
                            .map(m => `${m.name} ×${m.qty}`)
                            .join(" ＋ ")}
                        </span>
                      </p>
                    ))}
                  </details>
                </>
              )}
              {tab === "stones" && (
                <>
                  <div className="stone-filters" role="group" aria-label="魔法石種類">
                    {stoneKinds.map(kind => (
                      <button
                        key={kind}
                        className={stoneKind === kind ? "active" : ""}
                        onClick={() => setStoneKind(kind)}
                      >
                        {kind}
                      </button>
                    ))}
                    <span>找到 {stones.length} 顆魔法石</span>
                  </div>
                  <div className="intel-records">
                    {stones.map(stone => (
                      <article className="intel-stone" key={stone.id}>
                        <div className="intel-stone-photo">
                          <img
                            src={asset(stone.image)}
                            alt={stone.name}
                            loading="lazy"
                          />
                          <span>{stone.kind}</span>
                        </div>
                        <div>
                          <small>ARCANE / {String(stone.id).padStart(2, "0")}</small>
                          <h4>{stone.name}</h4>
                          <p>
                            <b>用途</b> {stone.use}
                          </p>
                          <span className="intel-tag">
                            {stone.tags.map(tag => `#${tag}`).join(" ")}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                  {stones.length === 0 && (
                    <p className="intel-search-hint">沒有找到符合條件的魔法石。</p>
                  )}
                </>
              )}
              {tab === "tablets" && (
                <>
                  <p className="intel-summary">
                    已尋獲 {foundTablets} / {reference.forbiddenTablets.length}{" "}
                    塊石碑。傳說中的第八塊，真偽尚未證實。
                  </p>
                  <div className="tablet-progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${(foundTablets / reference.forbiddenTablets.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="intel-records tablet-records">
                    {reference.forbiddenTablets.filter(matches).map(stone => (
                      <article
                        key={stone.id}
                        className={!stone.discovered ? "undiscovered" : ""}
                      >
                        <small>
                          TABLET / {String(stone.id).padStart(2, "0")}
                        </small>
                        <h4>
                          {stone.discovered ? stone.subtitle : "尚未尋獲"}
                        </h4>
                        {stone.lines?.map(line => (
                          <p key={line}>{line}</p>
                        ))}
                      </article>
                    ))}
                  </div>
                </>
              )}
              {tab === "professors" && (
                <div className="intel-records">
                  {professors.map(p => (
                    <ProfessorCard key={`${p.type}-${p.id}`} person={p} />
                  ))}
                </div>
              )}
              {search && (
                <p className="intel-search-hint">
                  若無結果，請嘗試其他名稱或清除搜尋條件。
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <dialog
        ref={dialog}
        className="intel-gate-modal"
        onClick={e => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            if (password === "bigsnake") {
              try {
                sessionStorage.setItem(
                  sessionKey,
                  String(Date.now() + 30 * 60 * 1000)
                );
              } catch {
                setError("瀏覽器禁止儲存，請開啟工作階段儲存後重試。");
                return;
              }
              setUnlocked(true);
              setPassword("");
              setError("");
              dialog.current?.close();
              document
                .getElementById("intel")
                ?.scrollIntoView({ behavior: "smooth" });
            } else setError("密語不正確，請再試一次。");
          }}
        >
          <div className="intel-gate-top">
            <span className="intel-gate-symbol">ϟ</span>
            <button
              type="button"
              className="icon-button"
              aria-label="關閉密語視窗"
              onClick={() => dialog.current?.close()}
            >
              <X size={18} />
            </button>
          </div>
          <p className="section-kicker">SNAKE ACADEMY · CLASSIFIED</p>
          <h2>情報區已上鎖</h2>
          <p>請輸入學院通行密語。驗證後本分頁有效 30 分鐘。</p>
          <label className="password-field">
            <Lock size={16} />
            <input
              autoFocus
              aria-label="通行密語"
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="ENTER PASSPHRASE"
              required
            />
          </label>
          <p className="intel-error" role="alert">
            {error}
          </p>
          <button className="button-primary intel-submit" type="submit">
            解鎖情報檔案 <ArrowRight size={15} />
          </button>
          <small className="intel-hint">
            僅供沉浸式體驗 · 前端密語不是權限保護
          </small>
        </form>
      </dialog>
    </section>
  );
}
