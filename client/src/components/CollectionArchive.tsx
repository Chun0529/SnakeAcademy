import { useMemo, useState, type ReactNode } from "react";
import {
  Crown,
  Lock,
  SlidersHorizontal,
  Sparkles,
  X,
  ArrowRight,
  ZoomIn,
} from "lucide-react";
import {
  filterCollection,
  MILESTONES,
  RARITY_FILTERS,
  type AchievementRecord,
  type Milestone,
  type RarityFilter,
} from "@/lib/collection-progress";
interface Props {
  cards: any[];
  owned: string[];
  record: AchievementRecord;
  equip: (percent: number) => void;
  onClose: () => void;
  onSelect: (card: any) => void;
  renderArt: (card: any) => ReactNode;
  onDraw: () => void;
}
export default function CollectionArchive({
  cards,
  owned,
  record,
  equip,
  onClose,
  onSelect,
  renderArt,
  onDraw,
}: Props) {
  const [rarity, setRarity] = useState<RarityFilter>("全部"),
    [onlyOwned, setOnlyOwned] = useState(false);
  const visible = useMemo(
    () => filterCollection(cards, owned, rarity, onlyOwned),
    [cards, owned, rarity, onlyOwned]
  );
  const percent = cards.length
    ? Math.min(100, (owned.length / cards.length) * 100)
    : 0;
  const next = MILESTONES.find(
    m => owned.length * 100 < cards.length * m.percent
  );
  const equipped = MILESTONES.find(m => m.percent === record.equipped);
  const ownedInFilter = visible.filter(card => owned.includes(card.id)).length;
  return (
    <div className="modal-backdrop archive-backdrop" onClick={onClose}>
      <div
        className="collection-modal archive-v2"
        role="dialog"
        aria-modal="true"
        aria-label="收藏圖鑑"
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-top">
          <div>
            <p className="section-kicker">
              PERSONAL ARCHIVE / THE SERPENT COLLECTION
            </p>
            <h2>
              收藏<span>圖鑑</span>
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="關閉收藏圖鑑"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="archive-summary">
          <div
            className="archive-progress-ring"
            style={
              { "--collection-progress": `${percent}%` } as React.CSSProperties
            }
          >
            <div>
              <strong>
                {percent.toFixed(1)}
                <small>%</small>
              </strong>
              <span>COLLECTED</span>
            </div>
          </div>
          <div className="archive-progress-copy">
            <div className="archive-progress-title">
              <span>
                已收集 <strong>{owned.length}</strong> / {cards.length} 張
              </span>
              <span className="equipped-title">
                <Crown size={13} />
                {equipped?.title || "尚未獲得稱號"}
              </span>
            </div>
            <div
              className="collection-progress archive-progress"
              role="progressbar"
              aria-label="整體收集進度"
              aria-valuemin={0}
              aria-valuemax={cards.length}
              aria-valuenow={owned.length}
              aria-valuetext={`${owned.length} / ${cards.length} 張，${percent.toFixed(1)}%`}
            >
              <div
                className="archive-progress-fill"
                style={{ transform: `scaleX(${percent / 100})` }}
              />
              {MILESTONES.map(m => (
                <i
                  key={m.percent}
                  style={{ left: `${m.percent}%` }}
                  data-reached={percent >= m.percent}
                />
              ))}
            </div>
            <p className="next-milestone">
              {next
                ? `再收集 ${Math.max(0, Math.ceil((cards.length * next.percent) / 100) - owned.length)} 張，解鎖 ${next.percent}% 隱藏稱號。`
                : "全部檔案已解鎖。你的名字，已寫入學院典藏。"}
              <span>進度以全部卡牌計算，不受篩選影響。</span>
            </p>
          </div>
        </div>
        <div className="archive-milestones" aria-label="收集稱號">
          {MILESTONES.map(m => {
            const unlocked = record.unlocked.includes(m.percent);
            return (
              <button
                key={m.percent}
                className={`milestone-badge ${unlocked ? "unlocked" : "sealed"} ${record.equipped === m.percent ? "equipped" : ""}`}
                disabled={!unlocked}
                aria-pressed={record.equipped === m.percent}
                aria-label={
                  unlocked
                    ? `佩戴稱號 ${m.title}`
                    : `${m.percent}% 隱藏稱號未解鎖`
                }
                onClick={() => equip(m.percent)}
              >
                {unlocked ? <Crown size={16} /> : <Lock size={15} />}
                <span>
                  <small>{m.percent}% COLLECTION</small>
                  <b>{unlocked ? m.title : "封存的稱號"}</b>
                </span>
                <em>
                  {record.equipped === m.percent
                    ? "佩戴中"
                    : unlocked
                      ? "可佩戴"
                      : "未解鎖"}
                </em>
              </button>
            );
          })}
        </div>
        <div className="archive-filter-toolbar">
          <div
            className="rarity-filter"
            role="group"
            aria-label="卡牌稀有度篩選"
          >
            {RARITY_FILTERS.map(r => {
              const total = cards.filter(
                  c => r === "全部" || c.rarity === r
                ).length,
                count = cards.filter(
                  c => (r === "全部" || c.rarity === r) && owned.includes(c.id)
                ).length;
              return (
                <button
                  key={r}
                  className={`rarity-filter-button filter-${r.toLowerCase()} ${rarity === r ? "selected" : ""}`}
                  aria-pressed={rarity === r}
                  aria-label={`${r} 稀有度`}
                  onClick={() => setRarity(r)}
                >
                  <span>{r}</span>
                  <small>
                    {count}/{total}
                  </small>
                </button>
              );
            })}
          </div>
          <label className="owned-filter">
            <input
              type="checkbox"
              checked={onlyOwned}
              onChange={e => setOnlyOwned(e.target.checked)}
            />
            只看已收藏
          </label>
        </div>
        <div className="archive-result-count" aria-live="polite">
          <span>
            <SlidersHorizontal size={12} /> 顯示 {visible.length} 張 · 已收藏{" "}
            {ownedInFilter} 張
          </span>
          <small>
            點擊已收藏卡牌，放大欣賞動態卡面 <ZoomIn size={12} />
          </small>
        </div>
        {visible.length ? (
          <div className="collection-grid">
            {visible.map(card => {
              const unlocked = owned.includes(card.id);
              return (
                <button
                  className={`collection-card rarity-${card.rarity.toLowerCase()} ${unlocked ? "owned" : "locked"}`}
                  key={card.id}
                  data-card-id={card.id}
                  data-rarity={card.rarity}
                  aria-label={
                    unlocked
                      ? `放大查看 ${card.name} ${card.rarity}`
                      : `未解鎖 ${card.rarity} 卡牌`
                  }
                  disabled={!unlocked}
                  onClick={() => onSelect(card)}
                >
                  <div className="collection-art">
                    {unlocked ? (
                      renderArt(card)
                    ) : (
                      <>
                        <Lock size={22} />
                        <small>LOCKED ARCHIVE</small>
                      </>
                    )}
                  </div>
                  <span>{unlocked ? card.name : "未解鎖檔案"}</span>
                  <b>{card.rarity}</b>
                  {unlocked && (
                    <span className="collection-zoom-hint">
                      <ZoomIn size={12} />
                      查看卡面
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="archive-empty">
            <Sparkles size={28} />
            <h3>這一頁，等待你的下一次發現。</h3>
            <p>
              尚未收藏符合條件的{rarity === "全部" ? "" : rarity + " "}卡牌。
            </p>
            <div>
              <button
                className="button-ghost"
                onClick={() => {
                  setRarity("全部");
                  setOnlyOwned(false);
                }}
              >
                顯示全部卡牌
              </button>
              <button className="button-primary" onClick={onDraw}>
                前往抽卡 <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
        <p className="archive-local-note">
          收藏與稱號保存在此瀏覽器。未解鎖卡牌不會顯示完整卡面。
        </p>
      </div>
    </div>
  );
}
export function MilestoneCelebration({
  milestones,
  onClose,
}: {
  milestones: Milestone[];
  onClose: () => void;
}) {
  if (!milestones.length) return null;
  const highest = milestones[milestones.length - 1];
  return (
    <aside
      className="milestone-celebration"
      role="status"
      aria-live="polite"
      aria-label="收集里程碑達成"
    >
      <div className="achievement-rays" aria-hidden="true" />
      {Array.from({ length: 14 }, (_, i) => (
        <i
          className="achievement-spark"
          key={i}
          style={{ "--particle": i } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
      <button
        className="achievement-dismiss icon-button"
        aria-label="關閉稱號慶祝"
        onClick={onClose}
      >
        <X size={14} />
      </button>
      <span className="achievement-emblem">
        <Crown size={28} />
      </span>
      <p>{highest.percent}% COLLECTION COMPLETE</p>
      <h3>{highest.title}</h3>
      <span>{highest.description}</span>
      {milestones.length > 1 && (
        <small>
          同時解鎖 {milestones.map(m => `${m.percent}%`).join(" · ")} 稱號
        </small>
      )}
      <b>隱藏稱號已加入圖鑑</b>
    </aside>
  );
}
