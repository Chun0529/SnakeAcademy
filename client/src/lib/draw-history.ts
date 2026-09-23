import type {DrawRecord} from './draw-engine';
export const drawModeLabels={daily:'每日免費一抽',pack:'五張卡包',ten:'十連抽'};
export function recentDraws(records:unknown[]):DrawRecord[]{
 return records.filter((record):record is DrawRecord=>{
  if(!record||typeof record!=='object')return false;
  const r=record as DrawRecord;
  return typeof r.id==='string'&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))&&['daily','pack','ten'].includes(r.mode)&&Array.isArray(r.cards)&&r.cards.every(id=>typeof id==='string');
 }).slice().sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,10);
}
export function drawTime(at:string){return new Intl.DateTimeFormat('zh-Hant',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(at));}
