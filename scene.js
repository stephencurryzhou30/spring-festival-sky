const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const base = document.createElement('canvas')
let w, h, frame, paused = false, sparks = []
function random(seed) {
  let state = seed
  return () => ((state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296)
}
function firework(c,x,y,r,color,seed) {
  const rand = random(seed)
  c.save()
  c.translate(x,y)
  for(let i=0;i<100;i++){
    const a=i*.06283+rand()*.045, len=r*(.54+rand()*.46)
    const dx=Math.cos(a)*len, dy=Math.sin(a)*len
    for(let j=0;j<13;j++){
      const t=.13+j*.066, end=t+.036*rand()
      c.globalAlpha=(.25+.7*t)*(.6+rand()*.4)
      c.strokeStyle=i%5===0?'#fff3c3':color
      c.lineWidth=.6+rand()*1.1
      c.beginPath();c.moveTo(dx*t,dy*t+len*.13*t*t)
      c.lineTo(dx*end,dy*end+len*.13*end*end);c.stroke()
    }
  }
  c.restore()
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
  const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height
  const scale=Math.min(devicePixelRatio||1,2)
  canvas.width=base.width=Math.round(w*scale);canvas.height=base.height=Math.round(h*scale)
  const c=base.getContext('2d');c.scale(scale,scale)
  const rand=random(2027), mobile=w<650
  for(let i=0;i<240;i++){c.fillStyle='rgba(255,216,162,'+rand()*.65+')';c.fillRect(rand()*w,rand()*h,1.4,1.4)}
  firework(c,w*.73,h*(mobile?.18:.33),Math.min(w*.22,170),'#ffce80',23)
  firework(c,w*.91,h*(mobile?.41:.52),Math.min(w*.14,110),'#ff8f9e',31)
  firework(c,w*.49,h*.16,Math.min(w*.09,62),'#ec9a91',35)
  for(let i=0;i<13;i++){
    const x=(i+rand())*w/13,y=h*(.54+rand()*.3),s=.4+rand()*.6
    const glow=c.createRadialGradient(x,y,0,x,y,22*s);glow.addColorStop(0,'#ffa35760');glow.addColorStop(1,'#ffa35700')
    c.fillStyle=glow;c.fillRect(x-23*s,y-23*s,46*s,46*s);c.fillStyle='#e68a56'
    c.beginPath();c.moveTo(x-4*s,y-6*s);c.lineTo(x+4*s,y-6*s);c.lineTo(x+2.7*s,y+4*s);c.lineTo(x-2.7*s,y+4*s);c.fill()
  }
  for(let layer=0;layer<3;layer++){
    const y=h*(.86+layer*.043)
    c.fillStyle=['#662b40','#4f2035','#321324'][layer];c.beginPath();c.moveTo(0,h)
    for(let x=0;x<=w+6;x+=6)c.lineTo(x,y+12*Math.sin(x/90+layer)+6*Math.cos(x/38))
    c.lineTo(w,h);c.closePath();c.fill()
    if(layer===1){pavilion(c,w*.78,y+5,mobile?.83:1.32,3);pavilion(c,w*.93,y+7,.76,2);pavilion(c,w*.13,y+9,.63,2)}
  }
  paint(performance.now())
}
function paint(now){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0)
  ctx.scale(canvas.width/w,canvas.height/h)
  sparks=sparks.filter(p=>now-p.start<1700)
  for(const p of sparks){const t=(now-p.start)/1700, travel=(1-Math.exp(-3*t))*p.speed
    ctx.globalAlpha=Math.max(0,1-t);ctx.fillStyle=p.color
    ctx.beginPath();ctx.arc(p.x+Math.cos(p.a)*travel,p.y+Math.sin(p.a)*travel+48*t*t,2-t,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1
}
function tick(now){paint(now);frame=sparks.length&&!paused?requestAnimationFrame(tick):0}
export function burst(x=w*(.45+Math.random()*.48),y=h*(.1+Math.random()*.45)){
  if(paused){paint(performance.now());firework(ctx,x,y,65,'#ffcc86',Math.floor(Math.random()*999));return}
  const now=performance.now()
  for(let i=0;i<85;i++)sparks.push({x,y,a:i*.074,speed:40+Math.random()*105,start:now,color:['#ffd085','#ff819c','#fff0c1'][i%3]})
  sparks=sparks.slice(-600);if(!frame)frame=requestAnimationFrame(tick)
}
export function pause(value){paused=value;if(value){cancelAnimationFrame(frame);frame=0;sparks=[];paint(performance.now())}}
new ResizeObserver(resize).observe(canvas)
resize()
