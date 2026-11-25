const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
let w, h, ratio, frame = 0, time = 0, last = 0
let shells = [], serial = 0, patternIndex = 0, nextLaunch = 0
const tau = 2 * Math.PI
const colors = ['#ffce80','#ff8f9e','#f5ae64','#f1a098','#ffe4a7','#f6a3bd','#e9b2ec']
const blooms = colors.map((color,index)=>makeBloom(color,index))
function random(seed) {
  let state=seed
  return () => ((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296)
}
function halo(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,0,x,y,r)
  g.addColorStop(0,color);g.addColorStop(1,'transparent')
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)
}
function pavilion(c,x,y,s,levels){
  c.save();c.translate(x,y);c.scale(s,s)
  for(let i=0;i<levels;i++){
    const k=1-i*.16, v=-i*26
    c.fillStyle='#310f22';c.fillRect(-24*k,v-23,48*k,25)
    c.fillStyle='#ef9d64'
    for(let j=-2;j<=2;j++)c.fillRect(j*8*k-1,v-18,2.5*k,8)
    c.beginPath();c.moveTo(-41*k,v-22);c.quadraticCurveTo(-26*k,v-23,-10*k,v-37)
    c.lineTo(10*k,v-37);c.quadraticCurveTo(24*k,v-23,41*k,v-22);c.lineTo(44*k,v-26)
    c.quadraticCurveTo(43*k,v-16,0,v-20);c.quadraticCurveTo(-43*k,v-16,-44*k,v-26);c.closePath()
    c.fillStyle='#43182a';c.fill();c.strokeStyle='#dd9468';c.lineWidth=.9;c.stroke()
  }
  c.restore()
}

function resize(){
  const rect=canvas.getBoundingClientRect()
  if(w===rect.width && h===rect.height)return
  w=rect.width;h=rect.height;ratio=Math.min(devicePixelRatio||1,1.6)
  canvas.width=base.width=Math.round(w*ratio);canvas.height=base.height=Math.round(h*ratio)
  const c=base.getContext('2d');c.scale(ratio,ratio)
  const rand=random(2718), horizon=h*.86
  const sky=c.createLinearGradient(0,0,0,h)
  sky.addColorStop(0,'#251025');sky.addColorStop(.56,'#46182f');sky.addColorStop(.86,'#833846');sky.addColorStop(1,'#261528')
  c.fillStyle=sky;c.fillRect(0,0,w,h)
  for(let i=0;i<200;i++){
    c.fillStyle='rgba(255,227,195,'+(rand()*.55)+')'
    c.fillRect(rand()*w,rand()*h*.8,1,1)
  }
  for(let layer=0;layer<3;layer++){
    const y=h*(.74+layer*.05)
    c.fillStyle=['#553649','#412b40','#2b2032'][layer]
    c.beginPath();c.moveTo(0,horizon)
    for(let x=0;x<w+7;x+=6)c.lineTo(x,y+12*Math.sin(x/95+layer*2)+6*Math.cos(x/38+layer))
    c.lineTo(w,horizon);c.closePath();c.fill()
  }
  for(let i=0;i<42;i++){
    const x=w*rand(), s=.16+rand()*.22
    pavilion(c,x,horizon,s,1+Math.floor(rand()*2))
    halo(c,x,horizon-3,6,'#ffb06540')
  }
  pavilion(c,w*.80,horizon,w<650?.79:1.10,3)
  pavilion(c,w*.91,horizon,.65,2)
  const water=c.createLinearGradient(0,horizon,0,h)
  water.addColorStop(0,'#402535');water.addColorStop(1,'#140f1f')
  c.fillStyle=water;c.fillRect(0,horizon,w,h-horizon)
  for(let i=0;i<620;i++){
    const x=rand()*w,y=rand(),len=1+rand()*(1+y*14)
    c.fillStyle='rgba(237,151,99,'+(rand()*.17*(1-y*.65))+')'
    c.fillRect(x,horizon+y*(h-horizon),len,.8)
  }
  shells=[]
  addShell(w*.62,h*.33,1.52,0)
  addShell(w*.25,h*.52,1.68,1,.76)
  addShell(w*.41,h*.20,2.03,3,.46)
  nextLaunch=time+1.2;paint()
}
// Pre-render the fine, broken streaks of the original blooms at full resolution.
function makeBloom(color, index){
  const sprite=document.createElement('canvas')
  sprite.width=sprite.height=520
  const brush=sprite.getContext('2d'), rand=random(23+index*8)
  brush.translate(260,245)
  brush.lineCap='round'
  const rays=[]
  for(let i=0;i<112;i++){
    const angle=i*tau/112+rand()*.045
    const length=212*(.53+rand()*.47)
    const dx=Math.cos(angle)*length,dy=Math.sin(angle)*length
    const tint=i%5===0?'#fff3c3':color
    rays.push({dx,dy,tint,phase:rand()*tau})
    brush.strokeStyle=tint
    for(let j=0;j<13;j++){
      const t=.13+j*.066,end=t+.038*rand()
      brush.globalAlpha=(.26+.72*t)*(.58+rand()*.42)
      brush.lineWidth=.65+rand()*1.18
      brush.beginPath()
      brush.moveTo(dx*t,dy*t+length*.13*t*t)
      brush.lineTo(dx*end,dy*end+length*.13*end*end)
      brush.stroke()
    }
  }
  return {sprite,rays,color}
}
function addShell(x,y,age=0,style=patternIndex++%colors.length,size=1){
  const radius=Math.min(w*(w<650?.40:.21),h*.33)*size
  const flight=.72+(serial++%3)*.09
  shells.push({x,y,radius,bloom:blooms[style],born:time-age,flight,
    launchX:x-radius*.24,launchY:h*.85})
  if(shells.length>7)shells.shift()
}
function drawShell(shell){
  const {x,y,radius,flight,bloom}=shell, age=time-shell.born
  if(age<flight){
    const travel=t=>1-(1-t)**1.8
    const t=Math.max(0,age/flight), f=travel(t), tail=travel(Math.max(0,t-.09))
    const px=shell.launchX+(x-shell.launchX)*f,py=shell.launchY+(y-shell.launchY)*f
    const tailX=shell.launchX+(x-shell.launchX)*tail,tailY=shell.launchY+(y-shell.launchY)*tail
    const exhaust=ctx.createLinearGradient(tailX,tailY,px+.01,py)
    exhaust.addColorStop(0,'transparent');exhaust.addColorStop(.72,'#e68b428c');exhaust.addColorStop(1,'#fff0bb')
    ctx.strokeStyle=exhaust;ctx.lineWidth=2;ctx.beginPath()
    ctx.moveTo(tailX,tailY)
    ctx.lineTo(px,py);ctx.stroke();halo(ctx,px,py,7,'#ffdc92');return
  }
  const t=age-flight
  const expansion=1-Math.exp(-3.4*t)
  const fade=Math.min(1,t*9)*Math.max(0,1-Math.max(0,t-.9)/2.25)**1.3
  if(fade<=0)return
  const scale=radius*expansion/212
  const fall=radius*.035*t*t
  ctx.globalAlpha=.28*Math.exp(-2.6*t)
  halo(ctx,x,y,radius*1.07,bloom.color)
  ctx.globalAlpha=fade
  ctx.drawImage(bloom.sprite,x-260*scale,y+fall-245*scale,520*scale,520*scale)
  for(const ray of bloom.rays){
    const pulse=Math.max(0,Math.sin(t*12+ray.phase))
    if(pulse<.45)continue
    const reach=.86+.08*pulse
    ctx.globalAlpha=fade*pulse*.84
    ctx.fillStyle=ray.tint
    ctx.fillRect(x+ray.dx*scale*reach,y+fall+ray.dy*scale*reach,1.35,1.35)
  }
  // Broken bands on the water follow the color and decay of each bloom.
  for(let i=0;i<18;i++){
    const k=i/18
    ctx.globalAlpha=Math.exp(-1.7*t)*.25*(1-k)
    ctx.fillStyle=bloom.color
    const width=radius*(.09+.28*k)*(1+.4*Math.sin(i*8+time*2))
    ctx.fillRect(x-width*.5+Math.sin(i*17+time)*radius*.08,h*(.867+.116*k),width,1+k)
  }
  ctx.globalAlpha=1
}
function paint(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
  ctx.drawImage(base,0,0);ctx.scale(ratio,ratio);ctx.globalCompositeOperation='lighter'
  for(const shell of shells){ctx.globalAlpha=1;drawShell(shell)}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
}
function tick(now){
  frame=0
  if(document.hidden)return
  if(now-last>=1000/60-1){
    time+=Math.min(.08,(now-last)/1000);last=now
    shells=shells.filter(s=>time-s.born<4.4)
    if(time>=nextLaunch){
      const lane=patternIndex%3
      addShell(w*(.24+.26*lane+(Math.random()-.5)*.09),h*(.26+Math.random()*.24))
      if(lane===0)addShell(w*.77,h*.48,0,0,.57)
      nextLaunch=time+1.05+Math.random()*.48
    }
    paint()
  }
  frame=requestAnimationFrame(tick)
}
function resume(){
  if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick)}
}
export function burst(x=w*(.23+Math.random()*.54),y=h*(.24+Math.random()*.32)){
  addShell(x,y)
  paint()
}
document.addEventListener('visibilitychange',resume)
new ResizeObserver(resize).observe(canvas)
resize();resume()
