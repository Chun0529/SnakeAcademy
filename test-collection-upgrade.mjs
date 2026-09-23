import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const root='/home/ubuntu/snake-collection-qa';mkdirSync(root,{recursive:true});
const source=readFileSync('client/src/pages/Home.tsx','utf8'),legacy=source.slice(source.indexOf('const legacyCards = ['),source.indexOf('const cards:'));
const oldIds=Array.from(legacy.matchAll(/id:\s*"([^"]*)"/g)).map(x=>x[1]);
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
const page=await context.newPage(),errors=[],passed=[];page.on('pageerror',e=>errors.push(e.message));
const pass=name=>{passed.push(name);console.log('PASS',name);};
const setOwned=async ids=>{await page.evaluate(ids=>{const current=JSON.parse(localStorage.getItem('snake-academy-ledger-v2')||'{"version":2,"collection":[],"dailyDate":null,"history":[]}');localStorage.setItem('snake-academy-ledger-v2',JSON.stringify({...current,collection:ids}));window.dispatchEvent(new Event('focus'));},ids);await page.waitForFunction(n=>document.querySelector('.archive-progress')?.getAttribute('aria-valuenow')===String(n),ids.length);};
try{
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});await page.locator('.collection-chip').click();
 assert.equal(await page.locator('.archive-progress').getAttribute('aria-valuenow'),'0');assert.equal(await page.locator('.collection-card').count(),45);pass('Empty catalogue starts at zero with 45 locked entries');
 await page.getByRole('button',{name:'SSR 稀有度',exact:true}).click();await page.getByLabel('只看已收藏').check();await page.locator('.archive-empty').waitFor();assert.equal(await page.locator('.collection-card').count(),0);pass('Unowned SSR filter has a clear empty state');
 await page.getByRole('button',{name:'顯示全部卡牌',exact:true}).click();assert.equal(await page.locator('.collection-card').count(),45);
 const ids=await page.evaluate(async old=>{const data=await import('/src/lib/academy-data.ts');return [...data.academyCards,...data.specialCards].map(c=>c.id).concat(old);},oldIds);
 for(const threshold of [25,50,75,100]){
   const required=Math.ceil(ids.length*threshold/100);
   await setOwned(ids.slice(0,required-1));assert.equal(await page.locator('.milestone-celebration').count(),0);
   await setOwned(ids.slice(0,required));await page.locator('.milestone-celebration').waitFor();
   const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('snake-academy-achievements-v1')));assert(record.unlocked.includes(threshold));
   if(threshold===50)await page.screenshot({path:root+'/milestone-celebration.png'});
   await page.getByRole('button',{name:'關閉稱號慶祝'}).click();
 }
 pass('25/50/75/100 percent thresholds unlock exactly, with celebratory feedback');
 await page.getByRole('button',{name:'佩戴稱號 萬蛇典藏之主'}).click();await page.reload({waitUntil:'networkidle'});await page.locator('.collection-chip').click();assert.equal(await page.locator('.milestone-celebration').count(),0);assert.equal(await page.locator('.equipped-title').innerText(),'萬蛇典藏之主');pass('Titles and selected title persist; celebrations do not replay after reload');
 for(const rarity of ['SSR','SR','R','N']){
   await page.getByRole('button',{name:rarity+' 稀有度',exact:true}).click();
   const values=await page.locator('.collection-card').evaluateAll(els=>els.map(e=>e.dataset.rarity));assert(values.length>0);assert(values.every(r=>r===rarity));assert.equal(await page.locator('.archive-progress').getAttribute('aria-valuenow'),'45');
 }
 pass('All rarity filters work without changing global collection progress');
 await page.getByRole('button',{name:'SSR 稀有度',exact:true}).click();await page.getByLabel('只看已收藏').check();await page.locator('.collection-modal').screenshot({path:root+'/ssr-filter.png'});
 await page.locator('.collection-card.owned').first().click();await page.locator('.detail-art .card-holographic-foil').waitFor();
 assert.notEqual(await page.locator('.detail-art .card-holographic-foil').evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.locator('.detail-art .trading-card').hover({position:{x:40,y:70}});const before=await page.locator('.detail-art .trading-card').evaluate(el=>el.style.getPropertyValue('--shine-x'));
 await page.locator('.detail-art .trading-card').hover({position:{x:200,y:170}});const after=await page.locator('.detail-art .trading-card').evaluate(el=>el.style.getPropertyValue('--shine-x'));assert.notEqual(before,after);
 await page.getByRole('button',{name:'專注賞卡',exact:true}).click();await page.locator('.card-detail-modal.is-art-focus').waitFor();await page.screenshot({path:root+'/focused-ssr.png'});await page.getByRole('button',{name:'返回詳細資料',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('button',{name:'SSR 稀有度',exact:true}).getAttribute('aria-pressed'),'true');assert(await page.getByLabel('只看已收藏').isChecked());pass('SSR enlarged and full-art modes retain animation, pointer light and collection filters');
 await page.getByRole('button',{name:'SR 稀有度',exact:true}).click();await page.locator('.collection-card.owned').first().click();assert.notEqual(await page.locator('.detail-art .card-holographic-foil').evaluate(el=>getComputedStyle(el).animationName),'none');await page.keyboard.press('Escape');pass('SR enlarged view also retains holographic animation');
 await page.getByRole('button',{name:'關閉收藏圖鑑'}).click();
 await page.locator('.intel-nav>button').click();await page.locator('.intel-dropdown button').filter({hasText:'採集相關'}).click();await page.getByLabel('通行密語').fill('bigsnake');await page.getByRole('button',{name:'解鎖情報檔案'}).click();
 assert.equal(await page.locator('.gathering-map-trigger').count(),8);
 const mapButtons=page.locator('.gathering-map-trigger');for(let i=0;i<8;i++){await mapButtons.nth(i).scrollIntoViewIfNeeded();await mapButtons.nth(i).locator('img').evaluate(img=>img.decode());}
 assert.equal(await page.locator('.intel-records a[target="_blank"]').count(),0);assert.equal(await page.locator('.gathering-map-unavailable').count(),2);pass('Eight maps appear inline and two unavailable maps are clearly labelled');
 await page.locator('#intel-content').evaluate(el=>{el.scrollTop=0;});await page.locator('#intel').screenshot({path:root+'/inline-maps.png'});
 const url=page.url(),tabs=context.pages().length;await mapButtons.first().click();const mapDialog=page.getByRole('dialog',{name:'水晶蘑菇地圖詳情'});await mapDialog.waitFor();await mapDialog.getByRole('button',{name:'放大地圖',exact:true}).click();assert.equal(await mapDialog.locator('.map-zoom-viewport img').evaluate(el=>el.style.width),'150%');assert.equal(context.pages().length,tabs);assert.equal(page.url(),url);await page.screenshot({path:root+'/map-zoom.png'});await page.keyboard.press('Escape');pass('Map enlargement and zoom stay on this page without opening tabs');
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.collection-chip').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.waitForFunction(()=>Array.from(document.querySelectorAll('.collection-art img')).every(img=>img.complete&&img.naturalWidth>0));await page.locator('.collection-modal').screenshot({path:root+'/mobile-archive.png'});
 await page.getByRole('button',{name:'SSR 稀有度',exact:true}).click();await page.locator('.collection-card.owned').first().click();assert.equal(await page.locator('.card-holographic-foil').evaluate(el=>getComputedStyle(el).animationName),'none');assert(await page.locator('.card-detail-modal').evaluate(el=>el.scrollWidth<=el.clientWidth+1));pass('Mobile archive, enlarged card and reduced-motion preferences work');
 assert.equal(errors.length,0);writeFileSync(root+'/report.json',JSON.stringify({passed,errors},null,2));console.log('COMPLETE',passed.length);
}catch(error){await page.screenshot({path:root+'/failure.png'});writeFileSync(root+'/failure.txt',String(error)+'\n'+JSON.stringify(errors));throw error;}finally{await browser.close();}
