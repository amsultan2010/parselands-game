// ===== Rendering =====
const SPR={};let DECOR=[],TILES=[];
function makeGlow(){const c=mk(48,48),x=c.getContext('2d');for(let r=22;r>2;r-=4){x.globalAlpha=0.07;disc(x,24,24,r,'#FF8DF2');}x.globalAlpha=1;return c;}
function initSprites(){
  SPR.llama=buildLlama();SPR.items=buildItems();SPR.stacks=[makeStack(1,2),makeStack(2,2),makeStack(3,3)];SPR.tower=makeStack(9,5);
  SPR.crate=makeCrate();SPR.noise=makeNoise();SPR.plank=makePlank();SPR.glow=makeGlow();
  DECOR=BIOMES.map((b,i)=>buildDecor(i));TILES=BIOMES.map((b,i)=>buildTiles(b,i));
}
const cv=$('screen'),ctx=cv.getContext('2d'),low=mk(W,H),L=low.getContext('2d');
let S=2;
function resize(){
  const wrap=$('wrap'),touch=$('touch'),extra=$('bar').offsetHeight+(touch.offsetHeight?touch.offsetHeight+10:0)+10+20;
  const aw=wrap.clientWidth,ah=Math.max(120,wrap.clientHeight-extra);let gw=Math.min(aw,ah*16/9);gw=Math.floor(gw);const gh=Math.floor(gw*9/16);
  const g=$('game');g.style.width=gw+'px';g.style.height=gh+'px';g.style.fontSize=(gw/46)+'px';
  const dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(gw*dpr);cv.height=Math.round(gh*dpr);S=cv.width/W;
}
addEventListener('resize',resize);

function ridge(x,shape){
  let v=0.5+0.28*Math.sin(x*0.009)+0.14*Math.sin(x*0.023+1.3)+0.08*Math.sin(x*0.051+2.1);
  if(shape==='mesa')v=Math.round(v*4)/4+0.015*Math.sin(x*0.3);
  else if(shape==='peak')v=0.25+0.62*Math.pow(Math.abs(Math.sin(x*0.011)),0.7)+0.1*Math.sin(x*0.05);
  else if(shape==='pine')v=v*0.55+0.22+0.16*(1-Math.abs(((x/7)%2)-1));
  return v;
}
function cloudAt(x,cx,cy,s,col,sh){const r=[7,10,8].map(v=>Math.round(v*s));
  x.globalAlpha=1;disc(x,cx,cy+3,r[0],sh);disc(x,cx+r[0]+2,cy+1,r[1],sh);disc(x,cx+r[0]*2+r[1]-2,cy+3,r[2],sh);
  disc(x,cx,cy+1,r[0],col);disc(x,cx+r[0]+2,cy-1,r[1],col);disc(x,cx+r[0]*2+r[1]-2,cy+1,r[2],col);x.fillStyle=sh;x.fillRect(cx-r[0],cy+r[0]+1,r[0]*3+r[1]*2,2);}
function ring(x,cx,cy,r,col){x.fillStyle=col;for(let a=0;a<64;a++){const t=a/64*Math.PI*2;x.fillRect(Math.round(cx+Math.cos(t)*r),Math.round(cy+Math.sin(t)*r),1,1);}}

let labels=[];
function render(){
  const cam=Math.round(G.camX),pos=G.camX+W/2,bb=Math.floor(Math.max(0,pos)/BIOME_LEN),f=Math.max(0,pos)-bb*BIOME_LEN;
  const bt=clamp((f-(BIOME_LEN-520))/520,0,1),BA=BIOMES[bb%4],BB=BIOMES[(bb+1)%4];
  const C=k=>mixHex(BA[k],BB[k],bt),Ci=(k,i)=>mixHex(BA[k][i],BB[k][i],bt),night=lerp(BA.night,BB.night,bt),shape=(bt<0.5?BA:BB).shape;
  labels=[];
  // sky bands
  const s0=Ci('sky',0),s1=Ci('sky',1),s2=Ci('sky',2);
  for(let y=0;y<H;y+=3){const v=y/H;L.fillStyle=v<0.55?mixHex(s0,s1,v/0.55):mixHex(s1,s2,(v-0.55)/0.45);L.fillRect(0,y,W,3);}
  if(night>0.01){for(let i=0;i<80;i++){L.globalAlpha=night*(0.45+0.55*Math.abs(Math.sin(G.t*1.5+i*1.7)));L.fillStyle=i%9===0?'#FFBFF8':'#ffffff';const sx=Math.floor((hash(i,1)*W*1.3-cam*0.02)%W+W)%W;L.fillRect(sx,Math.floor(hash(i,2)*H*0.55),i%7===0?2:1,i%7===0?2:1);}
    L.globalAlpha=night;disc(L,300,40,13,'#3a2db0');disc(L,300,40,10,'#f2ecff');disc(L,297,37,2,'#d6ccff');disc(L,304,43,1,'#d6ccff');}
  if(night<0.99){L.globalAlpha=(1-night)*0.35;disc(L,330,42,20,'#FFF6C9');L.globalAlpha=1-night;disc(L,330,42,14,'#FFE9A0');disc(L,330,42,12,'#FFF6C9');}
  L.globalAlpha=1;
  // clouds
  const cOff=cam*0.08+G.t*5,ccol=C('cloud'),csh=mixHex(ccol,s1,0.45);
  for(let i=Math.floor(cOff/140)-1;i<Math.floor(cOff/140)+4;i++){if(hash(i,3)>0.72)continue;L.globalAlpha=night>0.5?0.55:1;cloudAt(L,Math.round(i*140+hash(i,4)*70-cOff),Math.round(16+hash(i,5)*44),0.7+hash(i,6)*0.7,ccol,csh);}
  L.globalAlpha=1;
  // far ridge
  const far=C('far'),farHi=shade(far,0.18);
  for(let sx=0;sx<W;sx+=2){const v=ridge(sx+cam*0.15,shape),y=Math.round(62+(1-v)*58);L.fillStyle=far;L.fillRect(sx,y,2,H-y);L.fillStyle=farHi;L.fillRect(sx,y,2,1);
    if(shape==='peak'&&v>0.78){L.fillStyle='#ffffff';L.fillRect(sx,y,2,Math.round((v-0.78)*40));}}
  // haze strip
  L.globalAlpha=0.25;L.fillStyle=s2;L.fillRect(0,118,W,30);L.globalAlpha=1;
  // mid hills + silhouette trees
  const mid=C('mid'),mid2=C('mid2'),mOff=cam*0.35;
  for(let i=Math.floor(mOff/26)-1;i<Math.floor(mOff/26)+18;i++){if(hash(i,8)>0.55)continue;const tx=Math.round(i*26-mOff+hash(i,9)*10),v=ridge(i*26*1.7+400,'roll'),ty=Math.round(122+(1-v)*34);
    if(shape==='pine'||shape==='peak'){L.fillStyle=mid2;for(let k=0;k<14;k++)L.fillRect(tx-Math.floor(k/2),ty-16+k,Math.floor(k/2)*2+1,1);}
    else if(shape==='mesa'){L.fillStyle=mid2;L.fillRect(tx-2,ty-12,4,12);L.fillRect(tx-5,ty-7,2,5);L.fillRect(tx+3,ty-9,2,5);}
    else{disc(L,tx,ty-9,6+Math.floor(hash(i,10)*3),mid2);L.fillStyle=mid2;L.fillRect(tx-1,ty-4,2,6);}}
  for(let sx=0;sx<W;sx+=2){const v=ridge((sx+mOff)*1.7+400,'roll'),y=Math.round(124+(1-v)*34);L.fillStyle=mid;L.fillRect(sx,y,2,H-y);L.fillStyle=shade(mid,0.12);L.fillRect(sx,y,2,1);if(((sx>>1)+(y>>1))%3===0){L.fillStyle=mid2;L.fillRect(sx,y+3,1,1);}}
  // ambient particles behind terrain
  drawAmb(night);
  // void fog in pits
  for(let i=0;i<8;i++){L.fillStyle=mixHex(mid,'#0c0926',0.25+i*0.1);L.fillRect(0,H-32+i*4,W,4);}
  for(let i=0;i<18;i++){const gx=Math.floor((hash(i,40)*W*2-cam*0.9+G.t*8*(1+hash(i,41)))%W+W)%W,gy=H-4-Math.floor(hash(i,42)*22);L.fillStyle=i%3===0?'#37D7FA':i%3===1?'#FF8DF2':'#4B72FE';L.globalAlpha=0.5+0.5*Math.sin(G.t*3+i);L.fillRect(gx,gy,2,2);}L.globalAlpha=1;
  // big decor
  for(const d of G.decor){if(d.k!=='big')continue;const spr=DECOR[d.bi].big[d.i],top=topOf(d.c);if(top===Infinity)continue;const x=Math.round(d.x-cam-spr.width/2);if(x>W||x+spr.width<0)continue;
    if(d.bi===2&&night>0.3&&d.i<2){L.globalCompositeOperation='lighter';L.drawImage(SPR.glow,x+spr.width/2-24,top-spr.height-6);L.globalCompositeOperation='source-over';}
    L.drawImage(spr,x,top-spr.height+1);}
  // terrain
  const c0=Math.floor(cam/T)-1;
  for(let c=c0;c<c0+W/T+3;c++){const h=G.terrain[c];if(!h)continue;const bi=G.cb[c]??0,TS=TILES[bi],sx=c*T-cam,top=H-h*T,B=BIOMES[bi];
    for(let r=0;r<h;r++){const v=Math.floor(hash(c,r)*3),y=top+r*T;L.drawImage(r===0?TS.top[v]:r<3?TS.dirt[v]:TS.stone[v],sx,y);if(r>=2){L.globalAlpha=Math.min(0.4,(r-1)*0.13);L.fillStyle='#0c0926';L.fillRect(sx,y,T,T);L.globalAlpha=1;}}
    for(const side of[-1,1]){const nh=G.terrain[c+side]??h;if(nh<h){const ex=side<0?sx:sx+T-1,eh=(h-nh)*T;L.fillStyle=DOUT;L.fillRect(ex,top+2,1,eh-2);L.fillStyle=B.grass[1];L.fillRect(ex,top,1,4);L.fillStyle=B.grass[2];L.fillRect(ex,top+4,1,2);}}
    for(let i=0;i<16;i++){const hv=hash(c*16+i,7);if(hv<0.28){L.fillStyle=B.grass[1];L.fillRect(sx+i,top-1,1,1);if(hv<0.09){L.fillStyle=B.grass[0];L.fillRect(sx+i,top-2,1,1);}}}}
  // platforms
  for(const p of G.plats){const x=Math.round(p.x-cam);for(let i=0;i<p.w;i+=16)L.drawImage(SPR.plank,x+i,p.y);}
  // small decor + signs
  for(const d of G.decor){if(d.k==='big')continue;const top=topOf(d.c);if(top===Infinity)continue;const x=Math.round(d.x-cam);if(x>W+60||x<-80)continue;
    if(d.k==='sign'){ctx.font=`700 ${Math.round(4.6*S)}px "Pixelify Sans",monospace`;const tw=Math.ceil(ctx.measureText(d.label).width/S)+8;const bx=x-Math.floor(tw/2)+8,by=top-21;
      L.fillStyle=DOUT;L.fillRect(x+6,by+8,4,14);L.fillStyle='#8a5527';L.fillRect(x+7,by+9,2,13);L.fillStyle=DOUT;L.fillRect(bx,by,tw,10);L.fillStyle='#e8b070';L.fillRect(bx+1,by+1,tw-2,8);L.fillStyle='#c98a4b';L.fillRect(bx+1,by+7,tw-2,2);
      labels.push({x:bx+tw/2,y:by+5.3,text:d.label});continue;}
    const spr=DECOR[d.bi].small[d.i];L.drawImage(spr,x,top-spr.height+1);}
  // items
  const it=SPR.items;
  for(const o of G.items){const x=Math.round(o.x-cam);if(x>W||x<-20)continue;const bob=Math.round(Math.sin(G.t*3+o.ph)*2),y=Math.round(o.y)+bob;
    if(o.k==='cloud'||o.k==='agent'||o.k==='lite'){const col={cloud:'#96E7F9',agent:'#92AEFF',lite:'#FEEE05'}[o.k],cx=x+9,cy=y+9;L.globalAlpha=0.3;disc(L,cx,cy,10,col);L.globalAlpha=1;ring(L,cx,cy,10,'#ffffff');ring(L,cx,cy,11,OUT);
      const ic=it[o.k];L.drawImage(ic,cx-Math.floor(ic.width/2),cy-Math.floor(ic.height/2));}
    else{if(o.k==='note'||o.k==='heart'){L.globalAlpha=0.28+0.12*Math.sin(G.t*5);disc(L,x+5,y+6,9,o.k==='note'?'#FEEE05':'#ff5fb4');L.globalAlpha=1;}
      L.drawImage(it[o.k],x,y);if(Math.floor(G.t*5+o.ph*3)%9===0){L.fillStyle='#ffffff';L.fillRect(x+9,y-2,1,3);L.fillRect(x+8,y-1,3,1);}}}
  // obstacles
  for(const o of G.obs){if(o.hit)continue;const x=Math.round(o.x-cam);if(x>W||x<-40)continue;
    if(o.k==='noise'){const gt=topOf(Math.floor((o.x+15)/T));if(gt!==Infinity){L.globalAlpha=0.22;L.fillStyle='#0c0926';L.fillRect(x+4,gt-1,22,2);L.fillRect(x+7,gt-2,16,1);L.globalAlpha=1;}
      const bob=Math.round(Math.sin(G.t*2.5+o.ph)*1.5),jit=Math.floor(G.t*10+o.ph)%23===0?2:0,N=SPR.noise;L.drawImage(N.img,x-3+jit,o.y-3+bob);
      for(let k=0;k<16;k++){const idx=N.mask[Math.floor(hash(k,Math.floor(G.t*14)+Math.floor(o.ph*100))*N.mask.length)];L.fillStyle=k%3===0?'#ffffff':k%3===1?'#8f80ff':'#37D7FA';L.fillRect(x-3+jit+idx%36,o.y-3+bob+Math.floor(idx/36),1,1);}}
    else L.drawImage(o.img,x+o.ox,Math.round(o.y+o.h-o.img.height+1));}
  // player
  drawPlayer(cam);
  // particles
  for(const p of G.parts){L.globalAlpha=clamp(p.life/p.max*1.4,0,1);L.fillStyle=p.col;L.fillRect(Math.round(p.x-cam),Math.round(p.y),p.size,p.size);}L.globalAlpha=1;

  // blit + display-res text
  ctx.imageSmoothingEnabled=false;const ox=G.shake>0?Math.round((Math.random()-.5)*G.shake*14*S):0,oy=G.shake>0?Math.round((Math.random()-.5)*G.shake*10*S):0;
  ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(low,0,0,W,H,ox,oy,cv.width,cv.height);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`700 ${Math.round(4.6*S)}px "Pixelify Sans",monospace`;ctx.fillStyle='#5a3315';for(const l of labels)ctx.fillText(l.text,l.x*S+ox,l.y*S+oy);
  ctx.font=`700 ${Math.round(6.5*S)}px "Pixelify Sans",monospace`;ctx.lineWidth=Math.max(2,S*1.3);ctx.strokeStyle=OUT;ctx.lineJoin='round';
  for(const p of G.pops){ctx.globalAlpha=clamp(p.life*2,0,1);const px=(p.x-cam)*S+ox,py=p.y*S+oy;ctx.strokeText(p.text,px,py);ctx.fillStyle=p.col;ctx.fillText(p.text,px,py);}ctx.globalAlpha=1;
}
function drawPlayer(cam){
  const p=P,F=SPR.llama;if(p.inv>0&&Math.floor(G.t*18)%2===0&&G.state==='play')return;
  const feet=Math.round(p.y+p.h),x=Math.round(p.x-cam)-8;
  if(p.onGround&&!p.dead){const gl=topOf(Math.floor((p.x+7)/T));L.globalAlpha=0.22;L.fillStyle='#0c0926';L.fillRect(x+4,feet-1,22,2);L.globalAlpha=1;}
  if(G.power.agent>0){L.globalAlpha=0.25+0.15*Math.sin(G.t*8);ring(L,x+15,feet-16,24+Math.round(Math.sin(G.t*4)*2),'#92AEFF');L.globalAlpha=1;}
  if(G.power.lite>0&&Math.random()<0.5)part(p.x+Math.random()*4,p.y+4+Math.random()*(p.h-6),-30,0,0.35,Math.random()<.5?'#FEEE05':'#FFBD74',1,0);
  if(G.power.cloud>0&&!p.onGround&&Math.random()<0.3)part(p.x+7,feet,-20,10,0.4,'#ffffff',2,0);
  let spr,yy;
  if(p.crouch&&!p.dead){spr=F.crouch[(Math.floor(p.anim/2)%2+2)%2];yy=feet-19;}
  else if(p.dead||!p.onGround){spr=p.vy<0?F.jump:F.fall;yy=feet-35;}
  else{const k=(Math.floor(p.anim)%6+6)%6;spr=F.run[k];yy=feet-35-(k===1||k===4?1:0);}
  L.drawImage(spr,x,yy);
  if(G.t%3.4<0.13&&!p.dead){const ex=p.crouch?27:24;L.fillStyle=gradAt(24,6,LW,LH);L.fillRect(x+ex,yy+6,2,2);L.fillStyle=OUT;L.fillRect(x+ex,yy+8,2,1);}
}
function drawAmb(night){
  const spd=G.state==='play'||G.state==='title'?speedAt(P.x):0,bi=biomeIdx(G.camX+W/2),B=BIOMES[bi];
  if(G.amb.length<40&&Math.random()<0.25)G.amb.push({x:W+5,y:Math.random()*H*0.7,vx:-10-Math.random()*20,vy:bi===0?8+Math.random()*10:(Math.random()-.5)*6,ph:Math.random()*6,col:Math.random()<0.06?'paper':B.part,bi,life:12});
  for(const a of G.amb){a.life-=1/60;a.x+=(a.vx-spd*0.25)/60;a.y+=(a.vy+Math.sin(G.t*2+a.ph)*6)/60;
    if(a.col==='paper'){L.fillStyle=OUT;L.fillRect(Math.round(a.x)-1,Math.round(a.y)-1,5,6);L.fillStyle='#ffffff';L.fillRect(Math.round(a.x),Math.round(a.y),3,4);L.fillStyle='#92AEFF';L.fillRect(Math.round(a.x),Math.round(a.y)+1,3,1);continue;}
    L.globalAlpha=a.bi===2?0.4+0.6*Math.abs(Math.sin(G.t*3+a.ph)):0.85;L.fillStyle=a.col;L.fillRect(Math.round(a.x),Math.round(a.y),a.bi===2?2:1,a.bi===2?2:1);
    if(a.bi===0){L.fillRect(Math.round(a.x)+1,Math.round(a.y)+1,1,1);}}
  L.globalAlpha=1;G.amb=G.amb.filter(a=>a.x>-10&&a.life>0&&a.y<H);
}

// ===== HUD =====
const URL_={};let hudKey='',powKey='';
function hud(){
  if(G.state!=='play'&&G.state!=='pause')return;
  const hk=G.hearts+'/'+G.maxHearts;if(hk!==hudKey){hudKey=hk;let s='';for(let i=0;i<G.maxHearts;i++)s+=`<img class="px" src="${i<G.hearts?URL_.heart:URL_.heartE}" alt="">`;$('hearts').innerHTML=s;}
  $('pages').textContent=G.pages;const m=Math.max(0,Math.floor((P.x-G.startX)/10));$('dist').textContent=m<1000?m+' m':(m/1000).toFixed(2)+' km';$('score').textContent=(G.score|0).toLocaleString();
  const act=['cloud','agent','lite'].filter(k=>G.power[k]>0),pk=act.join(',');
  if(pk!==powKey){powKey=pk;const nm={cloud:'LlamaCloud',agent:'Agent',lite:'LiteParse'},cl={cloud:'#96E7F9',agent:'#92AEFF',lite:'#FEEE05'};
    $('powers').innerHTML=act.map(k=>`<div class="chip ol"><img class="px" src="${URL_[k]}" alt="">${nm[k]}<span class="bar"><i id="pb-${k}" style="background:${cl[k]}"></i></span></div>`).join('');}
  for(const k of act){const el=$('pb-'+k);if(el)el.style.width=(G.power[k]/12*100)+'%';}
}
function showReport(){
  if(G.state!=='over')return;
  const m=Math.floor((P.x-G.startX)/10),nb=(G.score|0)>=best&&G.score>0;
  const rows=[['status',nb?'"new_best"':'"parse_interrupted"'],['stopped_by','"'+G.cause+'"'],['biome','"'+BIOMES[biomeIdx(P.x)].name+'"'],['distance_m',m],['pages_parsed',G.pages],['tables',G.tables],['charts',G.charts],['handwritten',G.notes],['score',G.score|0],['best',best]];
  $('report').innerHTML='<span class="p">{</span>\n'+rows.map((r,i)=>`  <span class="k">"${r[0]}"</span><span class="p">:</span> <span class="${typeof r[1]==='number'?'n':'s'}">${r[1]}</span>${i<rows.length-1?'<span class="p">,</span>':''}`).join('\n')+'\n<span class="p">}</span>';
  $('over').hidden=false;$('hud').hidden=true;$('btn-retry').focus();
}

// ===== Flow & input =====
function startGame(){
  if(G.state==='play')return;
  audioInit();newRun(false);G.state='play';hudKey='';powKey='';
  $('title').hidden=true;$('howto').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;
  if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume();musicStart(true);sfx('start');setTimeout(()=>{if(G.state==='play')banner(0);},350);
}
function toTitle(){G.state='title';newRun(true);$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('title').hidden=false;$('best').textContent=best.toLocaleString();musicStop();$('btn-start').focus();}
function togglePause(force){
  if(G.state==='play'&&force!==false){G.state='pause';$('pause').hidden=false;sfx('pause');setTimeout(()=>{if(G.state==='pause'&&AU.ctx)AU.ctx.suspend();},150);$('btn-resume').focus();}
  else if(G.state==='pause'&&force!==true){G.state='play';$('pause').hidden=true;if(AU.ctx)AU.ctx.resume().then(()=>{AU.nextT=AU.ctx.currentTime+0.05;});}
}
function setToggle(id,on){$(id).setAttribute('aria-pressed',on?'true':'false');}
function toggleMusic(){AU.music=!AU.music;if(AU.mus)AU.mus.gain.value=AU.music?0.3:0;setToggle('tg-music',AU.music);saveAudio();}
function toggleSfx(){AU.sfx=!AU.sfx;if(AU.fx)AU.fx.gain.value=AU.sfx?0.5:0;setToggle('tg-sfx',AU.sfx);saveAudio();}
function pressJump(){if(G.state==='title'){if(!$('howto').hidden)$('howto').hidden=true;startGame();return;}if(G.state==='over'){if(!$('over').hidden)startGame();return;}if(G.state==='play')P.buffer=0.12;IN.jump=true;}
const JK=['Space','ArrowUp','KeyW'],CK=['ArrowDown','KeyS'];
addEventListener('keydown',e=>{
  if(JK.includes(e.code)){e.preventDefault();if(!e.repeat)pressJump();else IN.jump=true;}
  else if(CK.includes(e.code)){e.preventDefault();IN.crouch=true;}
  else if(e.code==='KeyP'||e.code==='Escape'){e.preventDefault();togglePause();}
  else if(e.code==='KeyM')toggleMusic();
  else if(e.code==='Enter'&&(G.state==='title'||(G.state==='over'&&!$('over').hidden))){e.preventDefault();startGame();}
});
addEventListener('keyup',e=>{if(JK.includes(e.code))IN.jump=false;if(CK.includes(e.code))IN.crouch=false;});
addEventListener('blur',()=>{IN.jump=false;IN.crouch=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
function hold(el,down,up){el.addEventListener('pointerdown',e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);down();});['pointerup','pointercancel','lostpointercapture'].forEach(n=>el.addEventListener(n,up));}
hold($('t-jump'),pressJump,()=>IN.jump=false);
hold($('t-crouch'),()=>{IN.crouch=true;},()=>IN.crouch=false);
hold(cv,pressJump,()=>IN.jump=false);
$('btn-start').addEventListener('click',e=>{e.currentTarget.blur();startGame();});
$('btn-retry').addEventListener('click',e=>{e.currentTarget.blur();startGame();});
$('btn-menu').addEventListener('click',()=>{sfx('click');toTitle();});
$('btn-how').addEventListener('click',()=>{audioInit();sfx('click');$('howto').hidden=false;$('btn-how-close').focus();});
$('btn-how-close').addEventListener('click',()=>{sfx('click');$('howto').hidden=true;$('btn-start').focus();});
$('btn-resume').addEventListener('click',e=>{e.currentTarget.blur();togglePause(false);});
$('tg-music').addEventListener('click',e=>{audioInit();toggleMusic();e.currentTarget.blur();});
$('tg-sfx').addEventListener('click',e=>{audioInit();toggleSfx();e.currentTarget.blur();});
$('tg-pause').addEventListener('click',e=>{togglePause();e.currentTarget.blur();});

// ===== Boot =====
initSprites();
for(const k of ['heart','heartE','page','table','chart','note','cloud','agent','lite'])URL_[k]=SPR.items[k].toDataURL();
URL_.noise=SPR.noise.img.toDataURL();URL_.stack=SPR.stacks[2].toDataURL();
$('ico-page').src=URL_.page;
$('legend').innerHTML=[['page','Page +10'],['table','Table +25'],['chart','Chart +25'],['note','Handwritten +100'],['heart','Life Crystal'],['cloud','LlamaCloud · double jump'],['agent','Agent · auto-collect'],['lite','LiteParse · 2x'],['stack','Messy Scan · jump it'],['noise','OCR Noise · crouch']]
  .map(([k,t])=>`<span class="ol"><img class="px" src="${URL_[k]}" alt="">${t}</span>`).join('');
$('best').textContent=best.toLocaleString();setToggle('tg-music',AU.music);setToggle('tg-sfx',AU.sfx);
resize();newRun(true);
let last=performance.now();
function frame(now){const dt=clamp((now-last)/1000,0,0.05);last=now;if(G.state!=='pause')update(dt);render();hud();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resize);
