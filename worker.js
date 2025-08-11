const SDP_CODE_LENGTH = 3;
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      if(request.method=="PUT"){
        if(request.headers.has("SDP_CODE")){
          const body = await request.json();
          const CODE = request.headers.get("SDP_CODE");
          await write_sdp_offer(body, env, CODE);
          return new Response("Ok");
        } else {
          const body = await request.json();
          if ("SDP_OFFER" in body) {
            const CODE = crypto.randomUUID().substring(0, SDP_CODE_LENGTH);
            //TODO check for code clash
            await write_sdp_offer(body, env, CODE);
            return new Response(CODE);
          }
        }
      } else if(request.method == "GET"){
        const SDP_CODE = request.headers.get("SDP_CODE");
        const data = await env.WEB_RTC_CACHE.get(SDP_CODE);
        return new Response(data);
      }
    }
    if (["/main.html", "/index.js", "/style.css", "/database_methods.js"].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    if (url.pathname === "/") {
      return env.ASSETS.fetch("https://assets.local/main.html");
    }
    return new Response("Not found", { status: 404 });
  }
};
export {
  worker_default as default
};

async function write_sdp_offer(body, env, CODE){
    console.log("written")
    await env.WEB_RTC_CACHE.put(CODE, JSON.stringify(body), {expirationTtl:600});
}
