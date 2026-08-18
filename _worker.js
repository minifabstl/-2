export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Kayıt API'si
    if (url.pathname === '/api/register' && request.method === 'POST') {
      try {
        const body = await request.json();
        const emailKey = `user:${body.email.toLowerCase()}`;

        if (env.USERS_KV) {
          await env.USERS_KV.put(emailKey, JSON.stringify(body));

          let allUsers = [];
          const existingList = await env.USERS_KV.get('all_users');
          if (existingList) {
            allUsers = JSON.parse(existingList);
          }
          allUsers = allUsers.filter(u => u.email !== body.email);
          allUsers.push(body);
          await env.USERS_KV.put('all_users', JSON.stringify(allUsers));
        }

        return new Response(JSON.stringify({ success: true, message: 'Cloudflare KV veritabanına kaydedildi' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. Kullanıcı Listesi API'si
    if (url.pathname === '/api/users' && request.method === 'GET') {
      try {
        let users = [];
        if (env.USERS_KV) {
          const data = await env.USERS_KV.get('all_users');
          if (data) users = JSON.parse(data);
        }
        return new Response(JSON.stringify({ success: true, users: users }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, users: [] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  }
};
