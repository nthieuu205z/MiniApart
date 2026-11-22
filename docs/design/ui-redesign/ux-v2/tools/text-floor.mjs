// Kiểm chữ ≥ 13px trên MỌI khung (qa-probe.js chỉ đòi 12px ở desktop). Chạy: node tools/text-floor.mjs
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const { Browser } = await import(pathToFileURL('C:/Users/nthieuu05/AppData/Local/hermes/profiles/bot-nthieuu/skills/taste/taste-skill/scripts/lib/cdp.mjs').href);
const root=fileURLToPath(new URL('..', import.meta.url)).replace(/\\/g,'/');
let bad=0;
const jobs=JSON.parse(readFileSync(root+'tools/jobs.json','utf8'));
const b=await Browser.launch({width:1440,height:900});
try{for(const j of jobs){const p=await b.newPage({width:j.w,height:j.h,mobile:j.w<600,dsf:1});await p.goto(pathToFileURL(root+'prototype/index.html').href+'#'+j.hash,{settleMs:400});
const r=await p.eval(`(()=>{const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const o=new Set();let n;while(n=w.nextNode()){if(!n.nodeValue.trim())continue;const e=n.parentElement;const s=getComputedStyle(e);const rc=e.getBoundingClientRect();if(rc.width===0||s.visibility==='hidden')continue;if(parseFloat(s.fontSize)<13)o.add(s.fontSize+' '+e.className+' "'+n.nodeValue.trim().slice(0,18)+'"')}return [...o]})()`);
bad+=r.length;console.log(j.name,r.length,r.slice(0,4).join(' | '));await p.close();}}finally{await b.close()}
process.exit(bad?1:0);
