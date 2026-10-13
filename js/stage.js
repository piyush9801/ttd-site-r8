/* TTD site · stage engine.
   The hero motion engine from the Round 7 tests, made into a factory so a 1920x1080 stage can live inside
   any pinned section of the site. Same API as the test engine (window.TTD), so the hero options run unchanged.
   Scroll drives everything: the section's own progress (0..1) is followed with a soft lag (the house "pour,
   never snap"). Flat 2D only: depth comes from scale, crop, overlap and speed. No shadows. */
(function(){
const W=1920, H=1080;
const C={cream:'#F2EEE5',paper:'#FBF9F4',ink:'#171614',tan:'#C7B394',red:'#D65A4A',quiet:'#96938D'};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const lerp=(a,b,t)=>a+(b-a)*t;
function bez(x1,y1,x2,y2){
  const cx=3*x1, bx=3*(x2-x1)-cx, ax=1-cx-bx, cy=3*y1, by=3*(y2-y1)-cy, ay=1-cy-by;
  const X=t=>((ax*t+bx)*t+cx)*t, Y=t=>((ay*t+by)*t+cy)*t, dX=t=>(3*ax*t+2*bx)*t+cx;
  return x=>{ if(x<=0) return 0; if(x>=1) return 1; let t=x; for(let i=0;i<7;i++){ const d=dX(t); if(Math.abs(d)<1e-6) break; t-= (X(t)-x)/d; } return Y(clamp(t)); };
}
const E={
  house: bez(.22,1,.36,1), inOut: bez(.65,0,.35,1), in: bez(.55,0,.85,.35), over: bez(.3,1.3,.4,1),
  pop: bez(.34,1.56,.64,1), back: bez(.5,-.32,.3,1), backOver: bez(.6,-.38,.3,1.32), lin: t=>t
};
const WAVE=[191,213,245,307,334,362,282,209,313,350,250,308,278,247,193];
const RH={
  statementA:[[100,127],[256,48],[436,111],[572,44],[704,183],[912,18]],
  replyA:[[620,104],[752,35],[872,52],[956,148],[1276,31]],
  statementB:[[100,27],[160,144],[392,92],[508,18],[654,96],[777,109]],
  replyB:[[620,67],[716,18],[870,112],[1014,63],[1106,60],[1257,19]]
};

// Speaking without a double image: a word's letters are re-set one by one at the positions the shaped text had
// (so kerning is kept), each with a Medium copy narrowed to that letter's Light width. The letters darken from
// quiet to ink first, then the weight flips letter by letter in reading order.
function prepSpeak(s,quiet){
  const q=s.firstChild, m=s.lastChild, tn=q.firstChild, rg=document.createRange();
  const sr=s.getBoundingClientRect(), ratio=s.offsetWidth/Math.max(1e-6,sr.width);
  const L=[...tn.textContent].map((ch,i)=>{ rg.setStart(tn,i); rg.setEnd(tn,i+1); const r=rg.getBoundingClientRect(); return {ch,x:(r.left-sr.left)*ratio,w:r.width*ratio}; });
  q.style.color='transparent'; if(m!==q) m.remove();
  const mk=(ch,x,wt,col)=>{ const e=document.createElement('span'); e.textContent=ch; e.style.cssText=`position:absolute;left:${x}px;top:0;font-weight:${wt};color:${col};letter-spacing:0;transform-origin:0 50%;white-space:pre`; s.appendChild(e); return e; };
  L.forEach(l=>{ const a=mk(l.ch,l.x,300,quiet); a.dataset.q=quiet; const b=mk(l.ch,l.x,500,C.ink); b.dataset.m=1; b.style.opacity=0;
    const bw=b.getBoundingClientRect().width*ratio; b.style.transform=`scaleX(${l.w/Math.max(1,bw)})`; });
}
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
function mix(a,b,t){ const A=hex(a),B=hex(b); return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`; }
function swapLetters(Q,M,t,quiet,ink=C.ink){ const n=Q.length, c=clamp(t/.45), u=clamp((t-.4)/.6);
  for(let j=0;j<n;j++){ const f=u*n-j>=.5?1:0;
    Q[j].style.color=mix(quiet||Q[j].dataset.q,ink,c); Q[j].style.opacity=1-f; M[j].style.opacity=f; } }
function speak(s,t){ if(s._t===t) return; s._t=t; const Q=s._Q||(s._Q=[...s.querySelectorAll('[data-q]')]), M=s._M||(s._M=[...s.querySelectorAll('[data-m]')]); swapLetters(Q,M,t); }

window.TTDCore={W,H,C,E,clamp,seg,lerp,bez,mix,swapLetters,WAVE,RH};

// host: the sticky, viewport-sized box the stage lives in. fit: 'contain' keeps the whole composition on
// screen (the hero); 'cover' fills the box and lets the composition run past its edges (Line of Sight).
// fit can also be a function (w,h) => {s,tx,ty} for a composition that needs its own framing on small screens.
window.TTDStage=function(host,{fit='contain',overflow='hidden'}={}){
  const stage=document.createElement('div');
  stage.className='stage';
  stage.style.cssText=`position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:${overflow};transform-origin:0 0;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif`;
  host.appendChild(stage);
  let scale=1;
  function fitNow(){ const w=host.clientWidth, h=host.clientHeight;
    if(typeof fit==='function'){ const f=fit(w,h); scale=f.s; stage.style.transform=`translate(${f.tx}px,${f.ty}px) scale(${f.s})`; return; }
    scale=fit==='cover'?Math.max(w/W,h/H):Math.min(w/W,h/H);
    stage.style.transform=`translate(${(w-W*scale)/2}px,${(h-H*scale)/2}px) scale(${scale})`; }
  fitNow();

  function box(css,parent=stage){ const d=document.createElement('i'); d.style.cssText='position:absolute;display:block;'+css; parent.appendChild(d); return d; }
  function bar(color,parent=stage){ return box(`background:${color};left:0;top:0;width:0;height:0;will-change:transform`,parent); }
  function put(d,x,y,w,h,o){ d.style.transform=`translate(${x}px,${y}px)`; d.style.width=Math.max(0,w)+'px'; d.style.height=Math.max(0,h)+'px'; if(o!==undefined) d.style.opacity=o; }
  // the site has its own navigation, so the options' in-stage nav and test labels are not drawn
  const nav=()=>document.createElement('div'), tag=()=>{};

  function headline({x=(window.TTD_MX||72),y=150,size=112,lines=[['The','right','person','can','change'],['the','whole','conversation']],lh=1.04,quiet=C.quiet,parent=stage,dot=true}={}){
    const root=document.createElement('div'); root.style.cssText=`position:absolute;left:${x}px;top:${y}px;z-index:20;white-space:nowrap;font-size:${size}px;line-height:${lh};letter-spacing:-.03em`;
    parent.appendChild(root);
    const words=[];
    lines.forEach((ln,li)=>{
      const row=document.createElement('div'); root.appendChild(row);
      ln.forEach((w,wi)=>{
        const s=document.createElement('span'); s.style.cssText='position:relative;display:inline-block';
        s.innerHTML=`<span class="q" style="font-weight:300;color:${quiet}">${w}</span><span class="m" style="position:absolute;left:0;top:0;font-weight:500;color:${C.ink};opacity:0;transform-origin:0 50%;letter-spacing:-.012em">${w}</span>`;
        row.appendChild(s);
        if(wi<ln.length-1) row.appendChild(document.createTextNode(' '));
        words.push(s);
      });
      if(dot&&li===lines.length-1){ const d=document.createElement('span'); d.className='dot'; d.style.cssText=`display:inline-block;font-weight:400;color:${C.red}`; d.textContent='.'; row.appendChild(d); root.dot=d; }
    });
    words.forEach(s=>prepSpeak(s,quiet));
    root.words=words;
    root.say=(i,t)=>{ const s=words[i]; if(s) speak(s,t); };
    root.hush=()=>words.forEach((_,i)=>root.say(i,0));
    return root;
  }
  // brand-book lines, one per beat; each rises from behind a mask as its beat starts and leaves upward as it ends
  function captions(beats,{x=72,y=928,w=1500,size=32,plate=false}={}){
    const bx=document.createElement('div'); bx.dataset.cap='1';
    bx.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${Math.round(size*1.5)}px;overflow:hidden;z-index:45`;
    if(plate){ bx.style.width='auto'; bx.style.minWidth='560px'; bx.style.paddingRight='18px'; bx.style.background=C.cream; bx.style.left=(x-14)+'px'; bx.style.paddingLeft='14px'; }
    stage.appendChild(bx);
    const els=beats.map(([a,b,t])=>{ const e=document.createElement('p');
      e.style.cssText=`position:absolute;left:0;top:0;margin:0;white-space:nowrap;font-size:${size}px;line-height:${Math.round(size*1.5)}px;font-weight:300;letter-spacing:-.012em;color:${C.ink};will-change:transform`;
      e.textContent=t; bx.appendChild(e); return {a,b,e}; });
    return p=>{ let any=false; els.forEach(({a,b,e})=>{
      const i=E.house(seg(p,a,a+.04)), o=b>1?0:E.house(seg(p,b-.035,b)), hid=p<a||(b<=1&&p>b);
      e.style.transform=`translateY(${((1-i)*110-o*110).toFixed(2)}%)`; e.style.visibility=hid?'hidden':'visible'; if(!hid) any=true;
    }); if(plate) bx.style.visibility=any?'visible':'hidden'; };
  }
  function rowsOf(segs,{x0,K,reps=3,period=1290}){ const out=[]; for(let r=0;r<reps;r++) segs.forEach(([sx,w])=>out.push({x:x0+(sx-100+r*period)*K,w:w*K})); return out; }
  function rectOf(el){ const s=stage.getBoundingClientRect(), r=el.getBoundingClientRect(), k=s.width/W; return {x:(r.left-s.left)/k,y:(r.top-s.top)/k,w:r.width/k,h:r.height/k}; }
  function voice(hl,k,keepLast){ for(let i=0;i<8;i++){ const t=(keepLast&&i===7&&k>7.4)?1:E.house(clamp(1-Math.abs(k-i-.5)*1.6)); hl.say(i,t); } }

  // speed: SPEED.f is a springy reading of the hand's scroll speed, so things drag, follow through and settle
  let lastP=0, lastQ=0, hv=0, fv=0; const SPEED={v:0,f:0,on:false};
  function trackSpeed(p,dt,q=p){ const k=Math.max(dt,1/240), raw=(p-lastP)/k; SPEED.v+=(raw-SPEED.v)*.25; lastP=p;
    hv+=((q-lastQ)/k-hv)*.2; lastQ=q;
    if(!SPEED.on){ SPEED.f=0; fv=0; hv=0; return; } fv+=(hv-SPEED.f)*.1; fv*=.82; SPEED.f+=fv; }
  function putS(d,x,y,w,h,o,{k=1.1,max=1.8,vert=false}={}){
    const px=d._px, py=d._py; d._px=x; d._py=y;
    if(px===undefined||!SPEED.on){ put(d,x,y,w,h,o); return; }
    const dx=x-px, dy=y-py;
    if(Math.abs(dx)>700||Math.abs(dy)>700){ put(d,x,y,w,h,o); return; }
    if(!vert){ const sm=Math.min(Math.abs(dx)*k,w*max); put(d,dx>0?x-sm:x,y,w+sm,h,o); }
    else { const sm=Math.min(Math.abs(dy)*k,h*max); put(d,x,dy>0?y-sm:y,w,h+sm,o); }
  }

  let draw=()=>{}, cur=0, target=0, t0=performance.now();
  const api={W,H,C,E,clamp,seg,lerp,bez,prepSpeak,speak,swapLetters,mix,WAVE,RH,stage,box,bar,put,putS,SPEED,nav,tag,headline,captions,rowsOf,rectOf,voice,
    fit:fitNow, p:0,
    run(fn){ draw=fn; SPEED.on=true; draw(0); },
    // called once a frame by the site loop with this section's scroll progress
    tick(tgt,visible,instant){ target=tgt; cur=instant?target:cur+(target-cur)*.075; if(Math.abs(target-cur)<1e-4) cur=target;
      const t1=performance.now(); trackSpeed(cur,(t1-t0)/1000,target); t0=t1; if(visible) draw(cur); api.p=cur; }
  };
  return api;
};
})();
