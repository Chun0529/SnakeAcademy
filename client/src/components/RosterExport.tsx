import {useState} from 'react';
import {Download,Loader2} from 'lucide-react';
import type {RosterEntry} from '@/lib/roster-pdf';
export default function RosterExport({people,allPeople}:{people:RosterEntry[];allPeople:RosterEntry[]}){
 const [scope,setScope]=useState<'filtered'|'all'>('filtered'),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState(false);
 const rows=scope==='all'?allPeople:people;
 const exportPdf=async()=>{if(busy||!rows.length)return;setBusy(true);setNotice('');setError(false);const snapshot=[...rows];try{const {createRosterPdf,savePdf}=await import('@/lib/roster-pdf');const file=await createRosterPdf(snapshot,scope);savePdf(file.blob,file.filename);setNotice(`已產生 ${snapshot.length} 位師生的 PDF 名錄。`);}catch(e){setError(true);setNotice(e instanceof Error?e.message:'匯出未能完成，請稍後重試。');}finally{setBusy(false);}};
 return <div className="roster-pdf-export"><div className="roster-pdf-controls"><label><span>匯出範圍</span><select aria-label="PDF 匯出範圍" value={scope} onChange={e=>{setScope(e.target.value as 'filtered'|'all');setNotice('');}} disabled={busy}><option value="filtered">目前篩選（{people.length} 位）</option><option value="all">全部師生（{allPeople.length} 位）</option></select></label><button className="roster-pdf-button" onClick={exportPdf} disabled={busy||!rows.length}>{busy?<Loader2 size={15} className="pdf-loading"/>:<Download size={15}/>} {busy?'正在製作 PDF…':'匯出名單 PDF'}</button></div><p className={error?'pdf-notice is-error':'pdf-notice'} role={error?'alert':'status'}>{notice||'含繁體中文姓名、身份、專長與簡介；按目前篩選匯出全部結果，不限已展開的卡片。'}</p></div>;
}
