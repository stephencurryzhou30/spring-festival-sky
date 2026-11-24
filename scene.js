const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
let w, h, ratio, frame = 0, time = 0, last = 0
let shells = [], serial = 0, nextLaunch = 0
const tau = 2 * Math.PI
const palettes = [
  ['#ffe6aa','#ffb95e','#ee7840'], ['#ffe4e1','#ff899b','#c84e83'],
  ['#fff3c5','#e8bb64','#f79537'], ['#fff0cf','#97dfd5','#499fac']
]
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
  sky.addColorStop(0,'#100f22');sky.addColorStop(.53,'#25192e');sky.addColorStop(.86,'#743b48');sky.addColorStop(1,'#1c1526')
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
  addShell(w*.72,h*(w<650?.21:.34),1.75,0)
  addShell(w*.92,h*.43,2.42,1)
  nextLaunch=time+1.2;paint()
}
const patterns=['peony','ring','willow','fan','heart','spiral','palm']
function direction(pattern,i,count,rotation,rand){
  const fraction=(i+.5)/count
  const angle=fraction*tau
  const jitter=()=> (rand()-.5)*.06
  switch(pattern){
    case 'ring': {
      const band=i%2===0?1:.62
      const x=Math.cos(angle)*band, y=Math.sin(angle)*band
      return [x*.92-y*.18,y*.58+x*.29,y*.52]
    }
    case 'heart': {
      const y=13*Math.cos(angle)-5*Math.cos(2*angle)-2*Math.cos(3*angle)-Math.cos(4*angle)
      return [Math.sin(angle)**3+jitter(),-y/16+jitter(),jitter()]
    }
    case 'fan': {
      const ray=(i%9-4)*.29+Math.PI/2+jitter(), reach=.34+.76*fraction
      return [Math.cos(ray)*reach,-Math.sin(ray)*reach,jitter()]
    }
    case 'spiral': {
      const turn=fraction*tau*1.25+(i%3)*tau/3+rotation
      return [fraction*Math.cos(turn),fraction*Math.sin(turn),.3*Math.sin(turn)]
    }
    case 'palm': {
      const limb=(i%7)*tau/7+rotation+fraction*.32+jitter()
      return [fraction*Math.cos(limb),fraction*Math.sin(limb)-.3,.24*Math.cos(limb)]
    }
    default: {
      const z=1-2*fraction, azimuth=i*2.399963+rotation, ring=Math.sqrt(1-z*z)
      const speed=(i%6===0?.49:1)*(.84+.22*rand())
      return [Math.cos(azimuth)*ring*speed,Math.sin(azimuth)*ring*speed,z*speed]
    }
  }
}
function addShell(x,y,age=0,style=serial%patterns.length){
  const rand=random(++serial*8353), pattern=patterns[style]
  const palette=palettes[style%palettes.length]
  const radius=Math.min(w*(w<650?.29:.165),h*.3)*(pattern==='ring'?.85:1)
  const stars=[], count=w<650?145:232
  const rotation=rand()*tau
  for(let i=0;i<count;i++){
    const [dx,dy,dz]=direction(pattern,i,count,rotation,rand)
    stars.push({x:dx,y:dy,z:dz,life:1.4+rand()*1.1+(pattern==='willow'?.9:0),
      phase:rand()*tau,color:palette[Math.floor(rand()*palette.length)]})
  }
  shells.push({x,y,stars,radius,pattern,born:time-age,flight:.85,launchX:x-radius*.26,
    launchY:h*.85,glow:palette[1]})
  if(shells.length>7)shells.shift()
}
function drawShell(shell){
  const {x,y,radius,flight,pattern}=shell, age=time-shell.born
  if(age<flight){
    const travel=t=>1-(1-t)**1.8
    const t=Math.max(0,age/flight), f=travel(t), tail=travel(Math.max(0,t-.09))
    const px=shell.launchX+(x-shell.launchX)*f,py=shell.launchY+(y-shell.launchY)*f
    ctx.strokeStyle='#ffb663';ctx.lineWidth=1.3;ctx.beginPath()
    ctx.moveTo(shell.launchX+(x-shell.launchX)*tail,shell.launchY+(y-shell.launchY)*tail)
    ctx.lineTo(px,py);ctx.stroke();halo(ctx,px,py,7,'#ffdc92');return
  }
  const t=age-flight, glow=Math.exp(-2.7*t)
  ctx.globalAlpha=.31*glow;halo(ctx,x,y,radius*1.45,shell.glow)
  ctx.globalAlpha=glow;halo(ctx,x,y,Math.max(2,17*glow),'#fff1b4')
  const travel=u=>1-Math.exp(-1.9*u)
  const distance=travel(t), droop=pattern==='willow'?.21:pattern==='palm'?.17:.085
  for(const star of shell.stars){
    if(t>=star.life)continue
    const depth=1/(1-.22*star.z*distance)
    const px=x+star.x*radius*distance*depth,py=y+(star.y*distance+droop*t*t)*radius*depth
    const back=Math.max(0,t-(pattern==='willow'?.38:.13)*(1+.35*t)),d=travel(back),bd=1/(1-.22*star.z*d)
    const tx=x+star.x*radius*d*bd,ty=y+(star.y*d+droop*back*back)*radius*bd
    const fade=Math.min(1,(star.life-t)*1.7),shine=.7+.3*Math.sin(t*13+star.phase)
    ctx.strokeStyle=star.color;ctx.lineWidth=(.8+.52*(star.z+1))*fade+.2
    ctx.globalAlpha=fade*(.43+.19*(star.z+1))*shine
    ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo((tx+px)*.5,(ty+py)*.5-.7,px,py);ctx.stroke()
    ctx.globalAlpha=fade*shine;ctx.fillStyle=star.z>.1?'#fff3c9':star.color
    ctx.fillRect(px-.65,py-.65,depth*1.5,depth*1.5)
  }
  // Broken bands on the water follow the color and decay of each bloom.
  for(let i=0;i<18;i++){
    const k=i/18
    ctx.globalAlpha=Math.exp(-1.7*t)*.25*(1-k)
    ctx.fillStyle=shell.glow
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
  if(now-last>=30){
    time+=Math.min(.08,(now-last)/1000);last=now
    shells=shells.filter(s=>time-s.born<4.4)
    if(time>=nextLaunch){burst();nextLaunch=time+1.5+Math.random()*.8}
    paint()
  }
  frame=requestAnimationFrame(tick)
}
function resume(){
  if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick)}
}
export function burst(x=w*(.53+Math.random()*.37),y=h*(w<650?.13+Math.random()*.21:.18+Math.random()*.29)){
  addShell(x,y)
  paint()
}
document.addEventListener('visibilitychange',resume)
new ResizeObserver(resize).observe(canvas)
resize();resume()
