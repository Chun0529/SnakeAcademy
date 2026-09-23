import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Box,
  ChevronDown,
  Download,
  GraduationCap,
  Lock,
  Menu,
  History,
  Maximize2,
  Minimize2,
  Search,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import {
  roster,
  academyCards,
  specialCards,
  typeFilters,
  deptFilters,
  REFERENCE_URL,
} from "@/lib/academy-data";
import Intelligence, { intelTabs } from "@/components/Intelligence";
import {
  dayKey,
  readLedger,
  writeLedger,
  drawCards,
  nextResetDelay,
  LEDGER_KEY,
  type DrawMode,
} from "@/lib/draw-engine";
import { playSound, unlockAudio, setSoundEnabled } from "@/lib/sound";
import { makeCardFile, downloadCard } from "@/lib/card-export";
import CollectionArchive, {
  MilestoneCelebration,
} from "@/components/CollectionArchive";
import { useCollectionMilestones } from "@/hooks/useCollectionMilestones";
import NewsTicker from "@/components/NewsTicker";
import BackgroundMusic from "@/components/BackgroundMusic";
import DrawHistory from "@/components/DrawHistory";
import RosterExport from "@/components/RosterExport";
import { academyNews } from "@/lib/academy-news";

const HERO_IMAGE = `${import.meta.env.BASE_URL}manus-storage/snake-academy-hero_24c5d010.png`;

const cards: any[] = [
  ...academyCards,
  ...specialCards.map(card => ({ ...card, series: "師生名錄 · 典藏" })),
];

function scrollToId(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CardArt({ card, compact = false }: { card: any; compact?: boolean }) {
  const Icon = card.icon || Sparkles;
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [card.image]);
  return (
    <div
      className={`card-art card-art-${card.rarity.toLowerCase()} ${compact ? "compact" : ""}`}
    >
      {card.image && !imageFailed ? (
        <img
          src={card.image}
          alt={card.name}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {(!card.image || imageFailed) && (
        <div className="card-art-fallback">
          <Icon size={compact ? 28 : 46} strokeWidth={1.1} />
          <small className="card-image-error" role="status">
            {imageFailed ? "圖片暫時無法載入" : "卡面尚未提供"}
          </small>
        </div>
      )}
      <div className="card-art-vignette" />
      <span className="card-number">
        NO.
        {String(cards.findIndex(item => item.id === card.id) + 1).padStart(
          2,
          "0"
        )}
      </span>
      <span className="card-rarity-stamp">{card.rarity}</span>
      <div className="card-art-copy">
        <small>{card.department}</small>
        <strong>{card.name}</strong>
        <em>{card.roman}</em>
      </div>
    </div>
  );
}

function TradingCard({
  card,
  onClick,
  reveal = true,
}: {
  card: any;
  onClick?: () => void;
  reveal?: boolean;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 40 });
  return (
    <button
      className={`trading-card rarity-${card.rarity.toLowerCase()} ${reveal ? "revealed" : "hidden-card"}`}
      onClick={onClick}
      onPointerMove={event => {
        const rect = event.currentTarget.getBoundingClientRect();
        setShine({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
        setTilt({
          x: ((event.clientY - rect.top) / rect.height - 0.5) * -8,
          y: ((event.clientX - rect.left) / rect.width - 0.5) * 10,
        });
      }}
      onPointerLeave={() => {
        setTilt({ x: 0, y: 0 });
        setShine({ x: 50, y: 40 });
      }}
      style={
        {
          "--tilt-x": `${tilt.x}deg`,
          "--tilt-y": `${tilt.y}deg`,
          "--shine-x": `${shine.x}%`,
          "--shine-y": `${shine.y}%`,
        } as React.CSSProperties
      }
      aria-label={`查看 ${card.name} 卡牌`}
    >
      <div className="trading-card-inner">
        <div className="trading-card-front">
          <CardArt card={card} />
          {(card.rarity === "SR" || card.rarity === "SSR") && (
            <>
              <div className="card-holographic-foil" aria-hidden="true" />
              <div className="card-specular-light" aria-hidden="true" />
            </>
          )}
          <div className="card-meta">
            <span>{card.role}</span>
            <b>{card.stat}</b>
          </div>
        </div>
        <div className="trading-card-back">
          <div className="snake-seal">◈</div>
          <small>SNAKE ACADEMY</small>
          <strong>
            ARCHIVE
            <br />
            SEALED
          </strong>
          <span>TURN TO REVEAL</span>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("intro");
  const [mobileNav, setMobileNav] = useState(false);
  const [typeFilter, setTypeFilter] = useState("全部");
  const [deptFilter, setDeptFilter] = useState("全部系所");
  const [search, setSearch] = useState("");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [detailFromHistory, setDetailFromHistory] = useState(false);
  const closeCardDetail=()=>{setSelectedCard(null);if(detailFromHistory){setDetailFromHistory(false);setHistoryOpen(true);}};
  const [focusedArt, setFocusedArt] = useState(false);
  useEffect(() => setFocusedArt(false), [selectedCard?.id]);
  const [drawnCards, setDrawnCards] = useState<any[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [packOpen, setPackOpen] = useState(false);
  const [tearProgress, setTearProgress] = useState(0);
  const [drawMode, setDrawMode] = useState<"pack" | "daily" | "ten">("pack");
  const [ssrBurst, setSsrBurst] = useState<any>(null);
  const [intelMenu, setIntelMenu] = useState(false);
  const [intelRequest, setIntelRequest] = useState({
    tab: "gathering",
    tick: 0,
  });
  const [shareBusy, setShareBusy] = useState(false);
  const [shareNotice, setShareNotice] = useState("");
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [ledger, setLedger] = useState(readLedger);
  const [today, setToday] = useState(dayKey);
  const [drawBusy, setDrawBusy] = useState(false);
  const [drawNotice, setDrawNotice] = useState("");
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem("snake-sound") !== "off";
    } catch {
      return true;
    }
  });
  const [allPeople, setAllPeople] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastOpen = useRef(0);
  const collection = ledger.collection.filter(id =>
    cards.some(c => c.id === id)
  );
  const achievements = useCollectionMilestones(
    collection.length,
    cards.length,
    drawBusy || !!ssrBurst || !!selectedCard
  );
  const dailyAvailable = ledger.dailyDate !== today;
  const later = (callback: () => void, delay: number) => {
    const id = setTimeout(callback, delay);
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const skipReveal = () => {
    clearTimers();
    setSsrBurst(null);
    setRevealedCount(drawnCards.length);
    setDrawBusy(false);
    busyRef.current = false;
  };
  useEffect(() => () => clearTimers(), []);
  useEffect(() => {
    setSoundEnabled(soundOn);
    try {
      localStorage.setItem("snake-sound", soundOn ? "on" : "off");
    } catch {}
  }, [soundOn]);
  useEffect(() => {
    setAllPeople(false);
  }, [typeFilter, deptFilter, search]);
  useEffect(() => {
    let reset: ReturnType<typeof setTimeout>;
    const sync = () => {
      setToday(dayKey());
      setLedger(readLedger());
      clearTimeout(reset);
      reset = setTimeout(sync, nextResetDelay());
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      clearTimeout(reset);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);
  useEffect(() => {
    setPreparedFile(null);
    setShareNotice("");
    if (!selectedCard) return;
    let cancelled = false;
    setShareBusy(true);
    makeCardFile(selectedCard)
      .then(file => {
        if (!cancelled) setPreparedFile(file);
      })
      .catch(error => {
        if (!cancelled) setShareNotice(error.message || "無法準備卡面。");
      })
      .finally(() => {
        if (!cancelled) setShareBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCard]);
  useEffect(() => {
    if (!selectedCard && !collectionOpen) return;
    const previous = document.activeElement as HTMLElement | null,
      oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const modal = document.querySelector(
      selectedCard ? ".card-detail-modal" : ".collection-modal"
    ) as HTMLElement | null;
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href],input,select"
        ) || []
      );
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectedCard ? closeCardDetail() : setCollectionOpen(false);
      }
      if (event.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [selectedCard, collectionOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveNav(entry.target.id);
        });
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    ["intro", "roster", "intel", "pack", "news"].forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    let animation = 0;
    const particles = Array.from({ length: 34 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2 + 0.4,
      speed: Math.random() * 0.0007 + 0.0002,
      alpha: Math.random() * 0.35 + 0.08,
      phase: index,
    }));
    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -0.02) p.y = 1.02;
        const pulse = Math.sin(frame * 0.02 + p.phase) * 0.18 + 0.82;
        ctx.beginPath();
        ctx.fillStyle = `rgba(57,255,20,${p.alpha * pulse})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#39ff14";
        ctx.arc(
          p.x * width + Math.sin(frame * 0.006 + p.phase) * 9,
          p.y * height,
          p.r,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
      animation = requestAnimationFrame(() => {
        frame += 1;
        draw();
      });
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const filteredRoster = useMemo(
    () =>
      roster.filter(person => {
        const matchesType = typeFilter === "全部" || person.type === typeFilter;
        const matchesDept =
          deptFilter === "全部系所" || person.department === deptFilter;
        const matchesSearch =
          !search ||
          `${person.name} ${person.roman} ${person.role} ${person.department}`
            .toLowerCase()
            .includes(search.toLowerCase());
        return matchesType && matchesDept && matchesSearch;
      }),
    [deptFilter, search, typeFilter]
  );

  const openPack = async (mode: DrawMode = "pack") => {
    if (busyRef.current || performance.now() - lastOpen.current < 400) return;
    busyRef.current = true;
    lastOpen.current = performance.now();
    setDrawBusy(true);
    setDrawNotice("");
    unlockAudio();
    try {
      let outcome: ReturnType<typeof drawCards<any>> | null = null;
      const commit = () => {
        const current = readLedger();
        if (mode === "daily" && current.dailyDate === dayKey())
          throw new Error("今日免費一抽已領取，台北時間午夜重置。");
        const result = drawCards(cards, mode, current.collection);
        const next = {
          ...current,
          collection: Array.from(
            new Set([...current.collection, ...result.picked.map(c => c.id)])
          ),
          dailyDate: mode === "daily" ? dayKey() : current.dailyDate,
          history: [
            {
              id: crypto.randomUUID(),
              at: new Date().toISOString(),
              mode,
              cards: result.picked.map(c => c.id),
              guaranteed: result.guaranteed,
            },
            ...current.history,
          ].slice(0, 100),
        };
        writeLedger(next);
        setLedger(next);
        setToday(dayKey());
        outcome = result;
      };
      if (navigator.locks)
        await navigator.locks.request("snake-academy-draw", commit);
      else commit();
      const { picked, guaranteed } = outcome! as ReturnType<
        typeof drawCards<any>
      >;
      clearTimers();
      setSsrBurst(null);
      setDrawMode(mode);
      setDrawnCards(picked);
      setRevealedCount(0);
      setPackOpen(true);
      setTearProgress(100);
      playSound(mode === "daily" ? "draw" : "tear");
      setDrawNotice(
        mode === "ten"
          ? guaranteed
            ? "第十張已啟動 SR 以上保底。"
            : "本次十連已包含 SR 以上卡牌。"
          : mode === "daily"
            ? "今日免費一抽已領取，明日 00:00（台北）再來。"
            : "新卡已儲存至本機圖鑑。"
      );
      let delay = 650;
      picked.forEach((card, index) => {
        later(() => {
          setRevealedCount(index + 1);
          playSound("flip");
          if (card.rarity === "SSR") {
            setSsrBurst(card);
            playSound("ssr");
          }
        }, delay);
        if (card.rarity === "SSR") {
          later(() => setSsrBurst(null), delay + 2400);
          delay += 2750;
        } else delay += 380;
      });
      later(() => {
        setDrawBusy(false);
        busyRef.current = false;
      }, delay + 100);
      later(
        () =>
          document.querySelector(".reveal-tray")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "center",
          }),
        300
      );
    } catch (error) {
      setDrawNotice(
        error instanceof DOMException &&
          ["QuotaExceededError", "SecurityError"].includes(error.name)
          ? "瀏覽器無法保存抽卡紀錄；請允許本機儲存或釋放空間後重試。本次未消耗額度。"
          : error instanceof Error
            ? error.message
            : "無法保存抽卡紀錄，請允許本機儲存後重試。"
      );
      setDrawBusy(false);
      busyRef.current = false;
      setLedger(readLedger());
    }
  };
  const handleTearStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (busyRef.current) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    setTearProgress(0);
    event.currentTarget.setPointerCapture(event.pointerId);
    unlockAudio();
  };
  const handleTearMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || busyRef.current) return;
    const progress = Math.min(
      100,
      Math.max(
        0,
        ((event.clientX - dragStart.current.x) /
          event.currentTarget.clientWidth) *
          150
      )
    );
    setTearProgress(progress);
    if (progress >= 75) {
      dragStart.current = null;
      void openPack("pack");
    }
  };
  const handleTearEnd = () => {
    dragStart.current = null;
    if (!busyRef.current) setTearProgress(0);
  };
  const exportCard = () => {
    if (!preparedFile) return;
    try {
      downloadCard(preparedFile);
      setShareNotice("已產生 900 × 1350 PNG，請查看瀏覽器下載。");
    } catch {
      setShareNotice("下載失敗，請重試。");
    }
  };
  const shareCard = async () => {
    if (!preparedFile) return;
    if (!navigator.share || !navigator.canShare?.({ files: [preparedFile] })) {
      downloadCard(preparedFile);
      setShareNotice("此瀏覽器不支援檔案分享，已改為下載 PNG。");
      return;
    }
    try {
      await navigator.share({
        title: `${selectedCard.name} · Snake Academy`,
        text: `我解鎖了 ${selectedCard.rarity} 卡牌：${selectedCard.name}`,
        files: [preparedFile],
      });
      setShareNotice("已完成系統分享。");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        setShareNotice("已取消分享，卡牌仍保留在圖鑑。");
      else {
        downloadCard(preparedFile);
        setShareNotice("系統分享不可用，已改為下載 PNG。");
      }
    }
  };
  const requestIntel = (tab: string) => {
    setIntelRequest({ tab, tick: Date.now() });
    setIntelMenu(false);
    setMobileNav(false);
  };

  return (
    <div className="site-shell">
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
      <header className="topbar">
        <button
          className="brand-lockup"
          onClick={() => scrollToId("intro")}
          aria-label="回到首頁"
        >
          <img
            className="brand-logo-image"
            src="https://xiang1224.github.io/SnakeAcademy/images/logo.webp"
            alt="毒蛇學院 SNAKE ACADEMY"
            width={225}
            height={81}
          />
        </button>
        <nav className={`main-nav ${mobileNav ? "is-open" : ""}`}>
          {[
            { id: "intro", label: "學院簡介" },
            { id: "roster", label: "師生名錄" },
          ].map(item => (
            <button
              key={item.id}
              className={activeNav === item.id ? "active" : ""}
              onClick={() => {
                scrollToId(item.id);
                setMobileNav(false);
              }}
            >
              {item.label}
              <span />
            </button>
          ))}
          <div
            className="intel-nav"
            onBlur={e => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setIntelMenu(false);
            }}
            onKeyDown={e => {
              if (e.key === "Escape") setIntelMenu(false);
            }}
          >
            <button
              className={`nav-accent ${activeNav === "intel" ? "active" : ""}`}
              aria-expanded={intelMenu}
              aria-controls="intel-dropdown"
              onClick={() => setIntelMenu(v => !v)}
            >
              情報區 <ChevronDown size={12} />
            </button>
            {intelMenu && (
              <div id="intel-dropdown" className="intel-dropdown">
                {intelTabs.map(tab => (
                  <button key={tab.id} onClick={() => requestIntel(tab.id)}>
                    <b>{tab.title}</b>
                    <small>{tab.english}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
          {[
            { id: "pack", label: "毒蛇卡包" },
            { id: "news", label: "動態消息" },
          ].map(item => (
            <button
              key={item.id}
              className={`${activeNav === item.id ? "active" : ""} ${item.id === "pack" ? "nav-accent" : ""}`}
              onClick={() => {
                scrollToId(item.id);
                setMobileNav(false);
              }}
            >
              {item.label}
              <span />
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="sound-toggle"
            aria-label={soundOn ? "關閉音效" : "開啟音效"}
            aria-pressed={soundOn}
            onClick={() => {
              setSoundOn(v => !v);
              if (!soundOn) unlockAudio();
            }}
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button
            className="collection-chip"
            onClick={() => setCollectionOpen(true)}
          >
            <span className="chip-dot" />
            收藏 {collection.length}/{cards.length}
          </button>
          <button
            className="mobile-menu"
            onClick={() => setMobileNav(value => !value)}
            aria-label="開啟選單"
          >
            {mobileNav ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <main>
        <section
          id="intro"
          className="hero-section"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <NewsTicker onNavigate={scrollToId}/>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              CLASSIFIED ACADEMIC ARCHIVE <span className="eyebrow-line" />
            </p>
            <h1>
              在黑暗中
              <br />
              <em>保持清醒。</em>
            </h1>
            <p className="hero-description">
              智慧．野心．榮耀
              <br />
              <span>一所訓練你掌握命運的蛇院學院。</span>
            </p>
            <div className="hero-ctas">
              <button
                className="button-primary"
                onClick={() => scrollToId("pack")}
              >
                <span>進入卡包檔案</span>
                <ArrowRight size={16} />
              </button>
              <button
                className="button-ghost"
                onClick={() => scrollToId("roster")}
              >
                <span>查看師生名錄</span>
                <ArrowDown size={16} />
              </button>
            </div>
          </div>
          <div className="hero-aside">
            <div className="aside-line" />
            <span>SCROLL TO DESCEND</span>
            <ArrowDown size={15} />
          </div>
          <div className="hero-stamp">
            <span>SA</span>
            <small>
              KEEP
              <br />
              YOUR
              <br />
              POISON
            </small>
          </div>
          <div className="hero-index">
            01 <span>/ 04</span>
          </div>
        </section>

        <section className="manifesto-section">
          <div className="manifesto-label">
            <span>01</span>
            <span>THE ACADEMY</span>
          </div>
          <div className="manifesto-copy">
            <p className="section-kicker">
              一所重視智慧、紀律與團隊精神的學院。
            </p>
            <h2>
              我們培育的，
              <br />
              <em>不只是學生。</em>
            </h2>
          </div>
          <div className="manifesto-note">
            <span>MANIFESTO / 1940</span>
            <p>
              以知識武裝自己，學會觀察、判斷與思考。不畏懼設定更高的目標，勇敢走出自己的道路。珍惜團隊與學院的榮譽，讓每一次努力留下意義。
            </p>
            <button className="text-link" onClick={() => scrollToId("roster")}>
              讀取完整檔案 <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section id="roster" className="roster-section content-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">02 / PEOPLE DIRECTORY</p>
              <h2>
                師生<span>名錄</span>
              </h2>
            </div>
            <div className="heading-aside">
              <span className="live-dot" />
              SOURCE ARCHIVE
              <br />
              <small>原站 31 位師生 · 2026 快照</small>
            </div>
          </div>
          <div className="roster-toolbar">
            <div className="filter-tabs">
              {typeFilters.map(filter => (
                <button
                  key={filter}
                  className={typeFilter === filter ? "selected" : ""}
                  onClick={() => setTypeFilter(filter)}
                >
                  {filter}
                  <sup>
                    {filter === "全部"
                      ? roster.length
                      : roster.filter(person => person.type === filter).length}
                  </sup>
                </button>
              ))}
            </div>
            <label className="search-box">
              <Search size={16} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="搜尋姓名、稱號或系所"
              />
            </label>
          </div>
          <div className="roster-subtoolbar">
            <span>顯示 {filteredRoster.length} 筆資料</span>
            <div className="select-wrap">
              <select
                value={deptFilter}
                onChange={event => setDeptFilter(event.target.value)}
              >
                {deptFilters.map(filter => (
                  <option key={filter}>{filter}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </div>
          <RosterExport people={filteredRoster} allPeople={roster}/>
          <div className="roster-grid">
            {(allPeople ? filteredRoster : filteredRoster.slice(0, 6)).map(
              (person, index) => (
                <article
                  className={`person-card person-${person.color}`}
                  key={person.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看 ${person.name} 檔案`}
                  onKeyDown={event => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                  onClick={() =>
                    setSelectedCard(
                      cards.find(card => card.name === person.name) || {
                        ...person,
                        rarity: "N",
                        rarityName: "ARCHIVE ENTRY",
                        stat: "ARCHIVE",
                      }
                    )
                  }
                >
                  <div className="person-image">
                    <div className="portrait-placeholder">
                      <span>{person.name.slice(0, 1)}</span>
                      <small>NO.{String(index + 1).padStart(2, "0")}</small>
                    </div>
                    {person.image && (
                      <img
                        key={person.image}
                        loading="lazy"
                        src={person.image}
                        alt={person.name}
                        onError={event => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="person-type">{person.type}</span>
                    <span className="person-scan">
                      VIEW DOSSIER <ArrowRight size={12} />
                    </span>
                  </div>
                  <div className="person-info">
                    <div className="person-topline">
                      <span>
                        {person.year} · {person.department}
                      </span>
                      <span>VALID</span>
                    </div>
                    <h3>{person.name}</h3>
                    <p className="person-role">
                      {person.roman} / {person.role}
                    </p>
                    <p className="person-bio">{person.bio}</p>
                    <blockquote>
                      {person.quote || "SNAKE ACADEMY · 師生檔案"}
                    </blockquote>
                  </div>
                </article>
              )
            )}
          </div>
          {filteredRoster.length === 0 && (
            <p className="empty-roster">
              找不到符合條件的師生，請調整搜尋或篩選。
            </p>
          )}
          {filteredRoster.length > 6 && (
            <button
              className="roster-more"
              onClick={() => setAllPeople(v => !v)}
            >
              {allPeople
                ? "收合名錄"
                : `查看全部 ${filteredRoster.length} 位師生`}{" "}
              <ChevronDown size={14} />
            </button>
          )}
          <p className="source-credit">
            人物名稱與照片來自{" "}
            <a href={REFERENCE_URL} target="_blank" rel="noreferrer">
              毒蛇學院師生名錄
            </a>
            。稀有度與典藏版本為本站卡牌設計。
          </p>
        </section>

        <Intelligence request={intelRequest} />

        <section id="pack" className="pack-section content-section">
          <div className="pack-heading">
            <div>
              <p className="section-kicker">04 / SEALED COLLECTION</p>
              <h2>
                毒蛇<span>卡包</span>
              </h2>
            </div>
            <p>
              優先收集新卡；集齊後可重複收藏。
              <br />
              每日免費 1 張 · 十連 10 張保底 SR 以上。
            </p>
          </div>
          <div className="pack-tools"><span>每一場揭曉，都有跡可循。</span><button className="history-open-button" onClick={()=>setHistoryOpen(true)} disabled={drawBusy}><History size={15}/> 歷史抽卡紀錄 <small>最近 {Math.min(ledger.history.length,10)} 次</small></button></div>
          <div className="pack-stage">
            <div className="pack-info">
              <div className="pack-counter">
                <strong>{String(collection.length).padStart(2, "0")}</strong>
                <span>
                  / {String(cards.length).padStart(2, "0")} CARDS
                  <br />
                  <small>ARCHIVE PROGRESS</small>
                </span>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${(collection.length / cards.length) * 100}%`,
                  }}
                />
              </div>
              <p className="pack-note">
                <Sparkles size={14} /> SSR 卡牌含有獨立的全圖閃卡與粒子溢出效果
              </p>
            </div>
            <div className="pack-interaction">
              <div
                key={ledger.history.length}
                aria-label="點擊或向右拖曳開啟五張卡包"
                aria-disabled={drawBusy}
                className={`pack-wrapper ${packOpen ? "is-open" : ""}`}
                onPointerMove={handleTearMove}
                onPointerDown={handleTearStart}
                onPointerUp={handleTearEnd}
                onPointerCancel={handleTearEnd}
                onClick={() => openPack("pack")}
                role="button"
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openPack("pack");
                  }
                }}
              >
                <div className="pack-glow" />
                <div className="pack-card">
                  <div className="pack-card-top">
                    <span>LIMITED ARCHIVE</span>
                    <b>SA</b>
                    <span>VOL. 01 / 2026</span>
                  </div>
                  <div className="pack-snake">ϟ</div>
                  <div className="pack-title">
                    SNAKE
                    <br />
                    <em>ACADEMY</em>
                  </div>
                  <div className="pack-subtitle">
                    SECRET SOCIETY · TRADING CARDS
                  </div>
                  <div className="pack-footer">
                    <span>五張一包</span>
                    <span className="pack-seal">SEALED</span>
                  </div>
                  <div
                    className="tear-mark"
                    style={{
                      left: `${Math.max(8, Math.min(92, tearProgress))}%`,
                    }}
                  >
                    <span>✦</span>
                  </div>
                </div>
                <div className="pack-shadow" />
              </div>
              <div className="tear-instruction">
                <div className="tear-line">
                  <span style={{ width: `${tearProgress}%` }} />
                </div>
                <span>
                  {packOpen
                    ? revealedCount < drawnCards.length
                      ? "PACK OPENED / REVEALING"
                      : "ARCHIVE UPDATED · 點擊可再開五張"
                    : "DRAG TO TEAR · 點擊開啟"}
                </span>
              </div>
              <div className="pack-actions">
                <button
                  className="daily-draw-button"
                  onClick={event => {
                    event.stopPropagation();
                    openPack("daily");
                  }}
                  disabled={!dailyAvailable || drawBusy}
                >
                  <Volume2 size={15} />
                  <span>
                    每日限定免費一抽
                    <small>
                      {dailyAvailable
                        ? "今日可用 · 1 CARD"
                        : "今日已使用 · 明日重置"}
                    </small>
                  </span>
                  <b>{dailyAvailable ? "FREE" : "USED"}</b>
                </button>
                <button
                  className="ten-draw-button"
                  onClick={event => {
                    event.stopPropagation();
                    openPack("ten");
                  }}
                  disabled={drawBusy}
                >
                  <span>
                    十連抽 · SR 保底<small>10 CARDS / GUARANTEED SR+</small>
                  </span>
                  <b>×10</b>
                </button>
              </div>
            </div>
            <div className="pack-side-note">
              <span>
                PACK ID / {String(ledger.history.length + 1).padStart(6, "0")}
              </span>
              <p>
                一包抽取五張，
                <br />
                翻面揭曉你的新檔案。
              </p>
              <div className="side-seal">◈</div>
            </div>
          </div>
          <div className="draw-status" role="status">
            {drawNotice}
          </div>
          <div className="draw-rules">
            <span>每日 00:00（Asia/Taipei）重置 · 本瀏覽器限定</span>
            <span>五卡與十連均為免費體驗，不消耗每日單抽額度。</span>
            <span>本機收藏可被清除或修改，非伺服器認證。</span>
          </div>
          {drawnCards.length > 0 && (
            <div className="reveal-tray">
              <div className="tray-heading">
                <span>
                  {drawMode === "daily"
                    ? "DAILY FREE DRAW"
                    : drawMode === "ten"
                      ? "TEN DRAW / SR GUARANTEED"
                      : "NEWLY DISCOVERED"}{" "}
                  / {revealedCount} OF {drawnCards.length}
                </span>
                <button
                  disabled={drawBusy}
                  onClick={() => {
                    clearTimers();
                    setSsrBurst(null);
                    setDrawnCards([]);
                    setPackOpen(false);
                    setTearProgress(0);
                    setDrawMode("pack");
                  }}
                >
                  <X size={14} /> CLOSE
                </button>
              </div>
              {drawBusy && (
                <button className="skip-reveal" onClick={skipReveal}>
                  全部揭曉 / 跳過動畫
                </button>
              )}
              <div className="drawn-grid">
                {drawnCards.map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className={`drawn-card-slot ${index < revealedCount ? "is-revealed" : ""}`}
                  >
                    <TradingCard
                      card={card}
                      reveal={index < revealedCount}
                      onClick={() =>
                        index < revealedCount && setSelectedCard(card)
                      }
                    />
                    {index >= revealedCount && (
                      <span className="reveal-count">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section id="news" className="news-section content-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">05 / ACADEMY SIGNALS</p>
              <h2>
                動態<span>消息</span>
              </h2>
            </div>
            <button
              className="button-ghost"
              onClick={() => setCollectionOpen(true)}
            >
              查看收藏圖鑑 <ArrowRight size={16} />
            </button>
          </div>
          <div className="news-grid">
            <article className="news-feature">
              <div className="news-image">
                <span>
                  ARCHIVE
                  <br />
                  SIGNAL
                </span>
                <strong>11.04</strong>
              </div>
              <div>
                <p>ACADEMY BULLETIN / 世界觀示範活動</p>
                <h3>第七溫室的夜間開放日</h3>
                <span>
                  所有持有「煉金毒素系」通行章的學員，今晚可於第三聲鐘響後進入。請勿單獨採集。
                </span>
              </div>
            </article>
            <div className="news-list">
              {academyNews.slice(0,4).map(item=><article key={item.id}><span>{item.date.slice(5)}</span><div><b>{item.title}</b><small>{item.tag} · {item.summary}</small></div><ArrowRight size={16}/></article>)}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark">ϟ</span>
          <div>
            <b>SNAKE ACADEMY</b>
            <small>智慧．野心．榮耀</small>
          </div>
        </div>
        <p>
          在關鍵時刻行動。
          <br />
          <span>CLASSIFIED ACADEMIC ARCHIVE · 1940—∞</span>
        </p>
        <button onClick={() => scrollToId("intro")} aria-label="回到頂部">
          <ArrowDown size={16} />
        </button>
      </footer>

      {ssrBurst && (
        <div
          key={ssrBurst.id}
          className="ssr-impact-overlay"
          aria-live="polite"
        >
          <div className="ssr-impact-flash" />
          <div className="ssr-impact-rings">
            <span />
            <span />
            <span />
          </div>
          <div className="ssr-particle-field">
            {Array.from({ length: 20 }).map((_, index) => (
              <i key={index} style={{ "--i": index } as React.CSSProperties} />
            ))}
          </div>
          <div className="ssr-impact-copy">
            <span>SECRET SUPER RARE</span>
            <strong>SSR</strong>
            <div className="ssr-spotlight">
              <CardArt card={ssrBurst} />
            </div>
            <em>典藏檔案已解鎖 · {ssrBurst.name}</em>
            <button onClick={skipReveal}>
              查看全部卡牌 <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
      <BackgroundMusic compact={collectionOpen || !!selectedCard || !!ssrBurst || historyOpen}/>
      {historyOpen && <DrawHistory records={ledger.history} cards={cards} onClose={()=>setHistoryOpen(false)} onSelect={card=>{setDetailFromHistory(true);setHistoryOpen(false);setSelectedCard(card);}}/>}
      <MilestoneCelebration
        milestones={achievements.celebration}
        onClose={achievements.dismiss}
      />
      {collectionOpen && (
        <CollectionArchive
          cards={cards}
          owned={collection}
          record={achievements.record}
          equip={achievements.equip}
          onClose={() => setCollectionOpen(false)}
          onSelect={setSelectedCard}
          renderArt={card => <CardArt card={card} compact />}
          onDraw={() => {
            setCollectionOpen(false);
            scrollToId("pack");
          }}
        />
      )}
      {selectedCard && (
        <div
          className="modal-backdrop card-detail-backdrop"
          onClick={() => closeCardDetail()}
        >
          <div
            className={`card-detail-modal ${focusedArt ? "is-art-focus" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="卡牌詳情與分享"
            onClick={event => event.stopPropagation()}
          >
            <button
              className="icon-button detail-close"
              aria-label="關閉卡牌詳細檢視"
              onClick={() => closeCardDetail()}
            >
              <X size={18} />
            </button>
            <div className="detail-view-tools">
              <span>{selectedCard.rarity} / HOLOGRAPHIC DOSSIER</span>
              <button
                className="focus-art-button"
                aria-pressed={focusedArt}
                onClick={() => setFocusedArt(v => !v)}
              >
                {focusedArt ? <Minimize2 size={14} /> : <Maximize2 size={14} />}{" "}
                {focusedArt ? "返回詳細資料" : "專注賞卡"}
              </button>
            </div>
            <div className="detail-art">
              <TradingCard
                card={selectedCard}
                onClick={() => setFocusedArt(v => !v)}
              />
              <p className="detail-motion-hint">
                {["SSR", "SR"].includes(selectedCard.rarity)
                  ? "移動指標或輕觸卡面，探索雷射光澤"
                  : "點擊卡面，放大欣賞檔案"}
              </p>
            </div>
            <div className="detail-copy">
              <p className="section-kicker">
                ARCHIVE ENTRY / {selectedCard.rarityName || "NORMAL"}
              </p>
              <h2>{selectedCard.name}</h2>
              <p className="detail-roman">
                {selectedCard.roman || "ARCHIVE RECORD"}
              </p>
              <div className="detail-rule" />
              <p>{selectedCard.desc || selectedCard.bio}</p>
              <div className="detail-specs">
                <span>
                  <small>ROLE</small>
                  <b>{selectedCard.role}</b>
                </span>
                <span>
                  <small>DEPARTMENT</small>
                  <b>{selectedCard.department}</b>
                </span>
                <span>
                  <small>RATING</small>
                  <b>{selectedCard.stat || "VALID"}</b>
                </span>
              </div>
              <blockquote>
                “{selectedCard.quote || "每一張牌都在等待它被翻面的時刻。"}”
              </blockquote>
              <div className="detail-actions">
                <button
                  className="button-primary"
                  onClick={exportCard}
                  disabled={shareBusy || !preparedFile}
                >
                  <Download size={15} />
                  匯出 PNG
                </button>
                <button
                  className="button-ghost detail-share-button"
                  onClick={shareCard}
                  disabled={shareBusy || !preparedFile}
                >
                  <Share2 size={15} />
                  分享卡面
                </button>
              </div>
              <p className="share-note" aria-live="polite">
                {shareBusy ? "正在準備卡面……" : shareNotice}
              </p>
              <button
                className="text-link detail-back"
                onClick={() => closeCardDetail()}
              >
                {detailFromHistory ? "返回抽卡紀錄" : collectionOpen ? "返回收藏圖鑑" : "返回檔案"}{" "}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
