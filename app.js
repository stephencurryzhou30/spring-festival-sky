import {burst} from './scene.js?v=yantai-waterfront'
const $ = id => document.getElementById(id)
const endpoint='https://spring-festival-wishes-zhou.pages.dev/wishes'
const prefix='【新春祝福】'
let messages=[], visibleCount=24, busy=false, cursor=0
const greetings=['新春快乐！','愿你所遇皆暖','岁岁常欢愉']
function showBubble(immediate){
  if(document.hidden)return
  const pool=messages.length?messages:greetings
  const chip=document.createElement('span');chip.className='bubble';const item=immediate??pool[cursor%pool.length];chip.textContent=typeof item==='string'?item:item.message
  chip.style.top=(cursor%3)*7+3+'%';cursor++;$('stream').append(chip)
  chip.addEventListener('animationend',()=>chip.remove(),{once:true})
}
function render(){
  $('cards').replaceChildren(...messages.slice(0,visibleCount).map(m=>{
    const card=document.createElement('article'), by=document.createElement('small'), body=document.createElement('p')
    by.textContent='匿名';body.textContent=m.message;card.append(by,body);return card
  }))
  $('more').hidden=visibleCount>=messages.length
  renderStatus()
}
function renderStatus(){
  if(liveUnavailable||archiveUnavailable){
    $('status').textContent=messages.length?'已显示 '+messages.length+' 条祝福，部分留言暂时无法同步。':'暂时连不上留言服务，网页会自动重试。'
  }else if(messages.length){
    $('status').textContent='已收到 '+messages.length+' 条祝福'
  }else{
    $('status').textContent=liveChecked?'还没有人留言，来送出第一句祝福吧。':'正在收取祝福…'
  }
}
async function readJson(url){
  const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)})
  if(!response.ok)throw Error('读取失败')
  return response.json()
}
let archive=[], live=[], revision=0, archiveChecked=0
async function readLive(){
  const first=await readJson(endpoint)
  const boundary=live.findIndex(wish=>wish.id===first.next)
  if(first.next&&boundary>=0)return [...first.items,...live.slice(boundary+1)]
  const rows=first.items.slice()
  let before=first.next
  while(before){
    const page=await readJson(endpoint+'?before='+before)
    rows.push(...page.items)
    before=page.next
  }
  return rows
}
async function readArchive(){
  if(Date.now()-archiveChecked<60000)return archive
  const rows=await readJson('./wishes.json')
  archiveChecked=Date.now()
  return rows.map(wish=>({id:'github-'+wish.id,message:wish.title.slice(prefix.length)}))
}
let liveUnavailable=false, archiveUnavailable=false, liveChecked=false
function combine(){
  const next=[...live,...archive]
  if(next.length===messages.length&&next.every((wish,index)=>wish.id===messages[index].id&&wish.message===messages[index].message)){
    renderStatus()
    return
  }
  messages=next
  render()
}
async function load(){
  if(busy)return
  busy=true
  const started=revision
  try{
    await Promise.all([
      readLive().then(rows=>{
        const previous=live[0]?.id
        if(started===revision)live=rows
        liveChecked=true
        liveUnavailable=false
        if(live[0]&&live[0].id!==previous)showBubble(live[0])
      },()=>{liveUnavailable=true}).then(combine),
      readArchive().then(rows=>{
        archive=rows
        archiveUnavailable=false
      },()=>{archiveUnavailable=true}).then(combine)
    ])
  }finally{busy=false}
}
$('burst').onclick=()=>burst()
$('sky').onclick=e=>{if(e.target!==$('sky'))return;const box=e.currentTarget.getBoundingClientRect();burst(e.clientX-box.left,e.clientY-box.top)}
$('more').onclick=()=>{visibleCount+=24;render()}
$('write').onclick=()=>{$('composer').showModal();$('wish').focus()}
let sending=false, deliveryTimer, requestId=crypto.randomUUID()
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
    $('delivery').textContent='祝福已送达'
    clearTimeout(deliveryTimer)
    deliveryTimer=setTimeout(()=>$('delivery').textContent='',3500)
    $('feedback').textContent=''
  }catch{$('feedback').textContent='暂时连不上留言服务，无法确认送达。你的留言还在输入框里。'}
  finally{sending=false;$('wish').readOnly=false;updateComposer()}
}
updateComposer();showBubble();load()
setInterval(showBubble,6000)

setInterval(()=>{if(!document.hidden)load()},3000)
document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()})
