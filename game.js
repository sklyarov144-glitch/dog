(() => {
'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const ui={score:$('score'),coins:$('coins'),best:$('best'),hud:$('hud'),menu:$('menu'),gameOver:$('gameOver'),shop:$('shop'),missions:$('missions'),toast:$('toast'),finalScore:$('finalScore'),finalCoins:$('finalCoins'),finalBest:$('finalBest'),bankCoins:$('bankCoins'),skins:$('skins'),missionsList:$('missionsList')};
const SAVE='dogSurfSave_v2',LANES=[-280,0,280],skins=[{id:'classic',name:'Sunny Pup',emoji:'🐶',price:0},{id:'captain',name:'Captain Pup',emoji:'🧢',price:320},{id:'royal',name:'Royal Pup',emoji:'👑',price:700}];
let ysdk=null,last=0,state='menu',muted=false,adRuns=0;
const save=load(); let game=newGame();
function newGame(){return{t:0,speed:520,lane:1,x:0,targetX:0,y:0,vy:0,jumping:false,sliding:false,slide:0,invuln:0,score:0,runCoins:0,revived:false,doubleUsed:false,obstacles:[],bones:[],particles:[],spawnT:1.4,boneT:0,lastPattern:'single'};}
function load(){try{return Object.assign({best:0,coins:0,owned:['classic'],skin:'classic',missions:{collect:0,dodge:0}},JSON.parse(localStorage.getItem(SAVE)||'{}'));}catch{return{best:0,coins:0,owned:['classic'],skin:'classic',missions:{collect:0,dodge:0}};}}
function persist(){localStorage.setItem(SAVE,JSON.stringify(save));}
function resize(){const dpr=Math.min(window.devicePixelRatio||1,2); canvas.width=Math.floor(innerWidth*dpr);canvas.height=Math.floor(innerHeight*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);} resize(); addEventListener('resize',resize);
function show(name){['menu','gameOver','shop','missions'].forEach(k=>ui[k].classList.toggle('hidden',k!==name));}
function toast(t){ui.toast.textContent=t;ui.toast.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.add('hidden'),1700);}
function start(){game=newGame();state='play';ui.hud.classList.remove('hidden');show('none');updateHud();}
function over(){state='over';save.coins+=game.runCoins;save.best=Math.max(save.best,Math.floor(game.score));persist();ui.finalScore.textContent=Math.floor(game.score);ui.finalCoins.textContent=game.runCoins;ui.finalBest.textContent=save.best;show('gameOver');adRuns++;if(adRuns%3===0)showInterstitial();}
function updateHud(){ui.score.textContent=Math.floor(game.score);ui.coins.textContent=save.coins+game.runCoins;ui.best.textContent=save.best;}
function input(act){if(state!=='play')return; if(act==='L')game.lane=Math.max(0,game.lane-1); if(act==='R')game.lane=Math.min(2,game.lane+1); if(act==='J'&&!game.jumping){game.jumping=true;game.vy=-1050;} if(act==='S'&&!game.jumping){game.sliding=true;game.slide=.55;}}
function pickObstacleType(pattern,time){
  if(pattern==='single') return time<16?(Math.random()<.6?'rock':'crate'):(Math.random()<.22?'jumpRock':Math.random()<.44?'slideGate':Math.random()<.64?'rock':Math.random()<.82?'crate':'movingBuoy');
  if(pattern==='jump') return 'jumpRock';
  if(pattern==='slide') return 'slideGate';
  if(pattern==='switch') return Math.random()<.55?'laneCrab':'waveBarrier';
  return Math.random()<.5?'rock':'crate';
}
function pushObstacle(lane,type,z){game.obstacles.push({lane,z,type,dx:Math.random()>.5?1:-1});}
function spawnObstacle(){
  const t=game.t;
  const lanes=[0,1,2];
  const shuffle=[...lanes].sort(()=>Math.random()-.5);
  let pattern='single';
  if(t<22){pattern='single';}
  else if(t<32){pattern=Math.random()<.72?'single':'twoBlock';}
  else if(t<60){const r=Math.random();pattern=r<.45?'single':r<.68?'twoBlock':r<.8?'jump':r<.92?'slide':'switch';}
  else {const r=Math.random();pattern=r<.32?'single':r<.55?'twoBlock':r<.72?'jump':r<.87?'slide':'switch';}
  // avoid repeating high pressure patterns
  if(game.lastPattern!=='single'&&pattern!=='single'&&Math.random()<.55) pattern='single';
  game.lastPattern=pattern;
  const spawnZ=-1180-Math.min(380,t*8);
  if(pattern==='twoBlock'){
    const safeLane=shuffle[0];
    const blocked=lanes.filter(v=>v!==safeLane);
    pushObstacle(blocked[0],pickObstacleType('single',t),spawnZ);
    pushObstacle(blocked[1],pickObstacleType('single',t),spawnZ-55);
    return;
  }
  if(pattern==='jump'){
    pushObstacle(shuffle[0],'jumpRock',spawnZ);
    return;
  }
  if(pattern==='slide'){
    pushObstacle(shuffle[0],'slideGate',spawnZ);
    return;
  }
  if(pattern==='switch'){
    const safeLane=shuffle[0];
    const blocked=lanes.filter(v=>v!==safeLane);
    pushObstacle(blocked[0],'laneCrab',spawnZ);
    pushObstacle(blocked[1],'waveBarrier',spawnZ-45);
    return;
  }
  pushObstacle(shuffle[0],pickObstacleType(pattern,t),spawnZ);
}
function spawnBones(){const lane=Math.floor(Math.random()*3),pat=Math.floor(Math.random()*3);for(let i=0;i<7;i++){const ln=pat===0?lane:pat===1?(i%3):((lane+i)%3);game.bones.push({lane:ln,z:-200-i*95,rare:i===3&&Math.random()<.4,taken:false});}}
function pz(z){const p=Math.max(.08,Math.min(1.75,(z+1380)/2000));return{p,y:innerHeight*.2+p*innerHeight*.78};}
function update(dt){if(state!=='play')return; game.t+=dt; game.speed=Math.min(1220,game.speed+dt*12.5); game.score+=dt*game.speed*.05; game.targetX=LANES[game.lane]; game.x+=(game.targetX-game.x)*Math.min(1,dt*11); if(game.jumping){game.y+=game.vy*dt;game.vy+=2200*dt;if(game.y>=0){game.y=0;game.jumping=false;}} if(game.sliding){game.slide-=dt;if(game.slide<=0)game.sliding=false;} if(game.invuln>0)game.invuln-=dt;
 const minGap=game.t<30?1.35:game.t<60?1.1:.9;
 game.spawnT-=dt;if(game.spawnT<=0){spawnObstacle();game.spawnT=minGap+Math.random()*.35;} game.boneT-=dt;if(game.boneT<=0){spawnBones();game.boneT=1.05+Math.random()*.95;}
 const dz=game.speed*dt; game.obstacles.forEach(o=>{o.z+=dz;if(o.type==='movingBuoy')o.lane=Math.max(0,Math.min(2,o.lane+(Math.random()<.04?o.dx:0)));}); game.bones.forEach(b=>b.z+=dz);
 game.obstacles=game.obstacles.filter(o=>o.z<1200); game.bones=game.bones.filter(b=>b.z<1200&&!b.taken); check(); updateHud();}
function check(){const px=game.x; for(const b of game.bones){const s=pz(b.z),x=LANES[b.lane]*s.p;if(Math.abs(x-px)<90&&Math.abs(s.y-(innerHeight*.74+game.y))<105){b.taken=true;game.runCoins+=b.rare?5:1;save.missions.collect++;}}
 if(game.invuln>0)return; for(const o of game.obstacles){const s=pz(o.z),x=LANES[o.lane]*s.p,y=Math.abs(s.y-(innerHeight*.74+game.y)); const hitX=Math.abs(x-px)<72;const hitY=y<76; if(hitX&&hitY){const ok=(o.type==='jumpRock'&&game.jumping)||(o.type==='slideGate'&&game.sliding)||(o.type==='weedArch'&&game.sliding); if(!ok){over();return;} save.missions.dodge++;}}}
function draw(){ctx.clearRect(0,0,innerWidth,innerHeight); drawBg(); drawLanes(); drawEntities(); drawPlayer();}
function drawBg(){const g=ctx.createLinearGradient(0,0,0,innerHeight);g.addColorStop(0,'#5d78df');g.addColorStop(.3,'#ff8a64');g.addColorStop(.53,'#ffd97e');g.addColorStop(.54,'#1994d5');g.addColorStop(1,'#0a3a62');ctx.fillStyle=g;ctx.fillRect(0,0,innerWidth,innerHeight); ctx.fillStyle='rgba(255,233,154,.85)';ctx.beginPath();ctx.arc(innerWidth*.77,innerHeight*.18,Math.min(100,innerWidth*.08),0,7);ctx.fill();}
function drawLanes(){for(let i=0;i<3;i++){ctx.strokeStyle='rgba(255,255,255,.27)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(innerWidth/2+LANES[i]*.2,innerHeight*.34);ctx.bezierCurveTo(innerWidth/2+LANES[i]*.6,innerHeight*.62,innerWidth/2+LANES[i],innerHeight*.95,innerWidth/2+LANES[i],innerHeight*1.1);ctx.stroke();}}
function drawObstacle(type){
  ctx.lineWidth=6;
  if(type==='rock'||type==='jumpRock'){
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(0,48,58,18,0,0,7);ctx.fill();
    const g=ctx.createLinearGradient(-45,-45,48,58);g.addColorStop(0,'#b9c2cd');g.addColorStop(.65,'#68717e');g.addColorStop(1,'#49525f');
    ctx.fillStyle=g;ctx.strokeStyle='#39414c';ctx.beginPath();ctx.moveTo(-56,24);ctx.lineTo(-38,-36);ctx.lineTo(22,-50);ctx.lineTo(60,-8);ctx.lineTo(44,32);ctx.lineTo(-10,54);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-12,-18,16,8,-.4,0,7);ctx.fill();
  } else if(type==='movingBuoy'){
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(0,58,50,16,0,0,7);ctx.fill();
    const g=ctx.createLinearGradient(0,-54,0,54);g.addColorStop(0,'#fff');g.addColorStop(.32,'#ff4d4d');g.addColorStop(.65,'#fff');g.addColorStop(1,'#d13232');
    ctx.fillStyle=g;ctx.strokeStyle='#7b2020';ctx.beginPath();ctx.ellipse(0,8,44,54,0,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.ellipse(-15,-15,9,16,-.35,0,7);ctx.fill();
  } else if(type==='crate'){
    ctx.fillStyle='rgba(0,0,0,.26)';ctx.beginPath();ctx.ellipse(0,56,58,18,0,0,7);ctx.fill();
    ctx.fillStyle='#9c673b';ctx.strokeStyle='#5f3619';ctx.fillRect(-52,-38,104,90);ctx.strokeRect(-52,-38,104,90);
    ctx.fillStyle='#b47846';ctx.fillRect(-52,-38,20,90);ctx.fillRect(32,-38,20,90);
    ctx.strokeStyle='#6a3e20';ctx.beginPath();ctx.moveTo(-52,-6);ctx.lineTo(52,-6);ctx.moveTo(-52,22);ctx.lineTo(52,22);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(-42,-28,34,20);
  } else if(type==='laneCrab'){
    ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(0,46,62,14,0,0,7);ctx.fill();
    const g=ctx.createLinearGradient(-45,-20,45,45);g.addColorStop(0,'#ff836d');g.addColorStop(1,'#be2d24');ctx.fillStyle=g;ctx.strokeStyle='#7e1712';
    ctx.beginPath();ctx.ellipse(0,8,50,34,0,0,7);ctx.fill();ctx.stroke();
    ctx.lineWidth=5;for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(i*26,10);ctx.lineTo(i*58,-8);ctx.moveTo(i*24,22);ctx.lineTo(i*55,30);ctx.stroke();}
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-16,-6,8,0,7);ctx.arc(16,-6,8,0,7);ctx.fill();
  } else if(type==='waveBarrier'||type==='slideGate'){
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(0,54,72,16,0,0,7);ctx.fill();
    const g=ctx.createLinearGradient(-70,-38,70,42);g.addColorStop(0,'#8cf7ff');g.addColorStop(.55,'#39c8f5');g.addColorStop(1,'#2287cc');
    ctx.fillStyle=g;ctx.strokeStyle='#1a5685';ctx.beginPath();ctx.moveTo(-72,26);ctx.quadraticCurveTo(-28,-26,0,8);ctx.quadraticCurveTo(34,40,72,-20);ctx.lineTo(72,44);ctx.lineTo(-72,44);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.42)';ctx.fillRect(-46,-6,36,10);
  }
}
function drawEntities(){const arr=[...game.bones.map(v=>({...v,k:'b'})),...game.obstacles.map(v=>({...v,k:'o'}))].sort((a,b)=>a.z-b.z); for(const e of arr){const s=pz(e.z),x=innerWidth/2+LANES[e.lane]*s.p,y=s.y;ctx.save();ctx.translate(x,y);ctx.scale(s.p*1.95,s.p*1.95); if(e.k==='b'){ctx.fillStyle=e.rare?'#95fbff':'#ffd34d';ctx.beginPath();ctx.roundRect(-25,-16,50,32,12);ctx.fill();ctx.fillStyle='#fff';ctx.fillText('🦴',0,6);} else {drawObstacle(e.type);}ctx.restore();}}
function drawPlayer(){const x=innerWidth/2+game.x,y=innerHeight*.74+game.y;ctx.save();ctx.translate(x,y);ctx.scale(.6,.6);const bob=Math.sin(game.t*16)*3;ctx.translate(0,bob);ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(0,120,170,34,0,0,7);ctx.fill(); const surf=ctx.createLinearGradient(-140,70,140,140);surf.addColorStop(0,'#51e6df');surf.addColorStop(.5,'#ffbf42');surf.addColorStop(1,'#ff5f8c');ctx.fillStyle=surf;ctx.beginPath();ctx.ellipse(0,100,160,34,0,0,7);ctx.fill(); ctx.fillStyle='#fff5e5';ctx.beginPath();ctx.ellipse(0,20,75,88,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-44,-35,30,50,-.3,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(44,-35,30,50,.3,0,7);ctx.fill();ctx.fillStyle='#161920';ctx.beginPath();ctx.arc(-28,-2,12,0,7);ctx.arc(28,-2,12,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-24,-6,4,0,7);ctx.arc(32,-6,4,0,7);ctx.fill();ctx.fillStyle='#202025';ctx.beginPath();ctx.ellipse(0,18,15,10,0,0,7);ctx.fill();ctx.strokeStyle='#3b2a2f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,27,24,.15,2.95);ctx.stroke(); const sk=skins.find(s=>s.id===save.skin);if(sk?.id!=='classic'){ctx.font='34px serif';ctx.fillText(sk.emoji,0,-72);}ctx.restore();}
function loop(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;update(dt);draw();requestAnimationFrame(loop);} requestAnimationFrame(loop);
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','a'].includes(k))input('L');if(['arrowright','d'].includes(k))input('R');if(['arrowup','w',' '].includes(k))input('J');if(['arrowdown','s'].includes(k))input('S');});
let sx=0,sy=0;canvas.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;});canvas.addEventListener('pointerup',e=>{const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return input('J');if(Math.abs(dx)>Math.abs(dy))input(dx<0?'L':'R');else input(dy<0?'J':'S');});
$('playBtn').onclick=start;$('restartBtn').onclick=start;$('homeBtn').onclick=()=>{state='menu';ui.hud.classList.add('hidden');show('menu');};$('shopBtn').onclick=()=>{renderShop();show('shop');};$('missionsBtn').onclick=()=>{renderMissions();show('missions');};$('backFromShop').onclick=() => show('menu');$('backFromMissions').onclick=()=>show('menu');$('fullscreenBtn').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
$('pauseBtn').onclick=()=>{if(state==='play'){state='pause';toast('Пауза');}else if(state==='pause'){state='play';}};$('muteBtn').onclick=()=>{muted=!muted;$('muteBtn').textContent=muted?'🔈':'🔊';};$('leaderBtn').onclick=()=>toast('Leaderboard: surfDogRushScore');
$('reviveBtn').onclick=()=>{if(game.revived)return toast('Revive уже использован');showRewarded(()=>{game.revived=true;game.invuln=3;game.obstacles=[];state='play';show('none');});};$('doubleBtn').onclick=()=>{if(game.doubleUsed)return toast('x2 уже использован');showRewarded(()=>{game.doubleUsed=true;save.coins+=game.runCoins;persist();toast('Награда удвоена');});};
function renderShop(){ui.bankCoins.textContent=save.coins;ui.skins.innerHTML='';skins.forEach(s=>{const own=save.owned.includes(s.id),d=document.createElement('div');d.className='shopItem';d.innerHTML=`<span>${s.emoji} ${s.name}<br><small>${own?'Куплено':s.price+' косточек'}</small></span>`;const b=document.createElement('button');b.textContent=save.skin===s.id?'Выбран':own?'Выбрать':'Купить';b.onclick=()=>{if(!own){if(save.coins<s.price)return toast('Не хватает косточек');save.coins-=s.price;save.owned.push(s.id);}save.skin=s.id;persist();renderShop();updateHud();};d.appendChild(b);ui.skins.appendChild(d);});}
function renderMissions(){const data=[`Собери 200 косточек: ${save.missions.collect}/200`,`Уклонись от 100 преград: ${save.missions.dodge}/100`,`Поставь рекорд 5000+: ${save.best}/5000`];ui.missionsList.innerHTML=data.map(v=>`<li>${v}</li>`).join('');}
async function initY(){if(!window.YaGames)return; try{ysdk=await YaGames.init();ysdk.features.LoadingAPI?.ready();}catch{}}
function showInterstitial(){ysdk?.adv?.showFullscreenAdv({callbacks:{}});} function showRewarded(ok){if(!ysdk?.adv){ok();return;}ysdk.adv.showRewardedVideo({callbacks:{onRewarded:ok,onError:()=>toast('Реклама недоступна')}});} 
initY();show('menu');updateHud();
})();
