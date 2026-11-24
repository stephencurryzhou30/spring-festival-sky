const origin = 'https://stephencurryzhou30.github.io'
const headers = {'Access-Control-Allow-Origin': origin, 'Cache-Control':'no-store'}
const reply = (value, status = 200) => Response.json(value, {status, headers})
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/wishes') return reply({error:'地址无效'}, 404)
    if (request.method === 'OPTIONS') return new Response(null, {headers:{
      ...headers, 'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type'
    }})
    if (request.method === 'GET') {
      const before = Number(url.searchParams.get('before') || Number.MAX_SAFE_INTEGER)
      if (!Number.isSafeInteger(before) || before < 1) return reply({error:'页码无效'},400)
      const {results} = await env.DB.prepare('SELECT id,nickname,message FROM wishes WHERE id < ? ORDER BY id DESC LIMIT 101').bind(before).all()
      const items = results.slice(0,100)
      return reply({items, next:results.length > 100 ? items.at(-1).id : null})
    }
    if (request.method !== 'POST') return reply({error:'请求方式无效'},405)
    if (request.headers.get('Origin') !== origin) return reply({error:'请从春节网页发送'},403)
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({error:'数据格式无效'},415)
    if (Number(request.headers.get('Content-Length')) > 2048) return reply({error:'留言太长'},413)
    const data = await request.json().catch(()=>null)
    if (typeof data?.message !== 'string' || typeof data.nickname !== 'string' ||
        !/^[a-f\d-]{36}$/i.test(data.requestId)) return reply({error:'留言格式无效'},400)
    const message = data.message.trim().replace(/\s+/g,' ')
    const nickname = data.nickname.trim().replace(/\s+/g,' ') || '匿名朋友'
    if (!message || message.length > 80 || nickname.length > 16) return reply({error:'祝福限 1 至 80 字，昵称限 16 字'},400)
    const {success} = await env.POST_LIMIT.limit({key:request.headers.get('CF-Connecting-IP') || 'local'})
    if (!success) return reply({error:'发送得太快，请一分钟后再试'},429)
    await env.DB.prepare('INSERT INTO wishes (request_id,nickname,message) VALUES (?,?,?) ON CONFLICT(request_id) DO NOTHING').bind(data.requestId,nickname,message).run()
    const row = await env.DB.prepare('SELECT id,nickname,message FROM wishes WHERE request_id=?').bind(data.requestId).first()
    return reply(row,201)
  }
}
