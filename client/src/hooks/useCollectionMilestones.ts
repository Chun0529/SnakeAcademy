import { useEffect, useRef, useState } from "react";
import {
  ACHIEVEMENT_KEY,
  MILESTONES,
  readAchievements,
  reachedMilestones,
  type AchievementRecord,
  type Milestone,
} from "@/lib/collection-progress";
import { playSound } from "@/lib/sound";
export function useCollectionMilestones(
  count: number,
  total: number,
  blocked: boolean
) {
  const [record, setRecord] = useState(readAchievements);
  const memory = useRef(record);
  const [celebration, setCelebration] = useState<Milestone[]>([]);
  const dismiss = () => setCelebration([]);
  const persist = (next: AchievementRecord) => {
    memory.current = next;
    setRecord(next);
    try {
      localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(next));
    } catch {
      /* Keep titles for this session if storage is blocked. */
    }
  };
  useEffect(() => {
    if (blocked) return;
    const saved = readAchievements(),
      current = memory.current;
    const unlocked = Array.from(
      new Set([
        ...saved.unlocked,
        ...current.unlocked,
        ...reachedMilestones(count, total).map(m => m.percent),
      ])
    );
    const seen = Array.from(
      new Set([...saved.celebrated, ...current.celebrated])
    );
    const newlyReached = MILESTONES.filter(
      m => unlocked.includes(m.percent) && !seen.includes(m.percent)
    );
    const next = {
      unlocked,
      celebrated: Array.from(
        new Set([...seen, ...newlyReached.map(m => m.percent)])
      ),
      equipped:
        current.equipped ??
        saved.equipped ??
        unlocked[unlocked.length - 1] ??
        null,
    };
    if (JSON.stringify(next) !== JSON.stringify(current)) persist(next);
    if (newlyReached.length) {
      setCelebration(newlyReached);
      if (navigator.userActivation?.hasBeenActive) playSound("draw");
    }
  }, [count, total, blocked]);
  useEffect(() => {
    if (!celebration.length) return;
    const timer = window.setTimeout(dismiss, 6500);
    return () => clearTimeout(timer);
  }, [celebration]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === ACHIEVEMENT_KEY) {
        const fresh = readAchievements();
        memory.current = fresh;
        setRecord(fresh);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const equip = (percent: number) => {
    if (memory.current.unlocked.includes(percent))
      persist({ ...memory.current, equipped: percent });
  };
  return { record, celebration, dismiss, equip };
}
