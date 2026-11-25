const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
let w, h, ratio, frame = 0, time = 0, last = 0
let shells = [], serial = 0, patternIndex = 0, nextLaunch = 0
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
function random(seed) {
  let state=seed
  return () => ((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296)
}
function halo(c,x,y,r,color) {
  const g=c.createRadialGradient(x,y,0,x,y,r)
  g.addColorStop(0,color);g.addColorStop(1,'transparent')
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)
}
function silhouette(c, points, fill, edge){
  c.beginPath()
  c.moveTo(...points[0])
  for(const point of points.slice(1))c.lineTo(...point)
  c.closePath()
  c.fillStyle=fill
  c.fill()
  if(edge){c.strokeStyle=edge;c.lineWidth=1;c.stroke()}
}
function drawShanghai(c,w,h,shore,rand){
  const scale=Math.min(w/860,h/520,1.8)
  c.save()
  c.translate(w*.5,shore)
  c.scale(scale,scale)
  const facade='#23162d', edge='#a06678', gold='#ffcf89'
  for(const [x,y,color] of [[-98,-60,'#ff828c25'],[162,-62,'#a28aff22'],[257,-90,'#ffc49620']])halo(c,x,y,114,color)
  for(let x=-w/(2*scale);x<w/(2*scale);){
    const width=16+rand()*26, height=23+rand()*43
    c.fillStyle=rand()>.5?'#3e273e':'#311f35'
    c.fillRect(x,-height,width,height)
    c.fillStyle='#1f192f'
    c.fillRect(x+width*.73,-height,width*.27,height)
    c.fillStyle='#d4907e61'
    c.fillRect(x+2,-height,width-4,1)
    c.fillRect(x+width*.26,-height-4,width*.41,4)
    c.fillStyle='#efa68086'
    for(let y=-height+6;y<-4;y+=7){
      for(let column=4;column<width-3;column+=7){
        if(rand()>.46)c.fillRect(x+column,y,2,2)
      }
    }
    x+=width+3+rand()*7
  }

  // Shanghai Tower's turning glass facade.
  c.beginPath();c.moveTo(216,0);c.bezierCurveTo(211,-43,238,-145,246,-235)
  c.quadraticCurveTo(253,-246,267,-243);c.bezierCurveTo(281,-167,272,-68,285,0)
  c.closePath()
  c.save();c.clip()
  const glass=c.createLinearGradient(210,0,285,0)
  glass.addColorStop(0,facade);glass.addColorStop(.66,'#72506d');glass.addColorStop(1,'#382a3e')
  c.fillStyle=glass;c.fillRect(210,-248,80,249)
  for(let y=-238;y<0;y+=5){
    c.fillStyle=y%3===0?'#ffcd967c':'#dda2be36'
    c.fillRect(215,y,71,1)
    for(let x=223;x<284;x+=6){
      if(rand()>.64)c.fillRect(x,y+1,3,2)
    }
  }
  c.strokeStyle='#ffd298b8';c.lineWidth=2
  c.beginPath();c.moveTo(245,-245);c.bezierCurveTo(286,-164,221,-84,274,0);c.stroke()
  c.restore()
  c.strokeStyle=edge;c.lineWidth=1;c.stroke()

  // The open crown of the World Financial Center.
  silhouette(c,[[133,0],[145,-201],[179,-201],[187,0]],'#342b49',edge)
  for(let y=-193;y<0;y+=7){c.fillStyle='#d8b2ec58';c.fillRect(145-(y+193)*.04,y,36,1)}
  silhouette(c,[[150,-194],[174,-194],[172,-179],[153,-179]],'#44203a','#e0b8cf')
  c.fillStyle='#f4c4e38c';c.fillRect(146,-174,31,1.4)
  c.strokeStyle='#b3acf376';c.lineWidth=.7
  for(let x=149;x<180;x+=7){
    c.beginPath();c.moveTo(x,-171);c.lineTo(x+(x-164)*.3,0);c.stroke()
  }

  // Jin Mao Tower's stacked, illuminated setbacks.
  for(let level=0;level<9;level++){
    const height=30-level*1.6, half=28-level*2.7, y=-level*17
    silhouette(c,[[98-half,y],[98-half+2,y-height],[98+half-2,y-height],[98+half,y]],facade,edge)
    c.fillStyle='#deb281a8';c.fillRect(100-half,y-height+2,2*half-4,1.6)
  }
  c.fillStyle=gold;c.fillRect(97,-175,2,24)

  // Oriental Pearl Tower, with three observation spheres and tripod supports.
  c.strokeStyle='#e2a2ac';c.lineWidth=2
  c.beginPath();c.moveTo(-122,0);c.lineTo(-98,-117);c.lineTo(-74,0);c.stroke()
  c.fillStyle='#f4c1b4';c.fillRect(-102,-183,8,184);c.fillRect(-99,-218,2,38)
  for(const [y,radius] of [[-45,25],[-118,19],[-177,8]]){
    halo(c,-98,y,radius*1.65,'#ff899d6a')
    const sphere=c.createRadialGradient(-103,y-radius*.34,1,-98,y,radius)
    sphere.addColorStop(0,'#ffe0bb');sphere.addColorStop(.49,'#d67893');sphere.addColorStop(1,'#67395d')
    c.fillStyle=sphere;c.beginPath();c.ellipse(-98,y,radius,radius*.83,0,0,tau);c.fill()
    c.strokeStyle='#ffd1ac';c.lineWidth=1.3
    c.beginPath();c.ellipse(-98,y,radius,3.5,0,0,tau);c.stroke()
  }

  // Bund facades frame the river with cornices, arched windows and a clock tower.
  for(const [x,width,height] of [[-381,64,40],[-317,56,47],[-261,83,44],[-178,62,35],[-34,57,33]]){
    const stone=c.createLinearGradient(x,-height,x,0)
    stone.addColorStop(0,'#81514b');stone.addColorStop(1,'#3d2836')
    c.fillStyle=stone;c.fillRect(x,-height,width,height)
    c.fillStyle='#e6a875';c.fillRect(x,-height,width,2);c.fillRect(x,-height/2,width,1)
    silhouette(c,[[x+3,-height],[x+width*.5,-height-7],[x+width-3,-height]],'#644051','#bc856d')
    c.fillStyle='#291e31';c.fillRect(x+width-2,-height+2,2,height-2)
    for(let dx=7;dx<width-4;dx+=10){
      c.fillStyle='#ffce86a8'
      c.beginPath();c.roundRect(x+dx,-height+7,4,9,[2,2,0,0]);c.fill()
      c.fillRect(x+dx,-height/2+4,4,6)
      c.fillStyle='#cf91775e';c.fillRect(x+dx-2,-height+5,1,height-7)
    }
  }
  silhouette(c,[[-232,-44],[-232,-86],[-225,-86],[-225,-97],[-218,-103],[-211,-97],[-211,-86],[-204,-86],[-204,-44]],'#5c383f','#d69a6e')
  c.fillStyle=gold;c.beginPath();c.arc(-218,-75,5,0,tau);c.fill()
  c.strokeStyle='#59364b';c.beginPath();c.moveTo(-218,-78);c.lineTo(-218,-75);c.lineTo(-215,-75);c.stroke()
  const left=-w/(2*scale)
  c.fillStyle='#291c2e';c.fillRect(left,-4,w/scale,4)
  c.fillStyle='#ffbb797e';c.fillRect(left,-1,w/scale,1.5)
  for(let x=left+8;x<-110;x+=24){
    c.fillStyle='#ecb080';c.fillRect(x,-9,1,6)
    halo(c,x,-9,5,'#ffd39982')
  }
  c.restore()
  return scale
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
  halo(c,w*.57,horizon,Math.min(w*.73,h*.76),'#f89c7546')
  const cityScale=drawShanghai(c,w,h,horizon,rand)
  const water=c.createLinearGradient(0,horizon,0,h)
  water.addColorStop(0,'#402535');water.addColorStop(1,'#140f1f')
  c.fillStyle=water;c.fillRect(0,horizon,w,h-horizon)
  for(let i=0;i<620;i++){
    const x=rand()*w,y=rand(),len=1+rand()*(1+y*14)
    c.fillStyle='rgba(237,151,99,'+(rand()*.17*(1-y*.65))+')'
    c.fillRect(x,horizon+y*(h-horizon),len,.8)
  }
  for(const [building,color] of [[-317,'#fcb479'],[-218,'#ffd19a'],[-98,'#f489aa'],[98,'#ffbb8e'],[163,'#bca5ef'],[254,'#e5b1d7']]){
    const center=w*.5+building*cityScale
    for(let i=0;i<29;i++){
      const distance=rand(), width=(3+distance*24)*rand()
      c.globalAlpha=(1-distance)*.35
      c.fillStyle=color
      c.fillRect(center+(rand()-.5)*(8+distance*44),horizon+distance*(h-horizon),width,1)
    }
  }
  c.globalAlpha=1
  shells=[]
  addShell(w*.62,h*.33,1.52,0)
  addShell(w*.25,h*.52,1.68,1,.76)
  addShell(w*.41,h*.20,2.03,3,.46)
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
    const brush=layers[near?1:0].brush
    rays.push({dx,dy,bend,z,tint,phase})
    brush.strokeStyle=tint
    const segments=shape==='willow'?18:13
    for(let j=0;j<segments;j++){
      const t=.12+j*.83/segments
      const end=t+(shape==='strobe'?.016:.035)*(.55+rand()*.62)
      brush.globalAlpha=(.24+.75*t)*(.52+rand()*.43)*(near?1:.58)
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
  const fade=Math.min(1,t*9)*Math.max(0,1-Math.max(0,t-.9)/2.25)**1.3
  if(fade<=0)return
  const scale=radius*expansion/212
  const fall=radius*(.023+bloom.hang*.18)*t*t
  ctx.globalAlpha=.28*Math.exp(-2.6*t)
  halo(ctx,x,y,radius*1.07,bloom.color)
  ctx.globalAlpha=.75*Math.exp(-11*t)
  halo(ctx,x,y,4+radius*.1,'#fff1c5')

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
function drawRiverBoat(){
  const size=Math.min(w/780,h/560,1.25)
  const x=(((time*.016+.28)%1)*1.16-.08)*w, y=h*.918
  ctx.save()
  ctx.translate(x,y);ctx.scale(size,size)
  const wake=ctx.createLinearGradient(-100,0,0,0)
  wake.addColorStop(0,'transparent');wake.addColorStop(1,'#e9a77c90')
  ctx.strokeStyle=wake;ctx.lineWidth=.85
  ctx.beginPath();ctx.moveTo(-97,4);ctx.quadraticCurveTo(-54,7,9,2);ctx.stroke()
  silhouette(ctx,[[-30,-3],[29,-3],[22,3],[-25,3]],'#261b2f','#f1bb89')
  silhouette(ctx,[[-22,-3],[-19,-11],[12,-11],[21,-3]],'#4b3246','#be8b7d')
  ctx.fillStyle='#ffdb9d'
  for(let x=-16;x<=12;x+=5)ctx.fillRect(x,-9,3,3)
  halo(ctx,23,-5,5,'#ffd0a274')
  ctx.restore()
}
function paint(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
  ctx.drawImage(base,0,0);ctx.scale(ratio,ratio);ctx.globalCompositeOperation='lighter'
  for(const shell of shells){ctx.globalAlpha=1;drawShell(shell)}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
  drawRiverBoat()
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
