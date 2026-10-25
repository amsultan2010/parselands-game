// ===== Chiptune audio engine =====
const AU={ctx:null,music:true,sfx:true,playing:false,step:0,nextT:0,timer:null,tr:0,pendTr:0,lead:'p25',pendLead:'p25',soft:false,pendSoft:false};
try{const s=JSON.parse(localStorage.getItem('parselands-audio')||'{}');if(s.music===false)AU.music=false;if(s.sfx===false)AU.sfx=false;}catch(e){}
function saveAudio(){try{localStorage.setItem('parselands-audio',JSON.stringify({music:AU.music,sfx:AU.sfx}));}catch(e){}}
function audioInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  const C=new AC();AU.ctx=C;
  const comp=C.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.connect(C.destination);
  AU.master=C.createGain();AU.master.gain.value=0.85;AU.master.connect(comp);
  AU.mus=C.createGain();AU.mus.gain.value=AU.music?0.3:0;AU.mus.connect(AU.master);
  AU.fx=C.createGain();AU.fx.gain.value=AU.sfx?0.5:0;AU.fx.connect(AU.master);
  const pulse=d=>{const n=40,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)re[k]=(2/(k*Math.PI))*Math.sin(k*Math.PI*d);return C.createPeriodicWave(re,im);};
  AU.waves={p12:pulse(0.125),p25:pulse(0.25),p50:pulse(0.5)};
  const nb=C.createBuffer(1,C.sampleRate,C.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=nb;
  AU.timer=setInterval(sched,25);
}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(dest,{type='p25',f=440,f2=0,t=0,dur=0.1,vol=0.2,a=0.004,rel=0.05}){
  const C=AU.ctx,o=C.createOscillator(),g=C.createGain();
  if(type==='tri')o.type='triangle';else if(type==='sine')o.type='sine';else o.setPeriodicWave(AU.waves[type]);
  o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.setValueAtTime(vol,t+Math.max(a+0.001,dur-rel));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+0.03);
}
function noise(dest,{t=0,dur=0.1,vol=0.2,type='highpass',freq=6000,f2=0,q=0.8}){
  const C=AU.ctx,s=C.createBufferSource();s.buffer=AU.noise;const fl=C.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(freq,t);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur);fl.Q.value=q;
  const g=C.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(dest);s.start(t,Math.random()*0.5);s.stop(t+dur+0.03);
}
function arp(dest,notes,gap,o){notes.forEach((f,i)=>tone(dest,{...o,f,t:o.t+i*gap}));}

// Song: I–V–vi–IV, two 4-bar phrases. [step, midi, length-in-16ths]
const BPM=126,STEP=60/BPM/4;
const PROG=[{r:48,ch:[60,64,67,72]},{r:43,ch:[55,59,62,67]},{r:45,ch:[57,60,64,69]},{r:41,ch:[53,57,60,65]}];
const MEL=[
 [[0,76,2],[2,79,2],[4,84,2],[6,79,2],[8,81,2],[10,79,2],[12,76,2],[14,74,2]],
 [[0,74,3],[4,79,2],[6,83,2],[8,86,2],[10,83,2],[12,79,4]],
 [[0,84,2],[2,83,2],[4,81,2],[6,76,2],[8,81,4],[12,84,2],[14,83,2]],
 [[0,81,2],[2,79,2],[4,77,4],[8,79,2],[10,81,2],[12,79,4]],
 [[0,72,2],[2,76,2],[4,79,4],[8,84,2],[10,83,2],[12,79,4]],
 [[0,79,2],[2,81,2],[4,83,4],[8,86,4],[12,83,2],[14,81,2]],
 [[0,81,2],[2,84,2],[4,88,4],[8,86,2],[10,84,2],[12,81,4]],
 [[0,77,2],[2,81,2],[4,84,2],[6,81,2],[8,79,4],[12,74,2],[14,79,2]],
];
const BIOME_MUSIC=[{tr:0,lead:'p25',soft:false},{tr:2,lead:'p50',soft:false},{tr:-3,lead:'tri',soft:true},{tr:5,lead:'p12',soft:false}];
function setMusicBiome(bi){const m=BIOME_MUSIC[bi];AU.pendTr=m.tr;AU.pendLead=m.lead;AU.pendSoft=m.soft;}
function musicStart(fromTop=true){if(!AU.ctx)return;if(fromTop){AU.step=0;AU.tr=AU.pendTr;AU.lead=AU.pendLead;AU.soft=AU.pendSoft;}AU.nextT=AU.ctx.currentTime+0.06;AU.playing=true;}
function musicStop(){AU.playing=false;}
function sched(){if(!AU.playing||!AU.ctx||AU.ctx.state!=='running')return;while(AU.nextT<AU.ctx.currentTime+0.12){playStep(AU.step,AU.nextT);AU.nextT+=STEP;AU.step=(AU.step+1)%128;}}
function playStep(s,t){
  if(s===0){AU.tr=AU.pendTr;AU.lead=AU.pendLead;AU.soft=AU.pendSoft;}
  const bar=Math.floor(s/16),st=s%16,ch=PROG[bar%4],tr=AU.tr,M=AU.mus;
  for(const n of MEL[bar])if(n[0]===st){tone(M,{type:AU.lead,f:mtof(n[1]+tr),t,dur:n[2]*STEP*0.92,vol:AU.lead==='tri'?0.2:0.11,rel:0.05});
    tone(M,{type:'p12',f:mtof(n[1]+tr),t:t+STEP*1.5,dur:n[2]*STEP*0.6,vol:0.025});}
  if(st%2===0)tone(M,{type:'tri',f:mtof(ch.r+tr+(st%4===2?12:0)),t,dur:STEP*1.7,vol:0.3,rel:0.03});
  const ap=ch.ch[[0,1,2,3,2,1,2,3][st%8]]+12+tr;tone(M,{type:'p12',f:mtof(ap),t,dur:STEP*0.55,vol:AU.soft?0.025:0.032});
  const kv=AU.soft?0.35:0.55;
  if(st===0||st===8||(st===11&&bar%2===1))tone(M,{type:'sine',f:150,f2:45,t,dur:0.14,vol:kv});
  if(st===4||st===12)noise(M,{t,dur:0.11,vol:AU.soft?0.1:0.18,type:'bandpass',freq:2200,q:0.7});
  if(bar===7&&st>=13)noise(M,{t,dur:0.06,vol:0.12,type:'bandpass',freq:3000});
  if(st%2===0)noise(M,{t,dur:0.03,vol:st%4===2?0.06:0.03,type:'highpass',freq:8000});
}

// ===== Sound effects =====
let lastStep=0;
function sfx(name){
  if(!AU.ctx||!AU.sfx)return;const t=AU.ctx.currentTime,F=AU.fx;
  switch(name){
  case 'jump':tone(F,{type:'p25',f:260,f2:640,t,dur:0.13,vol:0.17});break;
  case 'djump':tone(F,{type:'p12',f:520,f2:1250,t,dur:0.16,vol:0.14});tone(F,{type:'tri',f:900,f2:1700,t:t+0.04,dur:0.12,vol:0.12});noise(F,{t,dur:0.18,vol:0.07,type:'bandpass',freq:2500,f2:8000});break;
  case 'coin':tone(F,{type:'p25',f:988,t,dur:0.07,vol:0.13});tone(F,{type:'p25',f:1319,t:t+0.06,dur:0.16,vol:0.13});break;
  case 'coin2':arp(F,[1047,1319,1568],0.05,{type:'p25',t,dur:0.09,vol:0.12});tone(F,{type:'tri',f:2093,t:t+0.15,dur:0.18,vol:0.1});break;
  case 'rare':arp(F,[1047,1319,1568,2093,1568,2093],0.055,{type:'p50',t,dur:0.1,vol:0.11});arp(F,[523,659,784,1047],0.08,{type:'tri',t,dur:0.2,vol:0.12});break;
  case 'power':arp(F,[523,587,659,784,880,1047,1175,1319],0.04,{type:'p50',t,dur:0.08,vol:0.11});noise(F,{t:t+0.3,dur:0.25,vol:0.05,type:'highpass',freq:7000});break;
  case 'heart':arp(F,[523,659,784,1047],0.07,{type:'tri',t,dur:0.35,vol:0.16});arp(F,[1568,2093],0.1,{type:'p12',t:t+0.25,dur:0.12,vol:0.06});break;
  case 'hurt':noise(F,{t,dur:0.25,vol:0.28,type:'lowpass',freq:2500,f2:300});tone(F,{type:'p50',f:440,f2:110,t,dur:0.25,vol:0.16});break;
  case 'land':tone(F,{type:'sine',f:150,f2:60,t,dur:0.08,vol:0.22});noise(F,{t,dur:0.06,vol:0.06,type:'lowpass',freq:900});break;
  case 'step':if(t-lastStep<0.12)return;lastStep=t;noise(F,{t,dur:0.03,vol:0.025,type:'bandpass',freq:1800,q:1.2});break;
  case 'crouch':noise(F,{t,dur:0.12,vol:0.08,type:'bandpass',freq:1400,f2:400});break;
  case 'bonk':tone(F,{type:'p50',f:220,f2:90,t,dur:0.12,vol:0.18});noise(F,{t,dur:0.08,vol:0.12,type:'lowpass',freq:1200});break;
  case 'milestone':arp(F,[784,988,1175,1568],0.07,{type:'p25',t,dur:0.12,vol:0.1});arp(F,[392,494,587,784],0.07,{type:'tri',t,dur:0.18,vol:0.12});break;
  case 'biome':arp(F,[523,659,784,1047,1319],0.1,{type:'tri',t,dur:0.3,vol:0.13});arp(F,[1047,1319,1568,2093,2637],0.1,{type:'p12',t:t+0.05,dur:0.15,vol:0.04});break;
  case 'over':arp(F,[523,494,440,392,349,330],0.11,{type:'p25',t,dur:0.13,vol:0.13});tone(F,{type:'tri',f:262,f2:131,t:t+0.68,dur:0.6,vol:0.16});break;
  case 'start':arp(F,[392,523,659,784,1047],0.06,{type:'p25',t,dur:0.1,vol:0.12});tone(F,{type:'tri',f:1047,t:t+0.3,dur:0.3,vol:0.12});break;
  case 'click':tone(F,{type:'p25',f:660,t,dur:0.05,vol:0.08});break;
  case 'pause':arp(F,[784,523],0.08,{type:'tri',t,dur:0.1,vol:0.12});break;
  }
}
