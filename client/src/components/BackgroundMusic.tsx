import {useEffect,useRef,useState} from 'react';
import {Music2,Pause,Play,Volume2,VolumeX,ChevronDown} from 'lucide-react';
export const musicTracks=[
 {id:'cantonese-rap',label:'粵語 RAP + K-pop',src:`${import.meta.env.BASE_URL}audio/snake-cantonese-rap.mp3`},
 {id:'cantonese',label:'粵語版',src:`${import.meta.env.BASE_URL}audio/snake-cantonese.mp3`},
 {id:'mandarin',label:'普通話版',src:`${import.meta.env.BASE_URL}audio/snake-mandarin.mp3`},
];
const KEY='snake-academy-music-v1';
function preferences(){try{const data=JSON.parse(localStorage.getItem(KEY)||'{}');return {track:musicTracks.some(t=>t.id===data.track)?data.track:musicTracks[0].id,volume:typeof data.volume==='number'&&Number.isFinite(data.volume)?Math.max(0,Math.min(1,data.volume)):0.3};}catch{return {track:musicTracks[0].id,volume:0.3};}}
export default function BackgroundMusic({compact=false}:{compact?:boolean}){
 const [initial]=useState(preferences),[track,setTrack]=useState<string>(initial.track),[volume,setVolume]=useState(initial.volume),[playing,setPlaying]=useState(false),[expanded,setExpanded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const audio=useRef<HTMLAudioElement>(null),operation=useRef(0);
 const selected=musicTracks.find(t=>t.id===track)!;
 useEffect(()=>{if(audio.current)audio.current.volume=volume;try{localStorage.setItem(KEY,JSON.stringify({track,volume}));}catch{}},[track,volume]);
 useEffect(()=>{const element=audio.current;return()=>{operation.current++;element?.pause();};},[]);
 useEffect(()=>{if(compact)setExpanded(false);},[compact]);
 const play=async()=>{const element=audio.current;if(!element)return;const op=++operation.current;setBusy(true);setError('');try{await element.play();}catch(e){if(op===operation.current){setError('音樂未能播放，請按播放重試或選擇其他版本。');setPlaying(false);}}finally{if(op===operation.current)setBusy(false);}};
 const toggle=()=>{if(playing||busy){operation.current++;audio.current?.pause();setBusy(false);setPlaying(false);}else void play();};
 const choose=(id:string)=>{const next=musicTracks.find(t=>t.id===id);if(!next||id===track)return;const resume=playing||busy;operation.current++;audio.current?.pause();setPlaying(false);setBusy(false);setTrack(id);setError('');if(audio.current){audio.current.src=next.src;audio.current.load();if(resume)void play();}};
 return <div className={`music-dock ${playing?'is-playing':''} ${expanded?'is-expanded':''} ${compact?'is-compact':''}`}>
  <audio ref={audio} src={musicTracks.find(t=>t.id===initial.track)!.src} preload="none" loop onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onWaiting={()=>{if(!audio.current?.paused)setBusy(true);}} onPlaying={()=>setBusy(false)} onError={()=>{setPlaying(false);setBusy(false);setError('音樂載入失敗，請重試或切換版本。');}}/>
  {expanded&&<div className="music-settings" id="academy-music-settings"><div className="music-settings-title"><span>ACADEMY SOUNDTRACK</span><button aria-label="收起音樂設定" onClick={()=>setExpanded(false)}><ChevronDown size={16}/></button></div><h3>《毒蛇稱霸》</h3><label>選擇版本<select aria-label="背景音樂版本" value={track} onChange={e=>choose(e.target.value)}>{musicTracks.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}</select></label><label className="music-volume">{volume===0?<VolumeX size={15}/>:<Volume2 size={15}/>}<input aria-label="背景音樂音量" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><output>{Math.round(volume*100)}%</output></label><p>由你提供的學院主題曲 · 單曲循環<br/>音樂與抽卡音效可獨立控制。</p></div>}
  <div className="music-mini"><button className="music-play" onClick={toggle} aria-label={playing||busy?'暫停背景音樂':'播放背景音樂'} title={playing?'暫停背景音樂':'播放背景音樂'}>{playing||busy?<Pause size={16}/>:<Play size={16}/>}</button><button className="music-track-info" aria-label="開啟音樂設定" aria-expanded={expanded} aria-controls="academy-music-settings" onClick={()=>setExpanded(v=>!v)}><span>毒蛇稱霸 <i className="music-equalizer" aria-hidden="true"><b/><b/><b/></i></span><small>{busy?'正在載入…':playing?'播放中 · 按左側可暫停':'點擊播放 · '+selected.label}</small></button><button className="music-settings-toggle" aria-label={expanded?'收起音樂播放器':'展開音樂播放器'} aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}><Music2 size={16}/></button></div>
  {error&&<p className="music-error" role="alert">{error}</p>}
 </div>;
}
