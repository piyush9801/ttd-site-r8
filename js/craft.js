/* TTD site · the craft layer.
   The house microinteraction vocabulary this client approved on the TTD site-dot build (piyush-motion-kit), on
   the round 8 system. One character: the Signal full stop. Slow register, house ease, nothing stops dead.
   Every effect is guarded for reduced motion and for touch. Scroll and the pointer cause everything. */
(function(){
const {C,E,clamp,mix}=TTDCore;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const HOVER=matchMedia('(hover:hover) and (pointer:fine)').matches;
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const RED=getComputedStyle(document.documentElement).getPropertyValue('--red').trim()||'#D65A4A';

// ------------------------------------------------------------------ arriving: the full stop opens the page
// The previous page swelled its full stop to fill the screen. Here that red field contracts into the logo's own
// full stop. The pre-paint cover (html.veiled) is replaced by a real element first, so nothing flashes.
(function arrive(){
  const html=document.documentElement; if(!html.classList.contains('veiled')) return;
  if(RM){ html.classList.remove('veiled'); return; }
  const v=document.createElement('div'); v.className='pt'; document.body.appendChild(v); html.classList.remove('veiled');
  const go=()=>{ const lg=qs('#nav .logo img.dk')||qs('#nav .logo img'); let x=innerWidth/2, y=40;
    if(lg){ const r=lg.getBoundingClientRect(); x=r.left+r.width*.8738; y=r.top+r.height*.905; }
    const R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
    v.animate([{clipPath:`circle(${R}px at ${x}px ${y}px)`},{clipPath:`circle(0px at ${x}px ${y}px)`}],{duration:950,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'}).onfinish=()=>v.remove(); };
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(go,180));
  addEventListener('pageshow',e=>{ if(e.persisted) v.remove(); });
})();

// ------------------------------------------------------------------ leaving: the full stop swallows the page
function depart(){
  if(RM) return;
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank') return;
    const u=new URL(a.href,location.href); if(u.origin!==location.origin||!/^https?:$/.test(u.protocol)) return;
    if(u.pathname===location.pathname) return;                                  // same page: anchors scroll as usual
    e.preventDefault(); try{ sessionStorage.setItem('ttd-veil','1'); }catch(err){}
    // start from the nav's full stop when the click came from the nav, else from the end of the link
    const np=qs('#nav .np'); let x,y;
    if(a.closest('#nav')&&np&&+getComputedStyle(np).opacity>.2){ const r=np.getBoundingClientRect(); x=r.left+r.width/2; y=r.top+r.height/2; np.style.visibility='hidden'; }
    else { const r=a.getBoundingClientRect(); x=Math.min(r.right,e.clientX+40); y=r.top+r.height*.6; }
    // drawn at its final size and scaled up from a 12px square, so the edge stays sharp all the way
    const D=Math.ceil(Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))*2)+8, k0=12/D;
    const d=document.createElement('div'); d.className='ptd'; d.style.cssText=`left:${x-D/2}px;top:${y-D/2}px;width:${D}px;height:${D}px`; document.body.appendChild(d);
    d.animate([{transform:`scale(${k0*.4})`,borderRadius:`${D/12}px`},{transform:`scale(${k0*1.3})`,borderRadius:`${D/12}px`}],{duration:170,easing:'cubic-bezier(.34,1.56,.64,1)',fill:'forwards'}).onfinish=()=>{
      d.animate([{transform:`scale(${k0*1.3})`,borderRadius:`${D/12}px`},{transform:'scale(1)',borderRadius:'50%'}],{duration:820,easing:'cubic-bezier(.5,0,.75,.6)',fill:'forwards'}); };
    setTimeout(()=>{ location.href=u.href; },1010);
  });
  addEventListener('pageshow',e=>{ if(e.persisted){ qsa('.ptd').forEach(d=>d.remove()); const np=qs('#nav .np'); if(np) np.style.visibility=''; } });
}

// ------------------------------------------------------------------ the nav: one sentence, one full stop
// No underlines. A single Signal square sits on the baseline after the active page. On hover it slides along
// the baseline with a short motion smear, lands with a squash and breathes at rest. "The Dept." lends its own
// period to it.
function navStop(parts){
  const nav=qs('#nav'); if(!nav) return;
  const links=qsa('#nav .l a, #nav .r a');
  links.forEach(a=>{ const t=a.textContent.trim(); if(t.endsWith('.')){ a.setAttribute('aria-label',t); a.textContent=t.slice(0,-1); } });
  const dot=document.createElement('i'); dot.className='np'; dot.innerHTML='<b></b>'; dot.setAttribute('aria-hidden','true'); nav.appendChild(dot);
  const inner=dot.firstChild, active=links.find(a=>a.classList.contains('on'))||null;
  let target=active, cx=null, cy=0, op=active?1:0, moving=false;
  if(HOVER) links.forEach(a=>{ a.addEventListener('mouseenter',()=>{ target=a; }); a.addEventListener('mouseleave',()=>{ target=active; }); });
  const at=a=>{ const n=nav.getBoundingClientRect(), r=a.getBoundingClientRect(), fs=parseFloat(getComputedStyle(a).fontSize), S=Math.max(4.4,fs*.33);
    return {x:r.right-n.left+2.5, y:r.bottom-n.top-fs*.24-S, S}; };
  parts.push({update(){
    op+=((target?1:0)-op)*.12; dot.style.opacity=op.toFixed(3); if(!target&&op<.01) return;
    const p=at(target||active||links[0]); if(cx===null){ cx=p.x; cy=p.y; }
    const vx=p.x-cx; cx+=vx*.16; cy+=(p.y-cy)*.2;
    const sm=Math.min(2.6,1+Math.abs(vx)*.05);
    dot.style.width=dot.style.height=p.S+'px'; dot.style.transform=`translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
    inner.style.transform=`scaleX(${sm.toFixed(3)})`;
    if(Math.abs(vx)>3) moving=true; else if(moving&&Math.abs(vx)<.5){ moving=false; dot.classList.remove('land'); void dot.offsetWidth; dot.classList.add('land'); }
  }});
}

// ------------------------------------------------------------------ arrivals for the quiet parts of every section
// Rules draw in from the left, text columns rise in turn (A, then B, then C), photographs open from the bottom
// and settle. Once, in time, as each one comes up the screen.
function arrivals(){
  if(RM) return;
  // things that arrive together are staggered in reading order (A, then B, then C); a long list never waits
  const io=new IntersectionObserver(es=>{ const hit=es.filter(e=>e.isIntersecting).map(e=>e.target)
      .sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    hit.forEach((t,i)=>{ t.style.setProperty('--d',Math.min(i*.08,.32).toFixed(2)+'s'); t.classList.add('in'); io.unobserve(t); }); },{rootMargin:'0px 0px -9% 0px'});
  const add=(el,cls)=>{ if(el.closest('.pin')) return; el.classList.add(cls); const r=el.getBoundingClientRect(); if(r.bottom<0) el.classList.add('in'); else io.observe(el); };
  qsa('.rule').forEach(el=>add(el,'draw'));
  qsa('.bleed, .person figure').forEach(el=>add(el,'ph-rv'));
  const R=qsa('.blk .row > :not(figure), .blk > p.grey, .idx li, .roster ol li, .foot .row > *');
  R.forEach(el=>add(el,'rise'));
}

// ------------------------------------------------------------------ services (home): the full stop follows you
// Hover the index and the Signal square springs to the end of the name under the pointer, stretching while it
// travels. Names warm toward ink by their distance from the pointer before you reach them.
function indexMarker(parts){
  const idx=qs('.idx'); if(!idx||!HOVER||RM) return;
  const rows=qsa('li',idx).map(li=>({li,n:qs('.mid',li)}));
  const m=document.createElement('i'); m.className='idx-dot'; m.setAttribute('aria-hidden','true'); idx.appendChild(m);
  let tgt=null, cx=0, cy=0, vy=0, op=0, first=true;
  const last=el=>{ const tn=[...el.childNodes].find(n=>n.nodeType===3), rg=document.createRange(), L=tn.textContent.length; rg.setStart(tn,L-1); rg.setEnd(tn,L); return rg.getBoundingClientRect(); };
  rows.forEach(o=>o.li.addEventListener('mouseenter',()=>{ tgt=o; }));
  idx.addEventListener('mouseleave',()=>{ tgt=null; rows.forEach(o=>o.n.style.color=''); });
  let my=null; idx.addEventListener('mousemove',e=>{ my=e.clientY; });
  parts.push({update(){
    if(my!==null&&tgt) rows.forEach(o=>{ const r=o.n.getBoundingClientRect(), d=Math.abs(my-(r.top+r.height/2)), w=Math.pow(Math.max(0,1-d/260),2); o.n.style.color=mix(C.quiet,C.ink,.28+.72*w); });
    op+=((tgt?1:0)-op)*.12; m.style.opacity=op.toFixed(3); if(!tgt) return;
    const ir=idx.getBoundingClientRect(), g=last(tgt.n), fs=parseFloat(getComputedStyle(tgt.n).fontSize), S=Math.max(5,fs*.2);
    const tx=g.right-ir.left+fs*.07, ty=g.bottom-ir.top-fs*.24-S;
    if(first){ cx=tx; cy=ty; first=false; }
    vy+=(ty-cy)*.16; vy*=.6; cy+=vy; cx+=(tx-cx)*.22;
    const s=Math.min(1.7,1+Math.abs(vy)*.018);
    m.style.width=m.style.height=S+'px'; m.style.transform=`translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px) scale(${(1/s).toFixed(3)},${s.toFixed(3)})`;
  }});
}

// ------------------------------------------------------------------ The Work: the prompter
// A virtual reading line a little above the middle of the screen. The service it is crossing gains the full stop
// after its name, through a zero-width slot, so nothing shifts.
function prompter(parts){
  const rows=qsa('.svcs ol > li'); if(!rows.length) return;
  rows.forEach(li=>{ const h=qs('h3',li); const pd=document.createElement('span'); pd.className='pd'; pd.setAttribute('aria-hidden','true'); pd.innerHTML='<i></i>'; h.appendChild(pd); });
  parts.push({update(){ const line=innerHeight*.42; let lit=null;
    rows.forEach(li=>{ const r=li.getBoundingClientRect(); if(r.top<line&&r.bottom>line) lit=li; });
    rows.forEach(li=>li.classList.toggle('lit',li===lit)); }});
}

// ------------------------------------------------------------------ The Work: the connection
// When a guest's name speaks, a Signal hairline draws from the end of the name to their show, a square lands at
// its tip, and the show answers. Measured from the last letter, not the grid box.
function wires(){
  const L=qsa('.roster li'); if(!L.length) return;
  const W=L.map(li=>{ const w=document.createElement('i'); w.className='wire'; w.setAttribute('aria-hidden','true'); li.appendChild(w); return {li,w}; });
  const measure=()=>{ const on=innerWidth>760; W.forEach(({li,w})=>{ if(!on){ w.style.display='none'; return; } w.style.display='';
    const who=qs('.who',li), show=qs('.show',li), q=who._Q&&who._Q.length?who._Q[who._Q.length-1]:who, lr=li.getBoundingClientRect(), a=q.getBoundingClientRect(), s=show.getBoundingClientRect();
    const fs=parseFloat(getComputedStyle(who).fontSize), x0=a.right-lr.left+fs*.16, x1=s.left-lr.left-14;
    w.style.left=x0+'px'; w.style.top=(s.top-lr.top+s.height*.56)+'px'; w.style.setProperty('--w',Math.max(0,x1-x0)+'px'); }); };
  measure(); addEventListener('resize',()=>setTimeout(measure,120));
}

// ------------------------------------------------------------------ The Dept.: colour from the edge you came in
// The portraits are black and white. Hover washes the original colour in from the edge the pointer entered, and
// it retreats toward the edge it leaves by. A small Signal tick draws before each title.
function portraits(){
  qsa('.person .zA .grey, .person .b1').forEach(t=>t.classList.add('tick'));
  if(!HOVER||RM) return;
  const ins={top:'inset(0 0 100% 0)',bottom:'inset(100% 0 0 0)',left:'inset(0 100% 0 0)',right:'inset(0 0 0 100%)'};
  const edge=(e,r)=>{ const d={top:e.clientY-r.top,bottom:r.bottom-e.clientY,left:e.clientX-r.left,right:r.right-e.clientX}; return Object.keys(d).sort((a,b)=>d[a]-d[b])[0]; };
  qsa('.person figure').forEach(f=>{
    const img=qs('img',f); const shot=document.createElement('span'); shot.className='shot'; img.before(shot); shot.appendChild(img);
    const col=img.cloneNode(); col.className='col'; col.alt=''; col.removeAttribute('loading'); shot.appendChild(col);
    shot.addEventListener('mouseenter',e=>{ col.style.transition='none'; col.style.clipPath=ins[edge(e,shot.getBoundingClientRect())]; void col.offsetWidth; col.style.transition=''; col.style.clipPath='inset(0 0 0 0)'; });
    shot.addEventListener('mouseleave',e=>{ col.style.clipPath=ins[edge(e,shot.getBoundingClientRect())]; });
  });
}

// ------------------------------------------------------------------ contact: the elastic line
// The email sits on a string. It bows toward the pointer, rings when you let go (an under-damped spring).
function elastic(parts){
  const a=qs('.foot .mail'); if(!a) return; a.classList.remove('ul');
  const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'), path=document.createElementNS(NS,'path');
  svg.setAttribute('class','band'); svg.setAttribute('aria-hidden','true'); path.setAttribute('fill','none'); svg.appendChild(path); a.appendChild(svg);
  let tx=.5, cx=.5, ty=0, cy=0, vy=0, inside=false;
  if(HOVER&&!RM){
    a.addEventListener('mousemove',e=>{ const r=a.getBoundingClientRect(); inside=true; tx=clamp((e.clientX-r.left)/r.width,.04,.96); ty=clamp((e.clientY-(r.bottom+4))*.6,-14,14); });
    a.addEventListener('mouseleave',()=>{ inside=false; ty=0; vy-=7; });
  }
  parts.push({update(){
    const r=a.getBoundingClientRect(); if(r.bottom<-40||r.top>innerHeight+40) return;
    vy+=(ty-cy)*.16; vy*=.86; cy+=vy; cx+=(tx-cx)*.18; if(!inside) tx+=(.5-tx)*.05;
    const w=r.width, mid=10; svg.setAttribute('viewBox',`0 0 ${w} 40`);
    path.setAttribute('d',`M0 ${mid} Q ${(cx*w).toFixed(1)} ${(mid+cy*2).toFixed(2)} ${w} ${mid}`);
  }});
}


// ------------------------------------------------------------------ The Work: the redacted brief
// After the "official report" poster: every word is under an Ink bar except the phrases in data-keep, which
// read as a sentence of their own. As the document passes up the screen the bars lift, line by line, in reading
// order, until the whole brief is open. Scrubbed and reversible; bars are opaque, never blurred.
function redact(parts){
  const doc=qs('.doc'); if(!doc) return;
  const keep=(doc.dataset.keep||'').split('|').filter(Boolean);
  const P=qsa('p:not(.sign)',doc);
  P.forEach(p=>{ let html=p.textContent;
    keep.forEach(k=>{ html=html.replace(new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i'),m=>`\u0000${m}\u0001`); });
    p.innerHTML=html.split(/(\u0000[^\u0001]*\u0001)/).map(seg=>seg.startsWith('\u0000')?`<span class="keep">${seg.slice(1,-1)}</span>`
      :seg.split(/(\s+)/).map(w=>w.trim()?`<span class="wd">${w}</span>`:w).join('')).join(''); });
  const layer=document.createElement('span'); layer.className='redact'; layer.setAttribute('aria-hidden','true'); doc.appendChild(layer);
  let B=[];
  const build=()=>{ layer.innerHTML=''; const d=doc.getBoundingClientRect(), fs=parseFloat(getComputedStyle(P[0]).fontSize);
    const runs=[]; P.forEach(p=>{ let cur=null;
      [...p.querySelectorAll('.wd,.keep')].forEach(el=>{ const rs=[...el.getClientRects()];
        rs.forEach(r=>{ if(el.classList.contains('keep')){ cur=null; return; }
          if(cur&&Math.abs(cur.t-r.top)<fs*.3&&r.left-cur.r<fs*.6){ cur.r=r.right; } else { cur={t:r.top,b:r.bottom,l:r.left,r:r.right}; runs.push(cur); } }); }); });
    runs.sort((a,b)=>Math.abs(a.t-b.t)<fs*.3?a.l-b.l:a.t-b.t);
    B=runs.map(o=>{ const i=document.createElement('i'), pad=fs*.12; i.style.cssText=`left:${o.l-d.left-pad*.5}px;top:${o.t-d.top-fs*.01}px;width:${o.r-o.l+pad}px;height:${(o.b-o.t)+fs*.1}px`; layer.appendChild(i); return {i,s:0}; }); };
  build(); addEventListener('resize',()=>setTimeout(build,120));
  let q=0;
  parts.push({update(){ const r=doc.getBoundingClientRect(), vh=innerHeight; if(r.bottom<-vh||r.top>vh*1.5) return;
    // measured in scroll travelled, so a brief already on screen at load starts fully redacted
    const top=r.top+scrollY, start=Math.max(0,top-vh*.72), t=clamp((scrollY-start)/(r.height*.9+vh*.2)); q+=(t-q)*.12; if(Math.abs(t-q)<1e-4) q=t;
    const N=B.length; B.forEach((b,j)=>{ const a=j/N*.78, k=RM?(q>.05?1:0):E.inOut(clamp((q-a)/.22)); b.i.style.transform=`scaleX(${(1-k).toFixed(4)})`; }); }});
}

// ------------------------------------------------------------------ run, once the page system is ready
function start(){ const parts=window.TTDParts; if(!parts) return;
  depart(); navStop(parts); arrivals(); indexMarker(parts); prompter(parts); wires(); portraits(); elastic(parts); redact(parts); }
if(window.TTDParts&&document.documentElement.dataset.ready==='1') start(); else document.addEventListener('ttd:ready',start,{once:true});
})();
