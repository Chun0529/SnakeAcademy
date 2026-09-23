import { describe, it, expect } from 'vitest';
import { drawCards, dayKey, nextResetDelay } from './draw-engine';
const low=Array.from({length:20},(_,i)=>({id:'n'+i,rarity:i%2?'R':'N'}));
const pool=[...low,{id:'sr',rarity:'SR'},{id:'ssr',rarity:'SSR'}];
describe('draw guarantees and card counts',()=>{
  it('daily 1, pack 5, ten 10',()=>{expect(drawCards(pool,'daily',[]).picked).toHaveLength(1);expect(drawCards(pool,'pack',[]).picked).toHaveLength(5);expect(drawCards(pool,'ten',[]).picked).toHaveLength(10);});
  it('R must never satisfy SR+ guarantee',()=>{const result=drawCards(pool,'ten',['sr','ssr'],()=>0.45);expect(result.guaranteed).toBe(true);expect(result.picked.some(c=>c.rarity==='SR'||c.rarity==='SSR')).toBe(true);expect(result.picked.slice(0,9).every(c=>c.rarity==='N'||c.rarity==='R')).toBe(true);});
  it('1000 ten-draws all contain SR+ with no within-batch duplicates',()=>{for(let seed=1;seed<=1000;seed++){let n=seed;const rng=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};const result=drawCards(pool,'ten',seed%2?pool.map(c=>c.id):[],rng);expect(result.picked).toHaveLength(10);expect(result.picked.some(c=>c.rarity==='SR'||c.rarity==='SSR')).toBe(true);expect(new Set(result.picked.map(c=>c.id)).size).toBe(10);}});
  it('prefers uncollected and fills the pack when fewer than five remain',()=>{const owned=pool.slice(0,-2).map(c=>c.id);const result=drawCards(pool,'pack',owned,()=>0);expect(result.picked.slice(0,2).map(c=>c.id).sort()).toEqual(['sr','ssr']);expect(result.picked).toHaveLength(5);});
  it('fails safely when guarantee is impossible',()=>expect(()=>drawCards(low,'ten',[])).toThrow('保底'));
});
describe('Asia/Taipei daily reset',()=>{
  it('day flips at UTC 16:00, not browser locale midnight',()=>{expect(dayKey(new Date('2026-09-23T15:59:59Z'))).toBe('2026-09-23');expect(dayKey(new Date('2026-09-23T16:00:00Z'))).toBe('2026-09-24');});
  it('one-shot refresh targets the next midnight',()=>expect(nextResetDelay(Date.parse('2026-09-23T15:59:59Z'))).toBe(1100));
});
