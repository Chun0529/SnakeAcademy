export type RosterEntry={name:string;type:string;role:string;department:string;bio:string;year:string};
const FONT=`${import.meta.env.BASE_URL}fonts/AcademyCJK-Regular.ttf`;
let fontData:Promise<string>|null=null;
async function getFont(){
 if(!fontData)fontData=fetch(FONT).then(async response=>{if(!response.ok)throw new Error('中文字型載入失敗，請稍後重試。');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...Array.from(bytes.subarray(i,i+8192)));return btoa(binary);}).catch(error=>{fontData=null;throw error;});
 return fontData;
}
export async function createRosterPdf(people:RosterEntry[],scope:'filtered'|'all'){
 if(!people.length)throw new Error('目前沒有符合條件的師生可匯出。');
 const [{jsPDF},{autoTable},font]=await Promise.all([import('jspdf'),import('jspdf-autotable'),getFont()]);
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
 pdf.addFileToVFS('AcademyCJK.ttf',font);pdf.addFont('AcademyCJK.ttf','AcademyCJK','normal');pdf.setFont('AcademyCJK','normal');
 pdf.setProperties({title:'毒蛇學院 · 師生名錄',subject:'Snake Academy directory',author:'Snake Academy',creator:'Snake Academy · Browser PDF Export'});
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const header=()=>{pdf.setFillColor(14,35,23);pdf.rect(0,0,210,42,'F');pdf.setTextColor(215,193,121);pdf.setFontSize(8);pdf.text('SNAKE ACADEMY / DIRECTORY',18,13);pdf.setFontSize(22);pdf.setTextColor(247,248,235);pdf.text('師生名錄',18,28);pdf.setFontSize(8);pdf.text(`${scope==='filtered'?'目前篩選':'全部名單'} / 共 ${people.length} 位師生`,18,36);pdf.setTextColor(69,83,66);pdf.setFontSize(8);pdf.text(`匯出日期 ${date} · Asia/Taipei`,18,49);};
 header();
 autoTable(pdf,{startY:55,margin:{top:55,right:18,bottom:24,left:18},head:[['序號','姓名 / 身份','稱號 / 專長分組','簡介']],body:people.map((p,i)=>[String(i+1),`${p.name}\n${p.type}`,`${p.role}\n${p.department}`,p.bio]),styles:{font:'AcademyCJK',fontStyle:'normal',fontSize:8.5,cellPadding:3.2,overflow:'linebreak',textColor:[32,45,36],lineWidth:0.15,lineColor:[218,224,214],valign:'top'},headStyles:{font:'AcademyCJK',fontStyle:'normal',fillColor:[28,57,37],textColor:[243,243,225],fontSize:8.5},alternateRowStyles:{fillColor:[245,248,240]},columnStyles:{0:{cellWidth:12},1:{cellWidth:41},2:{cellWidth:50},3:{cellWidth:'auto'}},rowPageBreak:'avoid',showHead:'everyPage',willDrawPage:()=>{header();}});
 const total=pdf.getNumberOfPages();
 for(let page=1;page<=total;page++){pdf.setPage(page);pdf.setDrawColor(177,184,165);pdf.line(18,276,192,276);pdf.setTextColor(87,99,79);pdf.setFontSize(8);pdf.text(`${page} / ${total}`,192,284,{align:'right'});}
 return {blob:pdf.output('blob'),filename:`毒蛇學院_師生名錄_${date}_${people.length}位.pdf`};
}
export function savePdf(blob:Blob,filename:string){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
