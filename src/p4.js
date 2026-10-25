// ===== Game state, world generation, physics =====
const GRAV=1150,JUMP=385,MAXFALL=560;
const G={state:'title',demo:true,terrain:{},cb:{},genCol:0,genH:3,items:[],obs:[],plats:[],decor:[],parts:[],pops:[],amb:[],camX:0,t:0,shake:0,
  hearts:3,maxHearts:3,pages:0,tables:0,charts:0,notes:0,pts:0,power:{cloud:0,agent:0,lite:0},biome:0,nextMile:500,startX:96,lastBig:0,lastSign:0,nextKm:1,overT:0,cause:''};
const P={x:96,y:0,w:16,h:28,vy:0,onGround:true,crouch:false,coyote:0,buffer:0,jumps:0,inv:0,anim:0,bonk:false,dead:false};
const IN={jump:false,crouch:false};
const BOT={jump:0,crouch:false};
let best=0;try{best=+localStorage.getItem('parselands-best')||0;}catch(e){}

const speedAt=x=>108+132*(1-Math.exp(-Math.max(0,x-G.startX)/35000));
const biomeIdx=x=>Math.floor(Math.max(0,x)/BIOME_LEN)%4;
function topOf(c){const h=G.terrain[c];return h===undefined?H-3*T:(h>0?H-h*T:Infinity);}
function biomeForCol(c){const x=c*T,b=Math.floor(x/BIOME_LEN),into=x-b*BIOME_LEN;if(b>0&&into<8*T&&hash(c,77)<1-into/(8*T))return(b-1)%4;return b%4;}

function newRun(demo){
  Object.assign(G,{demo,terrain:{},cb:{},genCol:0,genH:3,items:[],obs:[],plats:[],decor:[],parts:[],pops:[],hearts:3,maxHearts:3,pages:0,tables:0,charts:0,notes:0,pts:0,
    power:{cloud:0,agent:0,lite:0},biome:0,nextMile:500,startX:96,lastBig:0,lastSign:20,nextKm:1,shake:0,cause:'',score:0});
  G.rng=mulberry32((Date.now()*2654435761)>>>0);
  Object.assign(P,{x:96,y:H-3*T-28,h:28,vy:0,onGround:true,crouch:false,coyote:0,buffer:0,jumps:0,inv:0,bonk:false,dead:false});
  setMusicBiome(0);gen();
}

function setCol(c,h){G.terrain[c]=h;const bi=biomeForCol(c);G.cb[c]=bi;if(h>0)addDecor(c,bi);}
function addDecor(c,bi){
  const R=G.rng,r=R();
  const kmX=G.startX+G.nextKm*10000;
  if(c*T>=kmX){G.decor.push({x:c*T+2,k:'sign',label:G.nextKm+' KM',bi,c});G.nextKm++;G.lastSign=c;return;}
  if(c-G.lastSign>95&&r<0.08){G.decor.push({x:c*T+2,k:'sign',label:SIGNS[Math.floor(R()*SIGNS.length)],bi,c});G.lastSign=c;return;}
  if(r<0.2&&c-G.lastBig>=3){G.decor.push({x:c*T+8,k:'big',i:Math.floor(R()*3),bi,c});G.lastBig=c;}
  else if(r<0.62)G.decor.push({x:c*T+1+Math.floor(R()*10),k:'small',i:Math.floor(R()*DECOR[bi].small.length),bi,c});
}
function pick(){const r=G.rng();return r<0.025?'note':r<0.14?'table':r<0.25?'chart':'page';}
const ISZ={page:[11,13],table:[11,13],chart:[11,13],note:[11,13],heart:[11,10],cloud:[18,18],agent:[18,18],lite:[18,18]};
function addItem(k,x,y){const s=ISZ[k];G.items.push({k,x:x-s[0]/2,y,w:s[0],h:s[1],ph:G.rng()*6,taken:false});}
function addGroundObs(c,top,d){
  const R=G.rng,r=R();let o;
  if(d>0.3&&r<0.28)o={k:'tower',img:SPR.tower,w:15,h:26,ox:-2,oy:-4};
  else if(r<0.6)o={k:'stack',img:SPR.stacks[Math.floor(R()*SPR.stacks.length)],w:15,h:11,ox:-2,oy:-2};
  else o={k:'crate',img:SPR.crate,w:14,h:15,ox:-1,oy:-1};
  o.x=c*T+1;o.y=top-o.h;o.hit=false;G.obs.push(o);
  for(let i=0;i<3;i++)addItem('page',c*T+8+(i-1)*12,top-o.h-30-(i===1?8:0));
}
function addNoise(c,top){G.obs.push({k:'noise',x:c*T-6,y:top-19-14,w:30,h:14,ox:-3,oy:-3,hit:false,ph:G.rng()*6});}

function gen(){while(G.genCol<Math.floor(G.camX/T)+42)seg();}
function seg(){
  const R=G.rng,c0=G.genCol,x0=c0*T,d=clamp((x0-G.startX)/60000,0,1),spd=speedAt(x0),run=Math.floor(spd/55);
  let h=G.genH;
  if(c0<30){for(let i=0;i<30;i++)setCol(c0+i,3);G.genCol=30;return;}
  const r=R();
  if(r<0.4){ // flat run with one hazard
    if(R()<0.4)h=clamp(h+(R()<0.5?-1:1),2,5);
    const len=7+Math.floor(R()*6)+run;for(let i=0;i<len;i++)setCol(c0+i,h);
    const top=H-h*T,mid=c0+3+Math.floor(R()*Math.max(1,len-6)),q=R();
    if(q<0.38+0.22*d)addGroundObs(mid,top,d);
    else if(q<0.62+0.25*d){addNoise(mid,top);for(let i=-1;i<=2;i++)addItem(i===0&&R()<0.3?pick():'page',(mid+i)*T,top-13);}
    else for(let i=2;i<len-2;i+=1)addItem(i%4===0?pick():'page',(c0+i)*T+8,top-18-Math.round(Math.sin(i*0.8)*3));
    G.genCol+=len;G.genH=h;
  }else if(r<0.66){ // pit with item arc
    const maxGap=Math.max(2,Math.min(7,Math.floor(0.46*spd/T))),gap=2+Math.floor(R()*(maxGap-1));
    for(let i=0;i<gap;i++)setCol(c0+i,0);
    const h2=R()<0.6?h:clamp(h-1,2,5),land=3+run;for(let i=0;i<land;i++)setCol(c0+gap+i,h2);
    const top=H-h*T,n=gap+1;
    for(let i=0;i<n;i++){const tt=(i+0.5)/n;addItem(i===Math.floor(n/2)?pick():'page',(c0-0.5+tt*(gap+1))*T,top-24-Math.sin(tt*Math.PI)*34);}
    G.genCol+=gap+land;G.genH=h2;
  }else if(r<0.8&&d>0.05){ // wooden platform bridge over the void
    const top=H-h*T,end=c0+10+Math.floor(R()*6);let px=c0+1,py=top-T*(1+Math.floor(R()*2));
    while(px<end){const w=2+Math.floor(R()*2);G.plats.push({x:px*T,y:py,w:w*T});for(let i=0;i<w;i++)addItem(R()<0.15?pick():'page',(px+i)*T+8,py-17);
      px+=w+2+(spd>210?1:0);py=clamp(py+(R()<0.5?-1:1)*T,top-3*T,top-T);}
    for(let i=c0;i<px;i++)setCol(i,0);const land=3+run;for(let i=0;i<land;i++)setCol(px+i,h);
    G.genCol=px+land;G.genH=h;
  }else if(r<0.9){ // stepped hill
    const h1=clamp(h+1,2,5),l1=3+Math.floor(R()*3),h2=clamp(h1+1,2,5),l2=3+Math.floor(R()*3),l3=2+run;let c=c0;
    for(let i=0;i<l1;i++)setCol(c++,h1);for(let i=0;i<l2;i++){setCol(c,h2);addItem('page',c*T+8,H-h2*T-18);c++;}for(let i=0;i<l3;i++)setCol(c++,h1);
    if(R()<0.4+d*0.4)addGroundObs(c0+l1+Math.floor(l2/2),H-h2*T,d*0.5);
    G.genCol=c;G.genH=h1;
  }else{ // bonus: power-up or life crystal up high
    const len=9+run;for(let i=0;i<len;i++)setCol(c0+i,h);const top=H-h*T,mid=c0+Math.floor(len/2);
    const kind=(G.maxHearts<5||G.hearts<G.maxHearts)&&R()<0.28?'heart':['cloud','agent','lite'][Math.floor(R()*3)];
    for(let i=-3;i<0;i++)addItem('page',(mid+i)*T+8,top-18+i*8);addItem(kind,mid*T+8,top-50);
    G.genCol+=len;G.genH=h;
  }
}

// ----- particles / popups -----
function part(x,y,vx,vy,life,col,size=1,g=300){G.parts.push({x,y,vx,vy,life,max:life,col,size,g});}
function puff(x,y,n,col){for(let i=0;i<n;i++)part(x+(Math.random()-.5)*8,y-1,(Math.random()-.5)*40-30,-Math.random()*30,0.35+Math.random()*0.2,col||'#ffffff',Math.random()<.5?2:1,40);}
function burst(o){const cols=o.k==='noise'?['#4d3d98','#8f80ff','#ffffff','#0d0826']:['#f8f6ff','#e7e1fb','#FF8705','#4B72FE','#c98a4b'];
  for(let i=0;i<22;i++)part(o.x+Math.random()*o.w,o.y+Math.random()*o.h,(Math.random()-.3)*180,-Math.random()*170,0.6+Math.random()*0.5,cols[i%cols.length],Math.random()<.4?2:1,500);}
function sparkle(x,y,col,n=8){for(let i=0;i<n;i++){const a=i/n*Math.PI*2;part(x,y,Math.cos(a)*70,Math.sin(a)*70,0.4,col,1,0);}}
function pop(x,y,text,col='#ffffff'){G.pops.push({x,y,text,col,life:0.9});}
function toast(text){const el=$('toast');el.textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
function banner(bi){const B=BIOMES[bi];$('ban-name').textContent=B.name;$('ban-sub').textContent=B.sub;const el=$('banner');el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}

// ----- player physics (fixed substeps) -----
function stepPlayer(dt){
  const p=P,spd=speedAt(p.x);
  const wantC=G.demo?BOT.crouch:IN.crouch;
  if(wantC!==p.crouch){const nh=wantC?16:28;p.y+=p.h-nh;p.h=nh;p.crouch=wantC;if(wantC&&p.onGround&&!G.demo)sfx('crouch');}
  if(p.onGround)p.coyote=0.09;else p.coyote-=dt;
  p.buffer-=dt;
  if(p.buffer>0){
    if(p.coyote>0){p.vy=-JUMP;p.onGround=false;p.coyote=0;p.buffer=0;p.jumps=1;if(!G.demo)sfx('jump');puff(p.x+7,p.y+p.h,4);}
    else if(G.power.cloud>0&&p.jumps<2){p.vy=-JUMP*0.92;p.jumps=2;p.buffer=0;sfx('djump');for(let i=0;i<10;i++)part(p.x+7+(Math.random()-.5)*16,p.y+p.h,(Math.random()-.5)*60,20+Math.random()*20,0.5,i%2?'#ffffff':'#96E7F9',2,0);}
  }
  const held=G.demo?BOT.jump>0:IN.jump;
  if(!held&&p.vy<-150)p.vy=-150;
  let g=GRAV;if(p.crouch&&!p.onGround)g+=1700;
  p.vy=Math.min(p.vy+g*dt,p.crouch?760:MAXFALL);
  const prevFeet=p.y+p.h,wasG=p.onGround;
  p.x+=spd*dt;p.y+=p.vy*dt;
  let feet=p.y+p.h;
  const fc=Math.floor((p.x+p.w-2)/T),ft=topOf(fc);
  if(feet>ft+0.5){const diff=feet-ft;
    if((wasG&&diff<=17)||(!wasG&&diff<=12&&p.vy>=-60)){p.y=ft-p.h;p.vy=Math.min(p.vy,0);feet=ft;}
    else{p.x=fc*T-(p.w-2)-0.01;if(!p.bonk){p.bonk=true;if(!G.demo)sfx('bonk');G.shake=0.15;}}
  }else p.bonk=false;
  const lt=Math.min(topOf(Math.floor((p.x+2)/T)),topOf(Math.floor((p.x+p.w-2)/T)));
  let landed=false;
  if(p.vy>=0&&feet>=lt&&prevFeet<=lt+8){p.y=lt-p.h;landed=true;}
  if(!landed&&p.vy>=0)for(const pl of G.plats){if(prevFeet<=pl.y+1&&feet>=pl.y&&p.x+p.w-2>pl.x&&p.x+2<pl.x+pl.w){p.y=pl.y-p.h;landed=true;break;}}
  if(landed){if(!wasG&&p.vy>200){if(!G.demo)sfx('land');puff(p.x+7,p.y+p.h,5);}p.vy=0;p.onGround=true;p.jumps=0;}
  else p.onGround=false;
}

function botThink(dt){
  BOT.jump-=dt;const p=P,spd=speedAt(p.x),fx=p.x+p.w;let jump=false,duck=false;
  if(p.onGround){for(let x=fx;x<fx+spd*0.3;x+=6){if(topOf(Math.floor(x/T))===Infinity){jump=x-fx<spd*0.11+6;break;}}}
  for(const o of G.obs){if(o.hit)continue;const dx=o.x-fx;
    if(o.k==='noise'){if(dx<spd*0.22&&o.x+o.w>p.x-4)duck=true;}
    else if(p.onGround&&dx>0&&dx<spd*0.16+4)jump=true;}
  if(jump&&p.onGround){p.buffer=0.1;BOT.jump=0.24;}
  BOT.crouch=duck&&!jump&&!(BOT.jump>0&&p.vy<0);
}

function hurt(o){
  G.hearts--;P.inv=1.4;sfx('hurt');G.shake=0.32;
  const names={stack:'a Messy Scan',crate:'an Unparsed Crate',tower:'a Scan Tower',noise:'OCR Noise'};
  if(G.hearts<=0)die(names[o.k]);
}
function collect(it){
  it.taken=true;const m=G.power.lite>0?2:1,cx=it.x+it.w/2,cy=it.y;
  const add=(n,col)=>{G.pts+=n*m;pop(cx,cy,'+'+n*m,col);};
  switch(it.k){
    case 'page':G.pages++;add(10,'#ffffff');sfx('coin');sparkle(cx,cy+6,'#96E7F9',6);break;
    case 'table':G.pages++;G.tables++;add(25,'#FF8DF2');sfx('coin2');sparkle(cx,cy+6,'#FF8DF2');break;
    case 'chart':G.pages++;G.charts++;add(25,'#FFBD74');sfx('coin2');sparkle(cx,cy+6,'#FF8705');break;
    case 'note':G.pages++;G.notes++;add(100,'#FEEE05');sfx('rare');sparkle(cx,cy+6,'#FEEE05',14);toast('Handwriting parsed! +'+100*m);break;
    case 'heart':if(G.hearts>=G.maxHearts&&G.maxHearts<5){G.maxHearts++;toast('Life Crystal: max hearts up');}else toast('Life Crystal: heart restored');G.hearts=Math.min(G.maxHearts,G.hearts+1);sfx('heart');sparkle(cx,cy+5,'#ff5fb4',14);break;
    case 'cloud':G.power.cloud=12;sfx('power');toast('LlamaCloud: double jump!');sparkle(cx,cy+9,'#96E7F9',14);break;
    case 'agent':G.power.agent=12;sfx('power');toast('Agent mode: auto-collect!');sparkle(cx,cy+9,'#92AEFF',14);break;
    case 'lite':G.power.lite=12;sfx('power');toast('LiteParse: 2x points!');sparkle(cx,cy+9,'#FEEE05',14);break;
  }
}

function die(cause){
  if(G.demo){newRun(true);return;}
  if(G.state!=='play')return;
  G.state='over';G.cause=cause;P.dead=true;musicStop();sfx('over');G.overT=0;
  if(cause!=='the Unindexed Void')P.vy=-230;
  G.score=Math.floor((P.x-G.startX)/10)+G.pts;
  const score=G.score|0;if(score>best){best=score;try{localStorage.setItem('parselands-best',String(best));}catch(e){}}
  setTimeout(showReport,900);
}

function update(dt){
  G.t+=dt;
  if(G.state==='play'||G.state==='title'){
    if(G.demo)botThink(dt);
    const sub=Math.ceil(dt/(1/120));for(let i=0;i<sub;i++)stepPlayer(dt/sub);
    P.anim+=dt*speedAt(P.x)/14;P.inv=Math.max(0,P.inv-dt);
    if(P.onGround&&!P.crouch&&Math.floor(P.anim)%3===0&&!G.demo)sfx('step');
    if(P.onGround&&P.crouch&&Math.random()<0.5)part(P.x+2,P.y+P.h,-40-Math.random()*40,-Math.random()*20,0.3,'#ffffff',1,60);
    for(const k in G.power)G.power[k]=Math.max(0,G.power[k]-dt);
    G.camX=P.x-96;gen();
    // obstacles
    const px=P.x+2,py=P.y+2,pw=P.w-4,ph=P.h-3;
    for(const o of G.obs){if(o.hit)continue;if(px<o.x+o.w&&px+pw>o.x&&py<o.y+o.h&&py+ph>o.y){o.hit=true;burst(o);if(G.demo||P.inv>0)continue;hurt(o);if(G.state!=='play')break;}}
    // items + agent magnet
    for(const it of G.items){if(it.taken)continue;
      if(G.power.agent>0){const dx=P.x+7-(it.x+it.w/2),dy=P.y+P.h/2-(it.y+it.h/2),dd=Math.hypot(dx,dy);if(dd<120&&dd>1){it.x+=dx/dd*340*dt;it.y+=dy/dd*340*dt;}}
      if(px<it.x+it.w&&px+pw>it.x&&py<it.y+it.h&&py+ph>it.y){if(G.demo)it.taken=true;else collect(it);}}
    if(P.y>H+30)die('the Unindexed Void');
    if(!G.demo&&G.state==='play'){
      const m=(P.x-G.startX)/10;G.score=Math.floor(m)+G.pts;
      if(m>=G.nextMile){toast(G.nextMile+' m indexed');sfx('milestone');G.nextMile+=500;}
      const bi=biomeIdx(P.x);if(bi!==G.biome){G.biome=bi;banner(bi);sfx('biome');setMusicBiome(bi);}
    }
    // cleanup
    const cut=G.camX-80;
    G.items=G.items.filter(i=>!i.taken&&i.x>cut);G.obs=G.obs.filter(o=>o.x>cut);G.plats=G.plats.filter(p=>p.x+p.w>cut);G.decor=G.decor.filter(d=>d.x>cut-40);
    const cc=Math.floor(cut/T);for(const k in G.terrain)if(+k<cc){delete G.terrain[k];delete G.cb[k];}
  }else if(G.state==='over'){
    G.overT+=dt;if(P.y<H+40){P.vy+=GRAV*dt;P.y+=P.vy*dt;}
  }
  for(const p of G.parts){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}G.parts=G.parts.filter(p=>p.life>0);
  for(const p of G.pops){p.life-=dt;p.y-=22*dt;}G.pops=G.pops.filter(p=>p.life>0);
  G.shake=Math.max(0,G.shake-dt);
}
