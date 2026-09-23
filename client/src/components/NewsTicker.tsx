import {useState} from 'react';
import {Megaphone,Pause,Play,ArrowUpRight} from 'lucide-react';
import {academyNews} from '@/lib/academy-news';
export default function NewsTicker({onNavigate}:{onNavigate:(id:string)=>void}){
 const [paused,setPaused]=useState(false);
 return <aside className={`academy-news-ticker ${paused?'is-paused':''}`} aria-label="學院新聞跑馬燈"><div className="ticker-label"><Megaphone size={15}/><span>學院新聞</span><small>ACADEMY NEWS</small></div><div className="ticker-window"><div className="ticker-track">{[0,1].map(copy=><div className="ticker-copy" key={copy} aria-hidden={copy===1?true:undefined}>{academyNews.map(item=><button key={item.id} tabIndex={copy===1?-1:0} onClick={()=>onNavigate(item.target)}><time>{item.date}</time><span className="ticker-tag">{item.tag}</span>{item.title}<ArrowUpRight size={12}/></button>)}</div>)}</div></div><button className="ticker-toggle" aria-label={paused?'繼續新聞跑馬燈':'暫停新聞跑馬燈'} aria-pressed={paused} onClick={()=>setPaused(v=>!v)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button></aside>;
}
