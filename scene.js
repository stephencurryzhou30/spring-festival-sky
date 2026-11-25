const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
const waterfront = new Image()
let w, h, ratio, lighthouse, waterline, frame = 0, time = 0, last = 0
let shells = [], ripples = [], serial = 0, patternIndex = 0, nextLaunch = 0
const tau = 2 * Math.PI
const styles = [
  {color:'#ffce80',core:'#fff2bc',shape:'peony',hang:.075},
  {color:'#ff8f9e',core:'#ffe2ab',shape:'chrysanthemum',hang:.11},
  {color:'#ffba62',core:'#fff1c4',shape:'willow',hang:.34},
  {color:'#f6a8d2',core:'#ffd59b',shape:'double',hang:.08},
  {color:'#ff9d6b',core:'#fff1be',shape:'palm',hang:.24},
  {color:'#ddd1ff',core:'#fff2c6',shape:'strobe',hang:.095},
  {color:'#ffe3a0',core:'#fff8db',shape:'brocade',hang:.2}
]
const blooms=styles.map(makeBloom)
const seaGlows=[makeSeaGlow('#ffd298'),makeSeaGlow('#b7c7ff')]
function random(seed) {
  let state=seed
  return () => ((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296)
}
function halo(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,0,x,y,r)
  g.addColorStop(0,color);g.addColorStop(1,'transparent')
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)
}
function makeSeaGlow(color){
  const sprite=document.createElement('canvas')
  sprite.width=64;sprite.height=16
  const brush=sprite.getContext('2d')
  brush.translate(32,8);brush.scale(1,.22)
  halo(brush,0,0,32,color)
  return sprite
}
function paintWaterfront(){
  const c=base.getContext('2d')
  c.setTransform(ratio,0,0,ratio,0,0)
  const dusk=c.createLinearGradient(0,0,0,h)
  dusk.addColorStop(0,'#171a45');dusk.addColorStop(.63,'#57334d');dusk.addColorStop(1,'#101b32')
  c.fillStyle=dusk;c.fillRect(0,0,w,h)
  if(!waterfront.naturalWidth)return

  const scale=Math.max(w/waterfront.naturalWidth,h/waterfront.naturalHeight)
  const width=waterfront.naturalWidth*scale,height=waterfront.naturalHeight*scale
  const x=(w-width)*(w<h?.41:.45),y=(h-height)*.72
  c.drawImage(waterfront,x,y,width,height)
  lighthouse={x:x+width*.425,y:y+height*.411}
  waterline=Math.min(h,y+height*.806)
  const rand=random(707), depth=h-waterline
  ripples=Array.from({length:96},()=>{
    const warm=rand()<.76
    const columns=[.148,.425,.47,.88]
    const column=columns[Math.floor(rand()*columns.length)]
    const u=warm?column+(rand()-.5)*.085:rand()
    const v=rand()
    return {x:x+width*u,y:waterline+v*depth,
      length:(4+rand()*14)*(.62+v*.68),strength:(.035+rand()*.085)*Math.min(1,v*4),
      phase:rand()*tau,speed:.65+rand()*.9,warm}
  }).filter(ripple=>ripple.x>-20&&ripple.x<w+20)
}
function resize(){
  const rect=canvas.getBoundingClientRect()
  if(w===rect.width && h===rect.height)return
  w=rect.width;h=rect.height;ratio=Math.min(devicePixelRatio||1,1.6)
  canvas.width=base.width=Math.round(w*ratio);canvas.height=base.height=Math.round(h*ratio)
  paintWaterfront()
  shells=[]
  addShell(w*.68,h*.28,1.52,0)
  addShell(w*.25,h*.23,1.68,1,.76)
  addShell(w*.50,h*.17,2.03,3,.46)
  nextLaunch=time+1.2;paint()
}
// Cache the distant and near halves of each textured bloom for mobile playback.
function makeBloom(style,index){
  const {color,core,shape,hang}=style
  const rand=random(23+index*8)
  const layers=Array.from({length:2},()=>{
    const sprite=document.createElement('canvas')
    sprite.width=sprite.height=560
    const brush=sprite.getContext('2d')
    brush.translate(280,242)
    brush.lineCap='round'
    return {sprite,brush}
  })
  const rays=[], count=shape==='brocade'?184:144
  for(let i=0;i<count;i++){
    const angle=i*tau/count+rand()*.045
    const near=i%2===0
    const z=(near?1:-1)*rand()
    const inner=shape==='double'&&i%3===0
    const palmAngle=Math.round(angle/(tau/9))*(tau/9)+(rand()-.5)*.145
    const azimuth=shape==='palm'?palmAngle:angle
    let reach=.56+rand()*.44
    if(shape==='chrysanthemum')reach=.83+rand()*.17
    if(shape==='palm')reach=.64+rand()*.36
    if(shape==='double')reach=inner?.39+rand()*.16:.79+rand()*.21
    if(shape==='willow')reach=.63+rand()*.36

    const span=212*reach*Math.sqrt(1-.48*z*z)
    const dx=Math.cos(azimuth)*span
    const dy=Math.sin(azimuth)*span*(shape==='willow'?.8:1)
    const bend=span*hang
    const tint=inner||i%5===0?core:color
    const phase=rand()*tau
    const offset=rand()*.036
    const brush=layers[near?1:0].brush
    rays.push({dx,dy,bend,z,tint,phase})
    brush.strokeStyle=tint
    const segments=shape==='willow'?18:13
    for(let j=0;j<segments;j++){
      const t=.07+offset+j*.88/segments+(rand()-.5)*.025
      const end=t+(shape==='strobe'?.016:.029)*(.55+rand()*.84)
      brush.globalAlpha=(.34+.66*t)*(.60+rand()*.40)*(near?1:.58)
      brush.lineWidth=(.72+rand()*.88)*(near?1.21:.72)
      brush.beginPath()
      brush.moveTo(dx*t,dy*t+bend*t*t)
      brush.lineTo(dx*end,dy*end+bend*end*end)
      brush.stroke()
    }
  }
  return {layers:layers.map(layer=>layer.sprite),rays,color,shape,hang}
}
function addShell(x,y,age=0,style=patternIndex++%styles.length,size=1){
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
  const fade=Math.min(1,t*9)*Math.max(0,1-Math.max(0,t-1.1)/2.05)**1.15
  if(fade<=0)return
  const scale=radius*expansion/212
  const fall=radius*(.023+bloom.hang*.18)*t*t
  ctx.globalAlpha=.28*Math.exp(-2.6*t)
  halo(ctx,x,y,radius*1.07,bloom.color)
  ctx.globalAlpha=.78*Math.exp(-5.2*t)
  halo(ctx,x,y,4+radius*.12,'#fff1c5')

  // Perspective separates foreground and background as the shell expands.
  for(let layer=0;layer<bloom.layers.length;layer++){
    const parallax=1+(layer===0?-.15:.13)*expansion
    const projected=scale*parallax
    ctx.globalAlpha=fade*(layer===0?.79:1)
    ctx.drawImage(bloom.layers[layer],x-280*projected,y+fall-242*projected,560*projected,560*projected)
  }
  for(const ray of bloom.rays){
    const pulse=Math.max(0,Math.sin(t*(bloom.shape==='strobe'?22:12)+ray.phase))
    if(pulse<.46)continue
    const reach=.88+.08*pulse
    const projected=scale*(1+ray.z*.16*expansion)
    const size=1.08+.55*ray.z
    ctx.globalAlpha=fade*pulse*(.66+.24*ray.z)
    ctx.fillStyle=ray.tint
    ctx.fillRect(x+ray.dx*projected*reach,y+fall+(ray.dy*reach+ray.bend*reach*reach)*projected,size,size)
  }
  // Reflections appear as short, diffused flashes on the water.
  if(waterline<h){
    for(let i=0;i<12;i++){
      const depth=(i+1)/13
      const drift=Math.sin(i*7.1+t*.8)
      const width=radius*(.08+.15*depth)
      ctx.globalAlpha=Math.exp(-2.15*t)*(.11-.07*depth)*(.7+.3*drift)
      ctx.drawImage(seaGlows[0],x-width*.5+drift*radius*.13,waterline+(h-waterline)*depth,width,2+depth*2)
    }
  }
  ctx.globalAlpha=1
}
function drawLighthouseBeam(){
  if(!lighthouse)return
  const {x,y}=lighthouse
  const sweep=Math.sin(time*.4), length=sweep*w*.46
  const beam=ctx.createLinearGradient(x,y,x+length+.01,y)
  beam.addColorStop(0,'#ffe5ac53');beam.addColorStop(1,'#ffe5ac00')
  ctx.globalAlpha=.21*Math.abs(sweep)
  ctx.fillStyle=beam
  ctx.beginPath();ctx.moveTo(x,y-1);ctx.lineTo(x+length,y-h*.021)
  ctx.lineTo(x+length,y+h*.011);ctx.lineTo(x,y+1);ctx.fill()
  ctx.globalAlpha=1
}
function drawSea(){
  for(const ripple of ripples){
    const angle=ripple.phase+time*ripple.speed
    const swell=(1+Math.sin(angle))*.5
    const x=ripple.x+Math.cos(angle)*1.25
    const y=ripple.y+Math.sin(angle*.8)*.65
    const width=ripple.length*(.78+swell*.45)
    ctx.globalAlpha=ripple.strength*swell*swell
    ctx.drawImage(seaGlows[ripple.warm?0:1],x-width*.5,y,width,2.5)
  }
  ctx.globalAlpha=1
}
function paint(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
  ctx.drawImage(base,0,0);ctx.scale(ratio,ratio)
  ctx.globalCompositeOperation='lighter'
  drawSea()
  drawLighthouseBeam()
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
      addShell(w*(.24+.26*lane+(Math.random()-.5)*.09),h*(.19+Math.random()*.23))
      if(lane===0)addShell(w*.77,h*.40,0,0,.57)
      nextLaunch=time+1.05+Math.random()*.48
    }
    paint()
  }
  frame=requestAnimationFrame(tick)
}
function resume(){
  if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick)}
}
export function burst(x=w*(.23+Math.random()*.54),y=h*(.20+Math.random()*.23)){
  addShell(x,y)
  paint()
}
document.addEventListener('visibilitychange',resume)
new ResizeObserver(resize).observe(canvas)
resize()
waterfront.addEventListener('load',()=>{paintWaterfront();paint()})
waterfront.src=new URL('./yantai-night.webp',import.meta.url)
resume()
