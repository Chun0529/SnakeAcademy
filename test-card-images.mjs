import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const output='/home/ubuntu/snake-image-qa';mkdirSync(output,{recursive:true});
const source=readFileSync('./client/src/pages/Home.tsx','utf8');
const legacyText=source.slice(source.indexOf('const legacyCards = ['),source.indexOf('const cards:'));
const legacy=Array.from(legacyText.matchAll(/id:\s*"([^"]*)"/g)).map(m=>m[1]);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1200},reducedMotion:'reduce',acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 const ids=await page.evaluate(async legacy=>{const data=await import('/src/lib/academy-data.ts');return [...data.academyCards,...data.specialCards].map(c=>c.id).concat(legacy);},legacy);
 await page.evaluate(ids=>localStorage.setItem('snake-academy-ledger-v2',JSON.stringify({version:2,collection:ids,dailyDate:null,history:[]})),ids);
 await page.reload({waitUntil:'networkidle'});await page.locator('.collection-chip').click();
 await page.waitForFunction(()=>{const images=Array.from(document.querySelectorAll('.collection-art img'));return images.length===45&&images.every(img=>img.complete&&img.naturalWidth>0);},{},{timeout:60000});
 const images=await page.locator('.collection-art img').evaluateAll(imgs=>imgs.map(img=>({name:img.alt,src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight})));
 assert.equal(images.length,45);assert.equal(await page.locator('.card-image-error').count(),0);console.log('PASS: all 45 cards contain loaded images; no icon-only or failed artwork.');
 await page.locator('.collection-modal').evaluate(el=>{el.scrollTop=el.scrollHeight;});await page.locator('.collection-modal').screenshot({path:output+'/fixed-collection.png'});
 const card=page.locator('.collection-card').filter({hasText:'午夜蛇影'});await card.click();
 await page.waitForFunction(()=>document.querySelector('.detail-actions .button-primary')?.disabled===false);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'匯出 PNG',exact:true}).click();await(await downloadPromise).saveAs(output+'/midnight-serpent-card.png');
 const png=readFileSync(output+'/midnight-serpent-card.png');assert.equal(png.readUInt32BE(16),900);assert.equal(png.readUInt32BE(20),1350);assert(png.length>100000);console.log('PASS: formerly missing SSR exports a complete 900×1350 PNG.');
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 // Explicit network failure must show a truthful fallback, not a silent blank.
 const broken=images.find(i=>i.name==='卡西安・里德');await page.route(broken.src,route=>route.abort());await page.reload({waitUntil:'networkidle'});await page.locator('.collection-chip').click();
 await page.getByText('圖片暫時無法載入',{exact:true}).waitFor();assert.equal(await page.locator('.collection-card').filter({hasText:'卡西安・里德'}).count(),1);console.log('PASS: blocked image shows an explicit status and keeps card identity.');
 assert.equal(errors.length,0);writeFileSync(output+'/report.json',JSON.stringify({loaded:images.length,images,errors},null,2));
}finally{await browser.close();}
