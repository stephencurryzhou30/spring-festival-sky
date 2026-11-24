import {burst,pause} from './scene.js'
const $ = id => document.getElementById(id)
const repo='stephencurryzhou30/spring-festival-sky', prefix='【新春祝福】'
let messages=[], visibleCount=24, busy=false, cursor=0
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches
const greetings=['花火来信 · 新春快乐！','花火来信 · 愿你所遇皆暖','花火来信 · 岁岁常欢愉']
function showBubble(){
  if(paused||document.hidden)return
  const pool=messages.length?messages:greetings
  const chip=document.createElement('span');chip.className='bubble';const item=pool[cursor%pool.length];chip.textContent=typeof item==='string'?item:item.user.login+' · '+item.title.slice(prefix.length)
  chip.style.top=(cursor%3)*7+3+'%';cursor++;$('stream').append(chip)
  chip.addEventListener('animationend',()=>chip.remove(),{once:true})
}
function render(){
  $('cards').replaceChildren(...messages.slice(0,visibleCount).map(m=>{
    const card=document.createElement('article'), by=document.createElement('small'), body=document.createElement('p')
    by.textContent='@'+m.user.login;body.textContent=m.title.slice(prefix.length);card.append(by,body);return card
  }))
  $('status').textContent=messages.length?'已收到 '+messages.length+' 条祝福':'还没有来信，来送出第一句新春祝福吧。'
  $('more').hidden=visibleCount>=messages.length
}
async function load(){
  if(busy)return
  busy=true;$('refresh').disabled=true
  try{
    const res=await fetch('./wishes.json',{cache:'no-cache',signal:AbortSignal.timeout(12000)})
    if(!res.ok)throw Error('读取失败')
    const fresh=await res.json(), first=fresh[0]?.id, previous=messages[0]?.id
    messages=fresh;render()
    if(first&&first!==previous)showBubble()
  }catch{$('status').textContent='暂时无法读取祝福，请稍后刷新。'}
  finally{busy=false;$('refresh').disabled=false}
}
function setMotion(){pause(paused);$('motion').setAttribute('aria-pressed',String(paused));$('motion').textContent=paused?'开启动效':'暂停动效';if(paused)$('stream').replaceChildren();else showBubble()}
$('motion').onclick=()=>{paused=!paused;setMotion()}
$('burst').onclick=()=>burst()
$('sky').onclick=e=>{if(e.target!==$('sky'))return;const box=e.currentTarget.getBoundingClientRect();burst(e.clientX-box.left,e.clientY-box.top)}
$('refresh').onclick=()=>load();$('more').onclick=()=>{visibleCount+=24;render()}
$('write').onclick=()=>{$('composer').showModal();$('wish').focus()}
function updateLink(){
  const wish=$('wish').value.trim().replace(/\s+/g,' ')
  $('length').textContent=$('wish').value.length
  $('send').setAttribute('aria-disabled',String(!wish))
  if(wish){const url=new URL('https://github.com/'+repo+'/issues/new');url.searchParams.set('title',prefix+wish);url.searchParams.set('body','🧧 来自花火来信的新春祝福');$('send').href=url.href}
  else $('send').removeAttribute('href')
}
$('wish').oninput=updateLink
$('send').onclick=e=>{if(!$('wish').value.trim()){e.preventDefault();$('wish').focus();return}$('composer').close()}
updateLink();setMotion();load()
setInterval(showBubble,6000)
setInterval(()=>{if(!paused&&!document.hidden)burst()},5800)
setInterval(()=>{if(!document.hidden)load()},60000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()})

