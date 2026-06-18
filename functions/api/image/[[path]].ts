interface Env {
  wanzhan: D1Database;
  wanzhan2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const pathParts = params.path;

  if (!pathParts) {
    return new Response('Path Not Found', { status: 404 });
  }

  // Combine wildcard segments safely back into the full key path
  const key = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;

  try {
    // Fetch image from R2: env.wanzhan2
    const object = await env.wanzhan2.get(key);

    if (!object) {
      return new Response('Asset Not Found in R2 Bucket', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      headers,
    });
  } catch (err: any) {
    return new Response(`Retrieval Failed: ${err.message}`, { status: 500 });
  }
};
