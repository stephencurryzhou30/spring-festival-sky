import {burst} from './scene.js'
const $ = id => document.getElementById(id)
const endpoint='https://spring-festival-wishes.stephencurryzhou30-festival.workers.dev/wishes'
const prefix='【新春祝福】'
let messages=[], visibleCount=24, busy=false, cursor=0
const greetings=['新春快乐！','愿你所遇皆暖','岁岁常欢愉']
function showBubble(immediate){
  if(document.hidden)return
  const pool=messages.length?messages:greetings
  const chip=document.createElement('span');chip.className='bubble';const item=immediate??pool[cursor%pool.length];chip.textContent=typeof item==='string'?item:'匿名 · '+item.message
  chip.style.top=(cursor%3)*7+3+'%';cursor++;$('stream').append(chip)
  chip.addEventListener('animationend',()=>chip.remove(),{once:true})
}
function render(){
  $('cards').replaceChildren(...messages.slice(0,visibleCount).map(m=>{
    const card=document.createElement('article'), by=document.createElement('small'), body=document.createElement('p')
    by.textContent='匿名';body.textContent=m.message;card.append(by,body);return card
  }))
  $('status').textContent=messages.length?'已收到 '+messages.length+' 条祝福':'还没有来信，来送出第一句新春祝福吧。'
  $('more').hidden=visibleCount>=messages.length
}
async function readJson(url){
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)})
  if(!response.ok)throw Error('读取失败')
  return response.json()
}
let archive=[], live=[], revision=0
async function readLive(){
  let url=endpoint
  const rows=[]
  while(url){
    const page=await readJson(url)
    rows.push(...page.items)
    url=page.next?endpoint+'?before='+page.next:null
  }
  return rows
}
function combine(){messages=[...live,...archive];render()}
async function load(){
  if(busy)return
  busy=true;$('refresh').disabled=true
  const started=revision
  try{
    const [current,old]=await Promise.allSettled([readLive(),readJson('./wishes.json')])
    const previous=live[0]?.id
    if(current.status==='fulfilled'&&started===revision)live=current.value
    if(old.status==='fulfilled')archive=old.value.map(m=>({id:'github-'+m.id,message:m.title.slice(prefix.length)}))
    combine()
    if(current.status==='rejected'||old.status==='rejected')$('status').textContent='部分祝福暂时无法读取，请稍后刷新。'
    if(live[0]&&live[0].id!==previous)showBubble(live[0])
  }finally{busy=false;$('refresh').disabled=false}
}
$('burst').onclick=()=>burst()
$('sky').onclick=e=>{if(e.target!==$('sky'))return;const box=e.currentTarget.getBoundingClientRect();burst(e.clientX-box.left,e.clientY-box.top)}
$('refresh').onclick=()=>load();$('more').onclick=()=>{visibleCount+=24;render()}
$('write').onclick=()=>{$('composer').showModal();$('wish').focus()}
let sending=false, requestId=crypto.randomUUID()
function updateComposer(){
  $('send').disabled=sending||!$('wish').value.trim()
}
function editDraft(){requestId=crypto.randomUUID();updateComposer()}
$('wish').oninput=editDraft
$('send').onclick=async()=>{
  if(sending||!$('wish').value.trim())return
  sending=true;updateComposer()
  $('wish').readOnly=true
  $('feedback').textContent='正在送上夜空…'
  try{
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:$('wish').value,requestId}),
      signal:AbortSignal.timeout(15000)})
    const data=await response.json()
    if(!response.ok){$('feedback').textContent=data.error||'发送失败，请重试。';return}
    revision++
    live=[data,...live.filter(m=>m.id!==data.id)]
    combine();showBubble(data)
    $('wish').value='';requestId=crypto.randomUUID()
    $('composer').close()
    $('status').textContent='你的祝福已送达，所有人都能看到。'
    $('feedback').textContent=''
  }catch{$('feedback').textContent='暂时无法确认是否送达，请重试。'}
  finally{sending=false;$('wish').readOnly=false;updateComposer()}
}
updateComposer();showBubble();load()
setInterval(showBubble,6000)

setInterval(()=>{if(!document.hidden)load()},20000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()})


