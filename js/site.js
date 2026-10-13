/* TTD site · round 8. One idea drives every behaviour: the right person can change the whole conversation.
   Change: the hero, and every headline's stressed word, speaks as it reaches you (Speak Up).
   Connection: scattered dashes fall into one field (Line of Sight).
   Possibility: icons become buildings, small moments between the big ones.
   Scroll drives everything; nothing moves on its own. */
(function(){
const {C,E,clamp,seg,lerp,mix,swapLetters,WAVE}=TTDCore;
const VH=()=>innerHeight;
const parts=[];
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const NIGHT={quiet:'#6E6A63',ink:'#F2EEE5'};

// ---------------------------------------------------------------- Speak Up, in the page
// The word keeps its own text (transparent, so layout and screen readers are untouched); over it each letter is
// set twice, Light and Medium (narrowed to the Light width), positioned in em so it holds at any size.
function prep(el){
  if(el._Q) return;
  const tn=[...el.childNodes].find(n=>n.nodeType===3); if(!tn) return;
  el.classList.add('sp');
  const fs=parseFloat(getComputedStyle(el).fontSize), rg=document.createRange(), r0=el.getBoundingClientRect();
  const Q=[],M=[];
  [...tn.textContent].forEach((ch,i)=>{ if(ch===' ') return;
    rg.setStart(tn,i); rg.setEnd(tn,i+1); const r=rg.getBoundingClientRect(), x=(r.left-r0.left)/fs;
    const q=document.createElement('span'), m=document.createElement('span');
    q.className='q'; m.className='m'; q.textContent=m.textContent=ch; q.style.left=m.style.left=x+'em';
    q.setAttribute('aria-hidden','true'); m.setAttribute('aria-hidden','true'); el.append(q,m); Q.push(q); M.push(m); });
  Q.forEach((q,j)=>{ const m=M[j]; m.style.transform=`scaleX(${q.getBoundingClientRect().width/Math.max(.01,m.getBoundingClientRect().width)})`; });
  const dark=!!el.closest('.night');
  el._Q=Q; el._M=M; el._t=-1; el._q=dark?NIGHT.quiet:C.quiet; el._i=dark?NIGHT.ink:C.ink;
}
function say(el,t){ if(Math.abs(el._t-t)<.002) return; el._t=t; swapLetters(el._Q,el._M,t,el._q,el._i); }

// headlines: the stressed word (<b>) speaks as the line rises past the lower third of the screen
function headlines(){
  qsa('.say').forEach(h=>{
    const ws=qsa('b',h);
    ws.forEach(b=>{ const n=b.nextSibling; if(n&&n.nodeName==='I'){ const k=document.createElement('span'); k.style.whiteSpace='nowrap'; b.before(k); k.append(b,n); } });
    ws.forEach(prep); let s=0;
    parts.push({update(){
      const r=h.getBoundingClientRect(), vh=VH(); if(r.bottom<-vh||r.top>vh*2) return;
      const t=clamp((vh*.86-r.top)/(vh*.3)); s+=(t-s)*.12; if(Math.abs(t-s)<.001) s=t;
      ws.forEach(w=>say(w,E.house(s)));
      if(h.hasAttribute('data-live')) h.classList.toggle('spoken',s>.62);
    }});
  });
}

// the roster as a list: one presence. Only the name nearest the reading line speaks, letter by letter; the one
// it leaves goes quiet the same way, and its show comes forward with it.
function roster(){
  qsa('.roster ol').forEach(ol=>{
    const L=qsa('li',ol).map(li=>{ const w=qs('.who',li); prep(w); return {li,w,s:0}; });
    parts.push({update(){
      const r=ol.getBoundingClientRect(), vh=VH(); if(r.bottom<-vh*.5||r.top>vh*1.5) return;
      const line=vh*.5; let best=null, bd=1e9;
      L.forEach(o=>{ const q=o.li.getBoundingClientRect(), d=Math.abs(q.top+q.height/2-line); if(d<bd){ bd=d; best=o; } });
      const live=best&&bd<best.li.offsetHeight*1.6?best:null;
      L.forEach(o=>{ const t=o===live?1:0; o.s+=(t-o.s)*.16; if(Math.abs(t-o.s)<.002) o.s=t; say(o.w,E.house(o.s)); o.li.classList.toggle('on',o.s>.5); });
    }});
  });
}

// ---------------------------------------------------------------- pinned stages
function pinProgress(sec){ const r=sec.getBoundingClientRect(), vh=VH(); return {p:clamp(-r.top/Math.max(1,r.height-vh)),vis:r.bottom>-vh*.2&&r.top<vh*1.2}; }
function mountStage(sec,api){ parts.push({update(){ const {p,vis}=pinProgress(sec); api.tick(p,vis); }, resize(){ api.fit(); }}); }

// Change: the hero is one of the Round 7 options, run unchanged on a stage inside the first section
function hero(){
  const sec=qs('[data-pin="hero"]'); if(!sec) return Promise.resolve();
  // on a tall screen the composition is framed by the headline's width (not the whole stage), so the type stays
  // readable; the option's small caption would be too small there, so it is left out
  const tall=(w,h)=>w<h*.9;
  const fitFn=(w,h)=>{ const cap=sec.querySelector('[data-cap]');
    if(cap) cap.style.display=tall(w,h)?'none':'';
    if(!tall(w,h)){ const s=Math.min(w/1920,h/1080); return {s,tx:(w-1920*s)/2,ty:(h-1080*s)/2}; }
    const s=w/1560; return {s,tx:0,ty:h*.44-540*s}; };
  const host=qs('.pin-in',sec), f0=fitFn(host.clientWidth,host.clientHeight);
  window.TTD_MX=Math.round((Math.max(16,innerWidth*.0111)-f0.tx)/f0.s);   // the headline sits on the page margin
  const api=TTDStage(host,{fit:fitFn}); window.TTD=api;
  return new Promise(res=>{ const s=document.createElement('script'); s.src='js/opts.js'; s.onload=()=>{
      const want=(new URLSearchParams(location.search).get('hero')||'01').padStart(2,'0');
      const row=(window.LIST||[]).find(o=>o[0]===want)||['01','SU1'];
      api.run(OPTS[row[1]].init()); api.fit(); sec.dataset.option=row[1]; mountStage(sec,api); res(); };
    document.body.appendChild(s); });
}

// Connection: scattered dashes fall into one field. At rest it is a quiet composition, a stacked label on the
// left and the field on the right (after Seita Kobayashi's Shape of Sound): the brand's statement and reply rows.
function sight(){
  const sec=qs('[data-pin="sight"]'); if(!sec) return;
  const FX0=811, FX1=1898, FY0=318, ROWS=11, RS=46, DH=14;   // the field starts where the text column does
  const fitFn=(w,h)=>{ if(w>=760) { const s=Math.min(w/1920,h/1080); return {s,tx:(w-1920*s)/2,ty:(h-1080*s)/2}; }
    const s=(w-40)/(FX1-FX0); return {s,tx:20-FX0*s,ty:h*.56-(FY0+ROWS*RS/2)*s}; };
  const api=TTDStage(qs('.pin-in',sec),{fit:fitFn,overflow:'visible'});
  const {bar,put}=api;
  const rnd=(s=>()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;})(11);
  const WID=[18,44,48,92,104,111,127,144,183], GAP=[18,26,40,62,96,150];
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const P=[];
  for(let r=0;r<ROWS;r++){
    const y=FY0+r*RS, col=r%2?'tan':'ink', sparse=r===3||r===8, flush=r!==5&&r!==9;
    let x=FX0+(r===4||r===10?pick([92,150,240]):0);
    while(x<FX1-14){ let w=pick(WID); if(sparse&&rnd()<.5) w=pick([18,44,48]);
      if(x+w>FX1-20||(flush&&x+w+40>FX1)) w=FX1-x; if(!flush&&x+w>FX1-120) break;
      P.push({x,y,w,h:DH,c:col}); x+=w+(sparse?pick([96,150,210]):pick(GAP)); }
  }
  // one presence: the reply dash nearest the middle of the field is Signal red
  let best=null; P.filter(q=>q.c==='tan'&&q.y===FY0+5*RS).forEach(q=>{ const c=(FX0+FX1)/2; if(!best||Math.abs(q.x+q.w/2-c)<Math.abs(best.x+best.w/2-c)) best=q; }); if(best) best.c='sig';
  P.forEach(q=>{ q.z=.16+Math.pow(rnd(),1.3)*3.1; q.el=bar(q.c==='ink'?C.ink:q.c==='tan'?C.tan:C.red); });
  P.slice().sort((a,b)=>b.z-a.z).forEach((q,i)=>q.el.style.zIndex=10+i);
  const VX=(FX0+FX1)/2, VY=FY0+(ROWS-1)*RS/2;
  // the camera starts inside the field, so the pieces are large and everywhere; it pulls back until they align
  const cam=p=>.95*(1-E.inOut(seg(p,.03,.66)));
  const lab=qs('.lab-s',sec);
  // the ripple, kept in pacing (never height): near the pointer each dash slides toward it along its own row
  let px=null, py=null, aligned=false; P.forEach(q=>q.o=0);
  const host=qs('.pin-in',sec), fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(fine){ host.addEventListener('mousemove',e=>{ const st=api.stage.getBoundingClientRect(), k=st.width/1920; px=(e.clientX-st.left)/k; py=(e.clientY-st.top)/k; });
    host.addEventListener('mouseleave',()=>{ px=py=null; }); }
  api.run(p=>{ const c=cam(p); aligned=c<.004;
    P.forEach(q=>{ if(q.z<=c+.002){ put(q.el,0,0,0,0); return; }
      let to=0; if(aligned&&px!==null){ const qc=q.x+q.w/2, g=Math.exp(-Math.pow((qc-px)/250,2)-Math.pow((q.y-py)/80,2)); to=(px-qc)*.46*g; }
      q.o+=(to-q.o)*.12; if(Math.abs(q.o)<.01) q.o=0;
      const r=q.z/(q.z-c), x=VX+(q.x+q.o-VX)*r, y=VY+(q.y-VY)*r, w=q.w*r, h=q.h*r;
      if(x>2400||x+w<-480||y>1500||y+h<-420){ put(q.el,0,0,0,0); return; }
      put(q.el,x,y-h/2,w,h); });
    if(lab) lab.classList.toggle('in',p>.68);
  });
  // the label sits on the stage's grid, so it is placed from the stage
  const place=()=>{ if(!lab) return; const st=api.stage.getBoundingClientRect(), k=st.width/1920, host=qs('.pin-in',sec).getBoundingClientRect();
    if(innerWidth>=760){ lab.style.left=Math.max(16,innerWidth*.0111)+'px'; lab.style.top=(st.top-host.top+(FY0-12)*k)+'px'; }
    else { lab.style.left='20px'; lab.style.top=(st.top-host.top+(FY0-40)*k-lab.offsetHeight)+'px'; } };
  place(); mountStage(sec,api); parts.push({resize:place});
}

// ---------------------------------------------------------------- Possibility: icons into buildings
// Four designed key poses per icon (Round 5). A pose flips outright as scroll passes its mark, and settles.
function icons(){
  qsa('.icons').forEach(el=>{
    const keys=el.dataset.icons.split(','), xs=(el.dataset.x||'').split(',').map(Number);
    const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'); el.prepend(svg);
    const ground=document.createElementNS(NS,'rect'); ground.setAttribute('fill','rgba(23,22,20,.3)'); svg.appendChild(ground);
    const I=keys.map(k=>{ const m=POSES[k]; let x0=1e9,y0=1e9,x1=-1e9; m.poses.flat().forEach(r=>{x0=Math.min(x0,r[0]);y0=Math.min(y0,r[1]);x1=Math.max(x1,r[0]+r[2]);});
      const g=document.createElementNS(NS,'g'), inner=document.createElementNS(NS,'g'); inner.setAttribute('class','pose'); g.appendChild(inner); svg.appendChild(g);
      return {m,x0,y0,bw:x1-x0,bh:m.g-y0,g,inner,k:-1}; });
    const cap=qs('.cap',el);
    let GY=0;
    const draw=(it,k,flip)=>{ it.inner.innerHTML=it.m.poses[k].map(r=>`<rect x="${r[0]-it.x0}" y="${r[1]-it.y0}" width="${r[2]}" height="${r[3]}" fill="#171614"/>`).join('');
      if(flip){ it.inner.classList.remove('flip'); void it.inner.getBBox(); it.inner.classList.add('flip'); } };
    function layout(){
      const w=el.clientWidth, h=el.clientHeight, m=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--m'))*(innerWidth>760?innerWidth/100:1)||20;
      svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
      GY=h*(+el.dataset.ground||.74);
      const maxH=Math.max(...I.map(i=>i.bh)), sumW=I.reduce((a,i)=>a+i.bw,0);
      const S=Math.min(h*(+el.dataset.scale||.5)/maxH,(w-2*m)/(sumW*1.5));
      I.forEach((it,j)=>{ const cx=(xs[j]||((j+1)/(I.length+1)))*w; it.g.setAttribute('transform',`translate(${cx-it.bw*S/2} ${GY-it.bh*S}) scale(${S})`); });
      ground.setAttribute('x',m); ground.setAttribute('y',GY); ground.setAttribute('width',w-2*m); ground.setAttribute('height',1);
      if(cap) cap.style.top=(GY+Math.max(24,h*.05))+'px';
    }
    layout(); I.forEach(it=>{ it.k=0; draw(it,0,false); });
    // progress is read from the ground line, so the change happens in full view: it starts as the ground
    // passes 90% of the screen and the street is complete by the time it reaches the middle
    const A=+(el.dataset.from||.08), STEP=.17, LAG=.07;
    parts.push({resize:layout, update(){
      const r=el.getBoundingClientRect(), vh=VH(); if(r.bottom<-vh||r.top>vh*2) return;
      const q=clamp((vh*.9-(r.top+GY))/(vh*.45));
      I.forEach((it,j)=>{ const a=A+j*LAG, k=q<a?0:q<a+STEP?1:q<a+2*STEP?2:3; if(k!==it.k){ it.k=k; draw(it,k,true); } });
      el.classList.toggle('in',I.every(it=>it.k===3));
    }});
  });
}

// ---------------------------------------------------------------- the names, as a waveform
// After the radio poster: every booking is a bar, the guest's name set along it. Scroll carries one presence
// across the bars: that bar turns Signal red, its name speaks, the bars beside it lean up, and the readout
// says who and where.
const BOOKINGS=[
  ['Nikki Glaser','Get Real with Me with Alix Earle'],['Louis Theroux','Gavin Newsom'],['Ken Burns','Gavin Newsom'],
  ['Matthew McConaughey','Modern Wisdom'],['William H. Macy','Thanks Dad with Ego Nwodim'],['Marc Maron','Bombing with Eric Andre'],
  ['Kumail Nanjiani','Paul’s Best'],['Kevin Hart','The Diary of a CEO'],['Kamala Harris','The Diary of a CEO'],
  ['Brene Brown','The Diary of a CEO'],['Neil deGrasse Tyson','The Diary of a CEO'],['Adam Scott','Hollywood Handbook'],
  ['Riz Ahmed','Hollywood Handbook'],['Nick Kroll','Take Your Shoes Off with Rick Glassman'],['Alison Brie','Take Your Shoes Off with Rick Glassman'],
  ['Judd Apatow','Modern Wisdom'],['Tom Segura','Modern Wisdom'],['Ilona Maher','Olivia’s House'],
  ['Bryan Johnson','What Now? with Trevor Noah'],['Roger Federer','What Now? with Trevor Noah'],['Julia Louis-Dreyfus','What Now? with Trevor Noah']];
window.TTD_BOOKINGS=BOOKINGS;
function waveNames(){
  const sec=qs('[data-pin="names"]'); if(!sec) return;
  const wv=qs('.wv',sec), now=qs('.readout .now',sec);
  const WH=[...WAVE.slice(9),...WAVE], N=BOOKINGS.length;
  const K=[.55,.3,.75,.4,.62,.22,.5,.8,.35,.66,.45,.28,.7,.52,.38,.6,.25,.72,.48,.33,.58];
  const B=BOOKINGS.map(([who],i)=>{ const b=document.createElement('div'); b.className='b'; b.style.setProperty('--k',K[i]*2);
    b.innerHTML=`<i class="t"></i><em>${who}</em><i class="u"></i>`; wv.appendChild(b); return {el:b,h:WH[i%WH.length]/362}; });
  let cur=-1, f=-1;
  const show=i=>{ const old=qsa('span',now); old.forEach(o=>{ o.style.transform='translateY(-110%)'; o.style.opacity=0; setTimeout(()=>o.remove(),700); });
    if(i<0) return; const s=document.createElement('span'); s.innerHTML=`<b>${BOOKINGS[i][0]}</b><s>${BOOKINGS[i][1]}</s>`; s.style.transform='translateY(110%)'; now.appendChild(s);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ s.style.transform='none'; })); };
  parts.push({update(){
    const {p,vis}=pinProgress(sec); if(!vis) return;
    const tf=lerp(-1.2,N+.2,seg(p,.12,.94)); f+=(tf-f)*.1;
    const a=Math.round(f), act=a>=0&&a<N?a:-1;
    const pitch=wv.clientWidth/N;
    B.forEach((b,i)=>{ const g=Math.exp(-Math.pow((i-f)/1.7,2)); b.el.style.height=(b.h*100).toFixed(2)+'%'; b.el.style.transform=`translateX(${((f-i)*pitch*.2*g).toFixed(2)}px)`;
      b.el.classList.toggle('on',i===act); b.el.classList.toggle('red',i===act); });
    if(act!==cur){ cur=act; show(act); }
  }});
}

// ---------------------------------------------------------------- the footer: a wall of lines opens into a pause
// After "Change is a constant": dense vertical lines; as you arrive, a waveform-shaped pause opens through them,
// starting at one red line and travelling outward, so one presence changes the whole field.
function footField(){
  const cv=qs('.foot canvas'); if(!cv) return;
  const ctx=cv.getContext('2d'); let w=0,h=0,dpr=1,last=-1,s=0;
  const size=()=>{ dpr=Math.min(2,devicePixelRatio||1); w=cv.clientWidth; h=cv.clientHeight; cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); last=-1; };
  size();
  function draw(p){
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    const pitch=Math.max(7,Math.min(13,w/150)), lw=Math.max(1.6,pitch*.3), N=Math.floor((w-lw)/pitch)+1, off=(w-((N-1)*pitch+lw))/2, ir=Math.round(N*.62);
    for(let i=0;i<N;i++){
      const u=i/N, cy=h*(.5+.17*Math.sin(u*9.1+1.3)+.08*Math.sin(u*23+.4)+.04*Math.sin(u*57+2.1));
      const near=Math.exp(-Math.pow((i-ir)/(N*.16),2)), g=h*(.07+.3*near+.1*Math.abs(Math.sin(u*31)));
      const d=Math.abs(i-ir)/N, o=E.house(clamp((p-d*.7)/.42)), gg=g*o;
      ctx.fillStyle=i===ir?C.red:C.cream;
      const t=Math.max(0,cy-gg/2), b=Math.min(h,cy+gg/2);
      ctx.fillRect(off+i*pitch,0,lw,t); ctx.fillRect(off+i*pitch,b,lw,h-b);
    }
  }
  parts.push({resize:size, update(){
    const r=cv.getBoundingClientRect(), vh=VH(); if(r.bottom<0||r.top>vh) return;
    const t=clamp((vh*.92-r.top)/(vh*.62)); s+=(t-s)*.1; if(Math.abs(t-s)<.001) s=t;
    if(Math.abs(s-last)>.0005){ last=s; draw(s); }
  }});
}

// ================================================================ Lando moments (after landonorris.com)
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Headline reveal. A solid Draft bar sweeps across each line, the words appear under it, the bar pulls away.
// Plays once, in time, when the headline arrives (never scrubbed, so nothing is left half-covered).
function reveals(){
  qsa('h1.disp,h2.disp,.rv-me').forEach(h=>{
    if(RM) return;
    const inn=document.createElement('span'); inn.className='rvin'; while(h.firstChild) inn.appendChild(h.firstChild); h.appendChild(inn);
    const bars=document.createElement('span'); bars.className='bars'; bars.setAttribute('aria-hidden','true'); h.appendChild(bars);
    h.classList.add('rv','hid'); let done=false, B=[];
    const measure=()=>{ if(done) return; bars.innerHTML=''; const rg=document.createRange(); rg.selectNodeContents(inn);
      const r0=h.getBoundingClientRect(), fs=parseFloat(getComputedStyle(h).fontSize), L=[];
      [...rg.getClientRects()].filter(r=>r.width>2&&r.height>fs*.4).forEach(r=>{ const k=L.find(l=>Math.abs(l.t-r.top)<fs*.35); if(k){ k.l=Math.min(k.l,r.left); k.r=Math.max(k.r,r.right); k.b=Math.max(k.b,r.bottom); } else L.push({t:r.top,b:r.bottom,l:r.left,r:r.right}); });
      B=L.sort((a,b)=>a.t-b.t).map(l=>{ const i=document.createElement('i'); const pad=fs*.04; i.style.cssText=`left:${l.l-r0.left-pad}px;top:${l.t-r0.top+fs*.06}px;width:${l.r-l.l+pad*2}px;height:${(l.b-l.t)-fs*.12}px`; bars.appendChild(i); return i; }); };
    measure();
    const play=()=>{ done=true; const n=B.length, st=.085;
      B.forEach((b,i)=>{ b.style.transition=`transform .5s cubic-bezier(.65,0,.35,1) ${i*st}s`; b.style.transformOrigin='0 50%'; b.style.transform='scaleX(1)'; });
      setTimeout(()=>{ h.classList.remove('hid'); inn.classList.add('settle');
        B.forEach((b,i)=>{ b.style.transition=`transform .62s cubic-bezier(.22,1,.36,1) ${i*st}s`; b.style.transformOrigin='100% 50%'; b.style.transform='scaleX(0)'; }); },500+(n-1)*st*1000+60); };
    parts.push({resize:measure, update(){ if(done) return; const r=h.getBoundingClientRect(), vh=VH();
      if(r.bottom<0){ done=true; h.classList.remove('hid'); return; }      // already passed (a jump link): just show it
      if(r.top<vh*.9&&r.bottom>0&&r.width>0) play(); }});
  });
}

// The photograph recedes. Full screen at first; as you scroll it shrinks into a card in the middle, the room
// turns Ink, and two lines run past behind it in opposite directions.
function recede(){
  const sec=qs('[data-pin="recede"]'); if(!sec) return;
  const pin=qs('.pin-in',sec), card=qs('.card',sec), img=qs('.card img',sec), rows=qsa('.mq p',sec); let s=0, lp=0, lean=0;
  parts.push({update(){
    const {p,vis}=pinProgress(sec); s+=(p-s)*.14; if(Math.abs(p-s)<1e-4) s=p; if(!vis) return;
    const vw=pin.clientWidth, vh=pin.clientHeight, k=E.inOut(seg(s,.04,.6));
    const cw=Math.min(vw*(vw<760?.78:.38),vh*1.1), ch=cw*.62, w=lerp(vw,cw,k), h=lerp(vh,ch,k);
    card.style.width=w+'px'; card.style.height=h+'px'; card.style.transform=`translate(${(vw-w)/2}px,${(vh-h)/2}px)`;
    img.style.transform=`scale(${lerp(1.1,1,E.house(seg(s,0,.6))).toFixed(4)})`;
    const d=E.inOut(seg(s,.1,.42)); pin.style.backgroundColor=mix(C.cream,C.ink,d);
    const ds=s-lp; lp=s; lean+=(clamp(-ds*2600,-7,7)-lean)*.12;          // velocity lean, back to upright at rest
    rows.forEach((r,i)=>{ const dir=i%2?1:-1; r.style.opacity=d; r.style.transform=`translateX(${(i%2?-60:-8)+dir*s*42}vw) skewX(${(dir*lean).toFixed(2)}deg)`; });
  }});
}

// A sideways gallery. The section holds while the photographs travel past at their own depths; the room
// turns from Ink back to Cream as it starts.
function track(){
  const sec=qs('[data-pin="track"]'); if(!sec) return;
  const pin=qs('.pin-in',sec), tr=qs('.tr',sec), head=qs('.tr-head',sec), F=qsa('figure',sec).map(f=>({f,x:+f.dataset.x,d:+f.dataset.d}));
  F.sort((a,b)=>a.d-b.d).forEach((o,i)=>o.f.style.zIndex=2+i);    // nearer photographs pass over farther ones
  let s=0;
  parts.push({update(){
    const {p,vis}=pinProgress(sec); s+=(p-s)*.14; if(Math.abs(p-s)<1e-4) s=p; if(!vis) return;
    const vw=innerWidth, K=parseFloat(getComputedStyle(tr).getPropertyValue("--k"))||1, L=148*K;
    F.forEach(o=>{ o.f.style.transform=`translateX(${((o.x*K-s*L*o.d)*vw/100).toFixed(1)}px)`; });
    const c=E.inOut(seg(s,0,.14)); pin.style.backgroundColor=mix(C.ink,C.cream,c); head.style.color=mix(C.cream,C.ink,c);
  }});
}

// The Work / The Dept. Two photographs slide in from the edges to frame the two words; then The Work's
// photograph opens to the full screen and leads into the services.
function split(){
  const sec=qs('[data-pin="split"]'); if(!sec) return;
  const pin=qs('.pin-in',sec), L=qs('.il',sec), R=qs('.ir',sec), words=qs('.words',sec); let s=0;
  qsa('.w',sec).forEach((w,i)=>{ const im=i?R:L; w.addEventListener('mouseenter',()=>im.classList.add('hov')); w.addEventListener('mouseleave',()=>im.classList.remove('hov')); });
  const box=(el,x,y,w,h)=>{ el.style.width=w+'px'; el.style.height=h+'px'; el.style.transform=`translate(${x}px,${y}px)`; };
  parts.push({update(){
    const {p,vis}=pinProgress(sec); s+=(p-s)*.14; if(Math.abs(p-s)<1e-4) s=p; if(!vis) return;
    const vw=pin.clientWidth, vh=pin.clientHeight, m=Math.max(16,vw*.0111), small=vw<760;
    const a=E.house(seg(s,.02,.36)), o=E.inOut(seg(s,.5,.88));
    const lw=small?vw*.62:vw*.26, lh=small?vh*.22:vh*.5, rw=small?vw*.4:vw*.17, rh=rw*1.25;
    const lx0=small?m:m, ly0=small?vh*.06:(vh-lh)/2, rx=small?vw-m-rw:vw-m-rw, ry=small?vh-rh-vh*.06:(vh-rh)/2;
    // in: each slides from beyond its edge
    const lx=lerp(-lw-40,lx0,a), rxx=lerp(vw+40,rx,a);
    box(L,lerp(lx,0,o),lerp(ly0,0,o),lerp(lw,vw,o),lerp(lh,vh,o));
    box(R,rxx,ry,rw,rh); R.style.opacity=1-E.house(seg(s,.5,.62));
    words.style.opacity=1-E.house(seg(s,.48,.6)); L.style.zIndex=o>0?5:2;
  }});
}

// The people. Six portraits stacked as a deck fan open as the deck comes up the screen, and close again
// if you scroll back. Hovering lifts only the card under the pointer.
function fan(){
  const sec=qs('.fan'); if(!sec) return;
  const deck=qs('.deck',sec), C6=qsa('.card',sec); let s=0;
  C6.forEach((c,i)=>c.style.zIndex=10-Math.round(Math.abs(i-2.5)*2));
  parts.push({update(){
    const r=deck.getBoundingClientRect(), vh=VH(); if(r.bottom<-vh||r.top>vh*2) return;
    const t=clamp((vh*.92-r.top)/(vh*.55)); s+=(t-s)*.12; if(Math.abs(t-s)<1e-4) s=t; const f=E.house(s), vw=innerWidth, sp=vw<760?.105:.135;
    C6.forEach((c,i)=>{ const k=i-2.5; c.style.transform=`translate(${(k*sp*vw*f).toFixed(1)}px,${(Math.abs(k)*Math.abs(k)*.011*vw*f).toFixed(1)}px) rotate(${(k*1.4+k*5.6*f).toFixed(2)}deg)`; });
    sec.classList.toggle('open',f>.92);
  }});
}

// The footer arrives with a curved top edge, which flattens as it settles.
function footArc(){
  const ft=qs('.foot'); if(!ft||RM) return; let s=0;
  parts.push({update(){ const r=ft.getBoundingClientRect(), vh=VH(); if(r.top>vh*1.2) return;
    const t=clamp((vh-r.top)/(vh*.7)); s+=(t-s)*.14; if(Math.abs(t-s)<1e-4) s=t;
    const R=(1-E.house(s))*Math.min(innerWidth*.16,vh*.24); ft.style.borderRadius=`50% 50% 0 0 / ${R.toFixed(1)}px ${R.toFixed(1)}px 0 0`; }});
}

// Between pages: an Ink panel with the mark wipes up over the page, and away on the next one.
function veil(){
  if(RM) return;
  const v=document.createElement('div'); v.className='veil'; v.innerHTML='<img src="assets/ttd-logo-light.svg" alt="">'; document.body.appendChild(v);
  let came=false; try{ came=sessionStorage.getItem('ttd-veil')==='1'; sessionStorage.removeItem('ttd-veil'); }catch(e){}
  if(came){ v.classList.add('cover'); requestAnimationFrame(()=>requestAnimationFrame(()=>{ setTimeout(()=>{ v.classList.remove('cover'); v.classList.add('off'); },140); })); }
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]'); if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank') return;
    const u=new URL(a.href,location.href); if(u.origin!==location.origin||u.protocol==='mailto:') return;
    if(u.pathname===location.pathname&&u.hash) return;                 // same-page anchors scroll as usual
    e.preventDefault(); try{ sessionStorage.setItem('ttd-veil','1'); }catch(e2){}
    v.classList.remove('off','cover'); void v.offsetWidth; v.classList.add('go'); setTimeout(()=>{ location.href=u.href; },560);
  });
  addEventListener('pageshow',e=>{ if(e.persisted){ v.className='veil'; } });
}

// ---------------------------------------------------------------- nav: part of the hero; elsewhere it steps
// aside while you read down and returns when you scroll up
function nav(){
  const n=qs('#nav'); if(!n) return; let lastY=scrollY;
  const hero=qs('[data-pin="hero"]'), darks=qsa('[data-dark]');
  parts.push({update(){
    const y=scrollY, vh=VH(), nh=n.offsetHeight;
    const inHero=hero&&hero.getBoundingClientRect().bottom>vh*.6;
    const dark=darks.some(d=>{ const r=d.getBoundingClientRect(); return r.top<nh*.6&&r.bottom>nh*.4; });
    if(inHero||y<8){ n.classList.remove('hide','solid'); }
    else { if(y>lastY+3) n.classList.add('hide'); else if(y<lastY-3) n.classList.remove('hide'); n.classList.add('solid'); }
    n.classList.toggle('dark',dark);
    lastY=y;
  }});
}

// ---------------------------------------------------------------- run
const ready=document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
ready.then(()=>hero()).then(()=>{
  headlines(); roster(); reveals(); sight(); icons(); waveNames(); footField(); nav();
  recede(); track(); split(); fan(); footArc();
  const loop=()=>{ parts.forEach(x=>x.update&&x.update()); requestAnimationFrame(loop); }; loop();
  let rt; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>parts.forEach(x=>x.resize&&x.resize()),80); });
  document.documentElement.dataset.ready='1';
  window.TTDParts=parts; document.dispatchEvent(new Event('ttd:ready'));
});
})();
