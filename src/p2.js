// ===== Core constants & utils =====
const W=400,H=225,T=16;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
function hash(a,b=0){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255];}
function toHex(r,g,b){return '#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('');}
function mixHex(a,b,t){const A=hx(a),B=hx(b);return toHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t);}
function shade(c,amt){return amt>0?mixHex(c,'#ffffff',amt):mixHex(c,'#2a1a6a',-amt);}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function paintMap(x,rows,fn,ox=0,oy=0){rows.forEach((r,y)=>{for(let i=0;i<r.length;i++){const col=fn(r[i],i,y);if(col){x.fillStyle=col;x.fillRect(ox+i,oy+y,1,1);}}});}
function fromMap(rows,pal){const w=Math.max(...rows.map(r=>r.length));const c=mk(w,rows.length);paintMap(c.getContext('2d'),rows,ch=>pal[ch]);return c;}
function disc(x,cx,cy,r,col){x.fillStyle=col;for(let yy=-r;yy<=r;yy++){const w=Math.floor(Math.sqrt(Math.max(0,r*r-yy*yy))+0.35);x.fillRect(cx-w,cy+yy,w*2+1,1);}}
const OUT='#241a4a';

// ===== Biomes (LlamaIndex brand palette) =====
const BIOMES=[
 {name:'Parse Plains',sub:'where raw PDFs graze',sky:['#7f9bff','#96E7F9','#eafcff'],far:'#b8c6ff',mid:'#8fd6e8',mid2:'#74c2d8',
  grass:['#c4fbea','#5fe0c2','#2e9e95'],dirt:['#b8a0f2','#8a6dd4','#5b45a4'],stone:['#615fae','#423f86'],ore:['#FF8DF2','#37D7FA'],night:0,cloud:'#ffffff',shape:'roll',part:'#FFBFF8'},
 {name:'Extract Canyon',sub:'schemas carved in sandstone',sky:['#b48cff','#FF8DF2','#FFBD74'],far:'#ffb3a1',mid:'#ec8658',mid2:'#d46f43',
  grass:['#fff3cf','#FFBD74','#d9822e'],dirt:['#ffa65f','#e2742a','#a04a16'],stone:['#8e3f22','#622816'],ore:['#FEEE05','#37D7FA'],night:0,cloud:'#fff1f8',shape:'mesa',part:'#FFBD74'},
 {name:'Index Grove',sub:'embeddings glow after dark',sky:['#0e0838','#2a1aa8','#6d52ff'],far:'#3b2cb4',mid:'#22197e',mid2:'#1a1366',
  grass:['#ffd2fa','#FF8DF2','#b04fb2'],dirt:['#5645ae','#3b2d88','#261a60'],stone:['#221d58','#15113c'],ore:['#37D7FA','#FEEE05'],night:1,cloud:'#5a4bc4',shape:'pine',part:'#37D7FA'},
 {name:'Workflow Highlands',sub:'every step is an event',sky:['#4B72FE','#92AEFF','#FAF5A8'],far:'#b1bfff',mid:'#93b3ea',mid2:'#7c9de0',
  grass:['#fffbc2','#efdc3c','#b19f17'],dirt:['#e3b07c','#bb834c','#7f532b'],stone:['#6f6b94','#4c486c'],ore:['#FF8DF2','#4B72FE'],night:0,cloud:'#ffffff',shape:'peak',part:'#FEEE05'},
];
const BIOME_LEN=4500;
const SIGNS=['PDF → MD','10-K FILINGS','INVOICES AHEAD','OCR ZONE','CHUNK 512','TOP-K = 5','EMBED HERE','RAG CROSSING','AGENT REST STOP','LLAMAHUB','SCHEMA PASS','TABLES AHEAD','HANDWRITING!','90+ FILE TYPES','NO VLM TOKENS','EXTRACT v2.5'];

// ===== Llama sprite (fluffy cartoon llama, brand gradient pink → lavender → cyan) =====
const LL_STAND=[
"...................o...o......",
"..................opo.opo.....",
"..................opo.opo.....",
"..................obwoobwbo...",
".................owbwbwbwbbo..",
".................obbbbbbbbbbo.",
".................obbbbbbiebbbo",
".................obbbbbbeebbbo",
".................obbbbbbeebbno",
".................obbbbbkkbbbbo",
"..................obbbbbbbmmo.",
"..................obbbbbbbbo..",
"...................obbbbbbo...",
"..................sssssssssS..",
"..................SsssssssSS..",
"...................obbbbbbbo..",
"...................obbbbbbbbo.",
"...................obwbbbbbo..",
"..oo...............obbbbbbbbo.",
".owwo..............obwbbbbbo..",
"owbbwo...........oobbbbbbbbbo.",
"obbbboooooooooooobbbbbbbbbbo..",
".obwbbbbwbbbbwbbbbbbbbbbbbo...",
"..obbbbbbbbbbbbbbbbbbbbbbbbo..",
"..obbbbbbbbbbbbbbbbbbbbbbbo...",
"..obbbbbbbbbbbbbbbbbbbbbbbbo..",
"..obbbbbbbbbbbbbbbbbbbbbbbo...",
"...obbbbbbbbbbbbbbbbbbbbbbo...",
"...obbbbbbbbbbbbbbbbbbbbbbo...",
"....oboobobooooooboobooobo...."];
const LW=30,LH=35;
const RAMP=['#FFC6F6','#FFA3EF','#F2A9F9','#CBB3FF','#A2C6FF','#77D9FB','#52CFF6'];
function gradAt(x,y,w,h){const u=x/w,v=y/h;if(v<0.2)return '#FDF7FF';if(v<0.37)return '#F7E6FF';const g=clamp(0.04+u*0.9+(v-0.55)*0.9,0,0.999);return RAMP[Math.floor(g*RAMP.length)];}
function llamaFn(rows){return (ch,x,y)=>{
  switch(ch){case 'o':case 'e':return OUT;case 'i':return '#ffffff';case 'p':return '#FF8DF2';case 'k':return '#FF9FE6';case 'n':return '#6b4fb0';case 'm':return '#9a6ad0';
  case 's':return '#FF8705';case 'S':return '#c95f00';
  case 'w':return mixHex(gradAt(x,y,LW,LH),'#ffffff',0.65);
  case 'b':{const col=gradAt(x,y,LW,LH);const below=(rows[y+1]||'')[x],above=(rows[y-1]||'')[x],right=rows[y][x+1];
    if(below==='o'||below==='.'||below===undefined)return shade(col,-0.17);if(above==='o')return shade(col,0.32);if(right==='o')return shade(col,-0.08);return col;}}
  return null;};}
function drawLeg(x,bx,off,far,top=29){
  for(let r=0;r<6;r++){const sx=bx+Math.round(off*r/5),yy=top+r;x.fillStyle=OUT;x.fillRect(sx,yy,4,1);
    if(r<5){let c=r===4?'#4b3b8f':gradAt(bx+1,yy,LW,LH);if(r===0&&!far)c=shade(c,0.2);if(far)c=shade(c,-0.28);x.fillStyle=c;x.fillRect(sx+1,yy,2,1);}}
}
function scarfTail(x,ph,ox,oy){const w1=Math.round(Math.sin(ph)),w2=Math.round(Math.sin(ph+1.3));
  x.fillStyle='#FF8705';x.fillRect(ox+17,oy+13,1,2);x.fillRect(ox+16,oy+14+w1,1,1);x.fillRect(ox+15,oy+14+w2,1,1);x.fillStyle='#c95f00';x.fillRect(ox+14,oy+15+w2,1,1);}
function paintPart(x,rows,r0,r1,dx,dy,fn){for(let y=r0;y<=r1;y++){const r=rows[y];for(let i=0;i<r.length;i++){const c=fn(r[i],i,y);if(c){x.fillStyle=c;x.fillRect(i+dx,y+dy,1,1);}}}}
function buildLlama(){
  const fn=llamaFn(LL_STAND);const F={run:[],jump:null,fall:null,crouch:[]};
  const frame=(o,ph,blink)=>{const c=mk(LW,LH),x=c.getContext('2d');drawLeg(x,4,o[0],true);drawLeg(x,18,o[2],true);paintMap(x,LL_STAND,fn);drawLeg(x,7,o[1],false);drawLeg(x,21,o[3],false);scarfTail(x,ph,0,0);
    if(blink){x.fillStyle=gradAt(24,6,LW,LH);x.fillRect(24,6,2,2);x.fillStyle=OUT;x.fillRect(24,8,2,1);}return c;};
  for(let k=0;k<6;k++){const p=k/6*Math.PI*2,a=3*Math.sin(p),b=3*Math.sin(p+Math.PI);F.run.push(frame([b,a,a,b],p,false));}
  F.blink=frame([0,0,0,0],0,true);F.jump=frame([-3,-2,3,2],1);F.fall=frame([-1,1,1,-1],2.5);
  for(let k=0;k<2;k++){const c=mk(33,19),x=c.getContext('2d');
    paintPart(x,LL_STAND,18,29,0,-12,fn);
    [[4,0],[8,0],[17,0],[21,0]].forEach(([lx])=>{x.fillStyle=OUT;x.fillRect(lx,17,4,2);x.fillStyle='#4b3b8f';x.fillRect(lx+1,17,2,1);});
    paintPart(x,LL_STAND,13,14,1,-1,fn);
    paintPart(x,LL_STAND,0,12,3,0,fn);
    x.fillStyle='#FF8705';x.fillRect(17,13+k,1,1);x.fillStyle='#c95f00';x.fillRect(16,14-k,1,1);
    F.crouch.push(c);}
  return F;
}

// ===== Item / HUD sprites =====
const PAGE_ROWS=["oooooooo...","owwwwwwoo..","owllllwoko.","owwwwwwoooo","owlllllllwo","owwwwwwwwwo","owllllllwwo","owwwwwwwwwo","owlllllllwo","owwwwwwwwwo","owllllwwwwo","owwwwwwwwwo","ooooooooooo"];
const TABLE_ROWS=["oooooooo...","owwwwwwoo..","owttttwoko.","owwwwwwoooo","owhhhhhhhwo","owwgwwgwwwo","owgggggggwo","owwgwwgwwwo","owgggggggwo","owwgwwgwwwo","owgggggggwo","owwwwwwwwwo","ooooooooooo"];
const CHART_ROWS=["oooooooo...","owwwwwwoo..","owttttwoko.","owwwwwwoooo","owwwwwwwwwo","owwwwwwpwwo","owwwwywpwwo","owwcwywpwwo","owwcwywpwbo","owwcwywpwbo","owdddddddwo","owwwwwwwwwo","ooooooooooo"];
const NOTE_ROWS=["oooooooo...","owwwwwwoo..","owlwwlwoko.","owwllwwoooo","owwwwwlwlwo","owlwlwwlwwo","owwlwwwwwwo","owwwwlwlwwo","owlwwwlwwwo","owwlwlwwwwo","owwwwwwlwwo","owwwwwwwwwo","ooooooooooo"];
const HEART_ROWS=[".ooo...ooo.","ohhwo.ohhho","ohwhhohhhho","ohhhhhhhhho","ohhhhhhhhdo",".ohhhhhhdo.","..ohhhhdo..","...ohhdo...","....odo....",".....o....."];
const CLOUD_ROWS=["....oooo....","..oowwwwoo..",".owwwwwwwwo.","owwwwwwwwwco","owwwwwwwwcco",".occcccccco.","..oooooooo.."];
const AGENT_ROWS=[".....o.....",".....y.....","..ooooooo..",".obbbbbbbo.",".obeebeebo.",".obbbbbbbo.",".obbmmmbbo.","..ooooooo..","...o...o..."];
const LITE_ROWS=["......oooo",".....oyyo.","....oyyo..","...oyyoooo","..oyyyyyyo",".ooooyyyo.","....oyyo..","...oyyo...","..oyo.....","..oo......"];
function buildItems(){
  const base={o:OUT,w:'#ffffff',l:'#92AEFF',k:'#cfd6ff',t:'#4B72FE',h:'#4B72FE',g:'#92AEFF',p:'#FF8DF2',y:'#FF8705',c:'#37D7FA',b:'#4B72FE',d:'#5b4fa0'};
  return {
    page:fromMap(PAGE_ROWS,base),
    table:fromMap(TABLE_ROWS,{...base,h:'#FF8DF2',t:'#FF8DF2'}),
    chart:fromMap(CHART_ROWS,base),
    note:fromMap(NOTE_ROWS,{o:'#8a4a00',w:'#FFF7B8',l:'#FF8705',k:'#ffe27a'}),
    heart:fromMap(HEART_ROWS,{o:'#5a0f3c',h:'#ff5fb4',w:'#ffd1ec',d:'#c42a7c'}),
    heartE:fromMap(HEART_ROWS,{o:'#1a1238',h:'#3b2a6c',w:'#4d3b85',d:'#2e2058'}),
    cloud:fromMap(CLOUD_ROWS,{o:OUT,w:'#ffffff',c:'#96E7F9'}),
    agent:fromMap(AGENT_ROWS,{o:OUT,y:'#FF8DF2',b:'#92AEFF',e:'#37D7FA',m:'#4B72FE'}),
    lite:fromMap(LITE_ROWS,{o:OUT,y:'#FEEE05'}),
  };
}

// ===== Obstacles / platforms =====
function makeStack(seed,layers){
  const r=mulberry32(seed),hh=layers*5+3,c=mk(20,hh),x=c.getContext('2d');
  for(let i=0;i<layers;i++){const y=hh-(i+1)*5-1,ox=Math.floor(r()*3),w=15+Math.floor(r()*2);
    x.fillStyle=OUT;x.fillRect(ox,y,w+2,6);x.fillStyle=i%2?'#e7e1fb':'#f8f6ff';x.fillRect(ox+1,y+1,w,4);x.fillStyle='#bfb5e4';x.fillRect(ox+1,y+4,w,1);
    for(let k=0;k<3;k++){x.fillStyle=['#8f86b8','#FF8705','#4B72FE','#FF8DF2'][Math.floor(r()*4)];x.fillRect(ox+2+Math.floor(r()*(w-5)),y+2,1+Math.floor(r()*3),1);}
    if(r()<0.5){x.fillStyle='#b98a62';x.fillRect(ox+3+Math.floor(r()*8),y+1,2,2);}}
  // crumpled ball on top
  x.fillStyle=OUT;x.fillRect(11,0,6,4);x.fillStyle='#f1edff';x.fillRect(12,1,4,2);x.fillStyle='#c7bdea';x.fillRect(13,2,2,1);
  return c;
}
function makeCrate(){
  const c=mk(16,16),x=c.getContext('2d');x.fillStyle=OUT;x.fillRect(0,0,16,16);x.fillStyle='#c98a4b';x.fillRect(1,1,14,14);
  x.fillStyle='#e8b070';x.fillRect(1,1,14,2);x.fillRect(1,8,14,1);x.fillStyle='#8a5527';x.fillRect(1,13,14,2);x.fillRect(1,7,14,1);
  for(let i=0;i<14;i++){x.fillStyle='#8a5527';x.fillRect(1+i,1+Math.round(i*12/13),1,1);}
  x.fillStyle=OUT;x.fillRect(4,9,8,5);x.fillStyle='#ffffff';x.fillRect(5,10,6,3);x.fillStyle='#FF8705';x.fillRect(6,11,4,1);
  return c;
}
function makeNoise(){
  const c=mk(36,20),x=c.getContext('2d');const blobs=[[10,11,7],[19,8,8],[27,11,7],[18,13,7]];
  blobs.forEach(b=>disc(x,b[0],b[1],b[2]+1,'#0d0826'));blobs.forEach(b=>disc(x,b[0],b[1],b[2],'#3a2c78'));blobs.forEach(b=>disc(x,b[0]-1,b[1]-2,b[2]-3,'#4d3d98'));
  const d=x.getImageData(0,0,36,20).data,mask=[];for(let i=0;i<36*20;i++)if(d[i*4+3]>0&&d[i*4]>20)mask.push(i);
  return {img:c,mask};
}
function makePlank(){const c=mk(16,7),x=c.getContext('2d');x.fillStyle=OUT;x.fillRect(0,0,16,5);x.fillStyle='#d9954f';x.fillRect(0,1,16,3);x.fillStyle='#f2bd7a';x.fillRect(0,1,16,1);x.fillStyle='#8a5527';x.fillRect(0,3,16,1);x.fillRect(7,1,1,2);
  x.fillStyle=OUT;x.fillRect(2,5,3,2);x.fillRect(11,5,3,2);x.fillStyle='#8a5527';x.fillRect(3,5,1,1);x.fillRect(12,5,1,1);return c;}

// ===== Tiles =====
function speck(x,[li,mi,dk],r,n=7){x.fillStyle=mi;x.fillRect(0,0,16,16);for(let k=0;k<n;k++){const px=Math.floor(r()*15),py=Math.floor(r()*15);x.fillStyle=r()<0.55?dk:li;x.fillRect(px,py,2,2);if(r()<0.5)x.fillRect(px+2,py+1,1,1);}
  for(let k=0;k<6;k++){x.fillStyle=dk;x.fillRect(Math.floor(r()*16),Math.floor(r()*16),1,1);}}
function buildTiles(B,bi){
  const R={top:[],dirt:[],stone:[]};
  for(let v=0;v<3;v++){const r=mulberry32(bi*101+v*7+3);
    const dirt=mk(16,16);speck(dirt.getContext('2d'),B.dirt,r);R.dirt.push(dirt);
    const st=mk(16,16),s=st.getContext('2d');speck(s,[shade(B.stone[0],0.12),B.stone[0],B.stone[1]],r,9);
    if(v===0){const gx=2+Math.floor(r()*11),gy=2+Math.floor(r()*11),oc=B.ore[Math.floor(r()*2)];s.fillStyle=shade(oc,-0.35);s.fillRect(gx-1,gy-1,4,4);s.fillStyle=oc;s.fillRect(gx,gy,2,2);s.fillStyle='#ffffff';s.fillRect(gx,gy,1,1);}
    R.stone.push(st);
    const top=mk(16,16),t=top.getContext('2d');t.drawImage(dirt,0,0);
    for(let i=0;i<16;i++){const dp=3+Math.floor(r()*3);t.fillStyle=B.grass[1];t.fillRect(i,0,1,dp);t.fillStyle=B.grass[2];t.fillRect(i,dp,1,1);if(r()<0.35)t.fillRect(i,dp+1,1,1);
      t.fillStyle=B.grass[0];t.fillRect(i,0,1,1);if(r()<0.35)t.fillRect(i,1,1,1);}
    R.top.push(top);}
  return R;
}

// ===== Decorations =====
const DOUT='#2a1d4f';
function tree(can,trunk,seed,opt={}){
  const r=mulberry32(seed),c=mk(48,64),x=c.getContext('2d');const tx=21;
  x.fillStyle=DOUT;x.fillRect(tx-1,30,8,34);x.fillRect(tx-3,60,12,4);x.fillStyle=trunk[0];x.fillRect(tx,30,6,34);x.fillRect(tx-2,61,10,3);x.fillStyle=trunk[1];x.fillRect(tx+4,30,2,34);x.fillRect(tx+1,40,1,4);
  const bl=[[24,22,12],[13,28,8],[35,28,8],[24,11,9],[17,17,7],[31,17,7]].map(b=>[b[0]+Math.round((r()-.5)*3),b[1]+Math.round((r()-.5)*3),b[2]]);
  bl.forEach(b=>disc(x,b[0],b[1],b[2]+1,DOUT));bl.forEach(b=>disc(x,b[0],b[1],b[2],can[2]));bl.forEach(b=>disc(x,b[0]-1,b[1]-1,b[2]-2,can[1]));bl.forEach(b=>disc(x,b[0]-3,b[1]-3,Math.max(1,b[2]-6),can[0]));
  if(opt.fruit)for(let k=0;k<9;k++){const b=bl[Math.floor(r()*bl.length)];const fx=b[0]+Math.round((r()-.5)*b[2]),fy=b[1]+Math.round((r()-.5)*b[2]);x.fillStyle=opt.fruit;x.fillRect(fx,fy,2,2);x.fillStyle='#fff';x.fillRect(fx,fy,1,1);}
  return c;
}
function bush(can,seed){const c=mk(20,12),x=c.getContext('2d');const bl=[[6,7,5],[13,6,6]];bl.forEach(b=>disc(x,b[0],b[1],b[2]+1,DOUT));bl.forEach(b=>disc(x,b[0],b[1],b[2],can[2]));bl.forEach(b=>disc(x,b[0]-1,b[1]-1,b[2]-2,can[1]));bl.forEach(b=>disc(x,b[0]-2,b[1]-2,Math.max(1,b[2]-4),can[0]));x.clearRect(0,11,20,1);return c;}
function flower(petal,stem){const c=mk(5,7),x=c.getContext('2d');x.fillStyle=stem;x.fillRect(2,3,1,4);x.fillRect(3,5,1,1);x.fillStyle=petal;x.fillRect(1,1,3,1);x.fillRect(2,0,1,3);x.fillStyle='#FEEE05';x.fillRect(2,1,1,1);return c;}
function tuft(col){const c=mk(7,5),x=c.getContext('2d');x.fillStyle=col;[[0,3],[1,1],[2,2],[3,0],[4,2],[5,1],[6,3]].forEach(p=>x.fillRect(p[0],p[1],1,5-p[1]));return c;}
function rock(cols){const c=mk(12,7),x=c.getContext('2d');disc(x,6,6,6,DOUT);disc(x,6,6,5,cols[1]);disc(x,5,5,3,cols[0]);x.clearRect(0,7,12,1);return c;}
function cactus(){const c=mk(18,30),x=c.getContext('2d');const g=['#8af0d6','#3fc9a8','#23917a'];
  const part=(px,py,w,h)=>{x.fillStyle=DOUT;x.fillRect(px-1,py-1,w+2,h+2);x.fillStyle=g[1];x.fillRect(px,py,w,h);x.fillStyle=g[0];x.fillRect(px+1,py,1,h);x.fillStyle=g[2];x.fillRect(px+w-1,py,1,h);};
  part(7,6,5,24);part(2,12,3,7);part(2,18,6,3);part(13,9,3,8);part(10,16,6,3);
  for(let i=0;i<6;i++){x.fillStyle='#ffffff';x.fillRect(8+(i%2)*2,9+i*3,1,1);}
  x.fillStyle=DOUT;x.fillRect(7,2,5,4);x.fillStyle='#FF8DF2';x.fillRect(8,3,3,2);x.fillStyle='#FEEE05';x.fillRect(9,3,1,1);return c;}
function spire(){const c=mk(20,44),x=c.getContext('2d');x.fillStyle=DOUT;x.fillRect(4,4,12,40);x.fillRect(6,0,8,6);const cs=['#ffbd74','#f29a52','#d9772f','#ffcf96'];
  for(let y=1;y<44;y++){x.fillStyle=cs[Math.floor(y/5)%3];x.fillRect(y<5?7:5,y,y<5?6:10,1);}x.fillStyle='#ffe2bd';x.fillRect(6,6,1,36);x.fillStyle='#a8521d';x.fillRect(14,6,1,38);return c;}
function mushroom(cap,seed){const r=mulberry32(seed),c=mk(28,34),x=c.getContext('2d');
  x.fillStyle=DOUT;x.fillRect(10,12,8,22);x.fillStyle='#f3e8ff';x.fillRect(11,12,6,22);x.fillStyle='#c9b8ee';x.fillRect(15,12,2,22);
  for(let yy=0;yy<13;yy++){const w=Math.round(13*Math.sqrt(1-Math.pow((12-yy)/12.5,2)));x.fillStyle=DOUT;x.fillRect(14-w-1,yy,w*2+2,1);}
  for(let yy=1;yy<12;yy++){const w=Math.round(12*Math.sqrt(1-Math.pow((12-yy)/12.5,2)));x.fillStyle=yy<5?cap[0]:yy<9?cap[1]:cap[2];x.fillRect(14-w,yy,w*2,1);}
  for(let k=0;k<5;k++){x.fillStyle='#ffffff';x.fillRect(5+Math.floor(r()*17),3+Math.floor(r()*6),2,1);}return c;}
function sunflower(){const c=mk(11,26),x=c.getContext('2d');x.fillStyle='#3d8a2a';x.fillRect(5,9,1,17);x.fillStyle='#6fbf3a';x.fillRect(6,15,3,2);x.fillRect(2,19,3,2);
  disc(x,5,5,5,DOUT);disc(x,5,5,4,'#FEEE05');x.fillStyle='#ffc21a';x.fillRect(2,7,7,1);disc(x,5,5,2,'#8a4a1a');x.fillStyle='#b8682a';x.fillRect(4,4,1,1);return c;}
function fence(){const c=mk(16,12),x=c.getContext('2d');x.fillStyle=DOUT;x.fillRect(1,0,4,12);x.fillRect(11,0,4,12);x.fillRect(0,3,16,3);x.fillRect(0,8,16,3);
  x.fillStyle='#e8b070';x.fillRect(2,1,2,11);x.fillRect(12,1,2,11);x.fillStyle='#c98a4b';x.fillRect(0,4,16,1);x.fillRect(0,9,16,1);return c;}
function hay(){const c=mk(16,11),x=c.getContext('2d');x.fillStyle=DOUT;x.fillRect(0,0,16,11);x.fillStyle='#f5d65a';x.fillRect(1,1,14,10);x.fillStyle='#fff09a';x.fillRect(1,1,14,2);x.fillStyle='#c9a426';x.fillRect(5,1,1,10);x.fillRect(10,1,1,10);return c;}
function crystal(){const c=mk(7,11),x=c.getContext('2d');x.fillStyle=DOUT;x.fillRect(2,0,3,11);x.fillRect(1,3,5,8);x.fillStyle='#37D7FA';x.fillRect(2,1,2,10);x.fillRect(4,4,1,6);x.fillStyle='#c8f6ff';x.fillRect(2,2,1,6);return c;}
function sign(){const c=mk(22,20),x=c.getContext('2d');x.fillStyle=DOUT;x.fillRect(9,8,4,12);x.fillRect(0,0,22,10);x.fillStyle='#8a5527';x.fillRect(10,9,2,11);x.fillStyle='#e8b070';x.fillRect(1,1,20,8);x.fillStyle='#c98a4b';x.fillRect(1,7,20,2);return c;}
function buildDecor(bi){
  const B=BIOMES[bi];
  if(bi===0)return{big:[tree(['#FFE3FB','#FFB0F2','#e978d6'],['#9a6a4a','#6b4530'],11,{fruit:'#ffffff'}),tree(['#FFE3FB','#FFB0F2','#e978d6'],['#9a6a4a','#6b4530'],12),bush(['#b9fff0','#5fe0c2','#2e9e95'],3)],
    small:[flower('#FF8DF2','#2e9e95'),flower('#ffffff','#2e9e95'),flower('#4B72FE','#2e9e95'),tuft('#5fe0c2'),bush(['#b9fff0','#5fe0c2','#2e9e95'],4),rock(['#c9c4f5','#8f87c9'])]};
  if(bi===1)return{big:[cactus(),spire(),cactus()],small:[rock(['#ffcf96','#d9772f']),flower('#FF8DF2','#3fc9a8'),tuft('#d9822e'),rock(['#ffe2bd','#e2742a']),flower('#FEEE05','#3fc9a8')]};
  if(bi===2)return{big:[mushroom(['#ffd2fa','#FF8DF2','#c757be'],5),mushroom(['#c8f6ff','#37D7FA','#2a8fc9'],6),tree(['#b4a8ff','#7a63f0','#5139c9'],['#3e3480','#2a2260'],21,{fruit:'#37D7FA'})],
    small:[crystal(),tuft('#FF8DF2'),flower('#37D7FA','#7a63f0'),crystal(),flower('#FEEE05','#7a63f0')]};
  return{big:[tree(['#e6f79a','#b5dc4e','#76ab36'],['#a8744a','#74492c'],31,{fruit:'#FF8705'}),sunflower(),hay()],
    small:[fence(),fence(),sunflower(),flower('#FF8DF2','#76ab36'),flower('#4B72FE','#76ab36'),tuft('#b5dc4e')]};
}
