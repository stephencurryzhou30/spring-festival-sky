const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
let w, h, ratio, lighthouse, frame = 0, time = 0, last = 0
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
function drawVilla(c,x,y,width,height){
  c.save()
  c.translate(x,y)
  const stone=c.createLinearGradient(0,-height,0,0)
  stone.addColorStop(0,'#916455');stone.addColorStop(1,'#382938')
  c.fillStyle=stone;c.fillRect(0,-height,width,height)
  silhouette(c,[[-4,-height],[width*.18,-height-9],[width*.79,-height-9],[width+4,-height]],'#683944','#ca8671')
  c.fillStyle='#d8a784b0';c.fillRect(0,-height,width,1.2)
  c.fillRect(0,-height*.45,width,.8)
  for(let window=6;window<width-5;window+=9){
    c.fillStyle='#ffd49b99'
    c.beginPath();c.roundRect(window,-height+4,3,5,[1.4,1.4,0,0]);c.fill()
    c.fillRect(window,-6,3,3)
  }
  c.restore()
}

function drawYantai(c,width,height,shore,rand){
  const scale=Math.min(width/820,height/510,1.85)
  const left=-width/(2*scale),right=-left
  c.save()
  c.translate(width*.5,shore);c.scale(scale,scale)
  halo(c,170,-28,200,'#e89d7238')

  // The far shore and modern waterfront sit behind the wooded headland.
  c.beginPath();c.moveTo(left,0);c.lineTo(left,-19)
  c.bezierCurveTo(-165,-40,-110,-22,-61,-16)
  c.bezierCurveTo(34,-38,92,-29,147,-22)
  c.bezierCurveTo(241,-48,right-90,-31,right,-37)
  c.lineTo(right,0);c.closePath();c.fillStyle='#4d3650';c.fill()
  for(let x=-4;x<right;x+=13+rand()*12){
    const towerHeight=12+rand()*29, towerWidth=9+rand()*11
    c.fillStyle='#32263e';c.fillRect(x,-towerHeight,towerWidth,towerHeight)
    for(let y=-towerHeight+4;y<0;y+=4){
      c.fillStyle=rand()>.35?'#fbd19881':'#c28eb254'
      c.fillRect(x+2,y,towerWidth-4,.85)
    }
  }
  silhouette(c,[[164,0],[164,-113],[171,-119],[189,-119],[189,0]],'#353452','#ad8299')
  c.fillStyle='#d6b3dd82'
  for(let y=-111;y<-4;y+=4)c.fillRect(168,y,17,1)
  c.fillStyle='#f7af90';c.fillRect(169,-120,17,1.4)

  // Yantai Hill rises directly out of Zhifu Bay.
  c.beginPath();c.moveTo(left,0);c.lineTo(left,-42)
  c.bezierCurveTo(-330,-56,-313,-86,-270,-98)
  c.bezierCurveTo(-245,-115,-223,-122,-199,-121)
  c.bezierCurveTo(-149,-124,-133,-92,-113,-75)
  c.bezierCurveTo(-88,-58,-73,-41,-51,-30)
  c.quadraticCurveTo(-15,-19,2,0);c.closePath()
  const hill=c.createLinearGradient(0,-122,0,0)
  hill.addColorStop(0,'#342e42');hill.addColorStop(1,'#201f35')
  c.fillStyle=hill;c.fill()
  for(let i=0;i<125;i++){
    const x=-345+rand()*301,y=-22-rand()*26-Math.max(0,1-Math.abs(x+208)/150)*54
    c.fillStyle=rand()>.45?'#524154':'#28283c'
    c.beginPath();c.ellipse(x,y,2+rand()*5,1+rand()*4,0,0,tau);c.fill()
  }
  for(const villa of [[-331,-28,57,27],[-277,-44,48,23],[-163,-39,56,29],[-108,-19,51,24],[31,0,67,26],[105,0,49,20]]){
    drawVilla(c,...villa)
  }
  c.strokeStyle='#e6a17c8c';c.lineWidth=1
  c.beginPath();c.moveTo(left,-4);c.bezierCurveTo(-276,-16,-76,5,4,-2)
  c.lineTo(right,-2);c.stroke()
  for(let x=left+9;x<right;x+=20){
    c.fillStyle='#d69375';c.fillRect(x,-7,1,5)
    halo(c,x,-7,4,'#ffd0a68a')
  }

  // The ivory lighthouse has a broad, stone fort-style base.
  c.save();c.translate(-212,-116)
  silhouette(c,[[-30,0],[-26,-20],[-20,-20],[-20,-16],[20,-16],[20,-20],[26,-20],[30,0]],'#907783','#e0ad93')
  c.fillStyle='#503c52';c.fillRect(-22,-7,44,2)
  const limestone=c.createLinearGradient(-13,0,13,0)
  limestone.addColorStop(0,'#a08996');limestone.addColorStop(.46,'#ffedc9');limestone.addColorStop(1,'#b89da2')
  silhouette(c,[[-12,-15],[-8,-94],[8,-94],[12,-15]],limestone,'#f9d7b2')
  for(let y=-84;y<-20;y+=12){c.fillStyle='#806d7f';c.fillRect(-1.3,y,2.6,4.5)}
  silhouette(c,[[-13,-94],[-10,-99],[10,-99],[13,-94]],'#dac0ae','#ffe7c0')
  c.fillStyle='#ffdfa0';c.fillRect(-7.5,-111,15,12)
  c.fillStyle='#b0827f'
  for(let x=-6;x<8;x+=4)c.fillRect(x,-111,1,12)
  silhouette(c,[[-11,-111],[-7,-117],[7,-117],[11,-111]],'#7c5562','#ffcea4')
  c.fillStyle='#ffd7ab';c.fillRect(-.5,-122,1,5)
  halo(c,0,-105,15,'#ffdc9e85')
  c.restore()
  c.restore()
  return {x:width*.5-212*scale,y:shore-221*scale,scale}
}

function resize(){
  const rect=canvas.getBoundingClientRect()
  if(w===rect.width && h===rect.height)return
  w=rect.width;h=rect.height;ratio=Math.min(devicePixelRatio||1,1.6)
  canvas.width=base.width=Math.round(w*ratio);canvas.height=base.height=Math.round(h*ratio)
  const c=base.getContext('2d');c.scale(ratio,ratio)
  const rand=random(2718), horizon=h*.86
  const sky=c.createLinearGradient(0,0,0,h)
  sky.addColorStop(0,'#181428');sky.addColorStop(.56,'#37213b');sky.addColorStop(.86,'#754651');sky.addColorStop(1,'#241b31')
  c.fillStyle=sky;c.fillRect(0,0,w,h)
  for(let i=0;i<200;i++){
    c.fillStyle='rgba(255,227,195,'+(rand()*.55)+')'
    c.fillRect(rand()*w,rand()*h*.8,1,1)
  }
  halo(c,w*.57,horizon,Math.min(w*.73,h*.76),'#f89c7546')
  lighthouse=drawYantai(c,w,h,horizon,rand)
  const water=c.createLinearGradient(0,horizon,0,h)
  water.addColorStop(0,'#392e45');water.addColorStop(1,'#101728')
  c.fillStyle=water;c.fillRect(0,horizon,w,h-horizon)
  for(let i=0;i<620;i++){
    const x=rand()*w,y=rand(),len=1+rand()*(1+y*14)
    c.fillStyle='rgba(237,151,99,'+(rand()*.17*(1-y*.65))+')'
    c.fillRect(x,horizon+y*(h-horizon),len,.8)
  }
  for(const [building,color] of [[-303,'#efad83'],[-212,'#ffda9d'],[-106,'#e9ad87'],[54,'#ffbf94'],[171,'#c1a8dd'],[262,'#e8b2b9']]){
    const center=w*.5+building*lighthouse.scale
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
function drawLighthouseBeam(){
  const {x,y,scale}=lighthouse
  const sweep=Math.sin(time*.54), direction=sweep<0?-1:1
  const reach=Math.max(35,w*.54*Math.abs(sweep))
  const beam=ctx.createLinearGradient(x,y,x+direction*reach,y)
  beam.addColorStop(0,'#ffe3b464');beam.addColorStop(1,'#ffe3b400')
  ctx.globalAlpha=.3+.32*Math.abs(sweep)
  silhouette(ctx,[[x,y-scale],[x+direction*reach,y-16*scale],[x+direction*reach,y+8*scale],[x,y+scale]],beam)
  ctx.globalAlpha=1
}
function drawHarborBoat(){
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
  drawLighthouseBeam()
  for(const shell of shells){ctx.globalAlpha=1;drawShell(shell)}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'
  drawHarborBoat()
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
