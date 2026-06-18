interface Env {
  wanzhan: D1Database;
  wanzhan2: R2Bucket;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file uploaded or invalid file format.' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract file properties
    const fileExtension = file.name.split('.').pop() || 'jpg';
    // Generate a unique path key for storage
    const key = `projects/${crypto.randomUUID()}.${fileExtension}`;

    // Put image into your R2 Bucket: env.wanzhan2
    await env.wanzhan2.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'image/jpeg' },
    });

    // We proxy access via Pages at /api/image/[path]
    const imageUrl = `/api/image/${key}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        key, 
        url: imageUrl 
      }), 
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'R2 Upload Failed' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
