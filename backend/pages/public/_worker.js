export default {
  fetch(request, env) {
    if (new URL(request.url).pathname === '/wishes') return env.WISHES.fetch(request)
    return new Response('Not found', { status: 404 })
  }
}
