import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];const pass=name=>{results.push(name);console.log('PASS',name);};
const base='http://localhost:3000';
try{
 const context=await browser.newContext({reducedMotion:'reduce'});
 const a=await context.newPage(),b=await context.newPage();await a.goto(base);await b.goto(base);
 await Promise.all([a.evaluate(()=>document.querySelector('.daily-draw-button').click()),b.evaluate(()=>document.querySelector('.daily-draw-button').click())]);
 await a.waitForFunction(()=>JSON.parse(localStorage.getItem('snake-academy-ledger-v2')||'{}').history?.length>0);
 const ledger=await a.evaluate(()=>JSON.parse(localStorage.getItem('snake-academy-ledger-v2')));assert.equal(ledger.history.filter(h=>h.mode==='daily').length,1);pass('Concurrent tabs consume exactly one daily quota');await context.close();
 const c=await browser.newContext({reducedMotion:'reduce'});const p=await c.newPage();
 await p.clock.install({time:new Date('2026-09-23T15:59:55Z')});
 await p.addInitScript(()=>localStorage.setItem('snake-academy-ledger-v2',JSON.stringify({version:2,collection:[],dailyDate:'2026-09-23',history:[]})));
 await p.goto(base);assert(await p.locator('.daily-draw-button').isDisabled());await p.clock.fastForward(7000);assert.equal(await p.locator('.daily-draw-button').isDisabled(),false);pass('Already-open tab unlocks at Taipei midnight');await c.close();
 const d=await browser.newContext({reducedMotion:'reduce'});const page=await d.newPage();
 await page.addInitScript(()=>{window.__audio={tones:0,noise:0};const osc=AudioContext.prototype.createOscillator,buffer=AudioContext.prototype.createBufferSource;AudioContext.prototype.createOscillator=function(){window.__audio.tones++;return osc.call(this);};AudioContext.prototype.createBufferSource=function(){window.__audio.noise++;return buffer.call(this);};});
 await page.goto(base);await page.locator('.pack-wrapper').click();await page.waitForFunction(()=>document.querySelectorAll('.is-revealed').length>0);const nodes=await page.evaluate(()=>window.__audio);assert(nodes.tones>0);assert(nodes.noise>0);pass('Tear and flip schedule real oscillator and filtered-noise audio nodes');
 await page.getByRole('button',{name:'全部揭曉 / 跳過動畫'}).click();await page.locator('.sound-toggle').click();const before=await page.evaluate(()=>({...window.__audio}));await page.locator('.ten-draw-button').click();await page.waitForFunction(()=>document.querySelectorAll('.is-revealed').length>0);const after=await page.evaluate(()=>window.__audio);assert.deepEqual(before,after);pass('Muted draws do not schedule audio nodes');await d.close();
 const e=await browser.newContext({reducedMotion:'reduce'});const blocked=await e.newPage();await blocked.addInitScript(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='snake-academy-ledger-v2')throw new DOMException('quota','QuotaExceededError');return set.call(this,k,v);};});await blocked.goto(base);await blocked.locator('.daily-draw-button').click();await blocked.waitForFunction(()=>document.querySelector('.draw-status')?.textContent.length>0);assert.equal(await blocked.locator('.drawn-card-slot').count(),0);assert.equal(await blocked.locator('.daily-draw-button').isDisabled(),false);pass('Storage failure neither consumes quota nor generates unsaved cards');await e.close();
 writeFileSync('/home/ubuntu/snake-qa/edge-results.json',JSON.stringify(results,null,2));
}finally{await browser.close();}
