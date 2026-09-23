import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out='/home/ubuntu/snake-brand-qa';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage();
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
  await page.locator('.brand-logo-image').evaluate(img=>img.decode());
  const size=await page.locator('.brand-logo-image').evaluate(img=>({naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height}));
  assert.equal(size.naturalWidth,225);assert.equal(size.naturalHeight,81);assert(Math.abs(size.width/size.height-225/81)<0.02);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const logo=await page.locator('.brand-lockup').boundingBox(),actions=await page.locator('.header-actions').boundingBox();assert(logo.x+logo.width<=actions.x);
  assert.equal(await page.locator('.brand-lockup .brand-mark').count(),0);
  await page.locator('.topbar').screenshot({path:`${out}/header-${width}.png`});console.log('PASS header',width);
 }
 await page.evaluate(()=>document.getElementById('pack').scrollIntoView());await page.getByRole('button',{name:'回到首頁',exact:true}).click();await page.waitForFunction(()=>scrollY<10);console.log('PASS logo returns to home');
}finally{await browser.close();}
