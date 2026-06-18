interface Env {
  wanzhan: D1Database;
  wanzhan2: R2Bucket;
}

// 1. GET - Fetch and structure all research records
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    // Select from D1: env.wanzhan
    const { results } = await env.wanzhan
      .prepare("SELECT * FROM projects ORDER BY created_at DESC")
      .all();

    // Map rows into clean Project interface structures
    const projects = results.map((row: any) => {
      // Parse JSON slides array or fallback to a single item array of the cover image
      let imagesArray: string[] = [];
      try {
        if (row.images) {
          imagesArray = JSON.parse(row.images);
        }
      } catch (e) {
        // Fallback
      }
      if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
        imagesArray = row.image ? [row.image] : [];
      }

      return {
        id: row.id,
        title: row.title,
        titleEn: row.titleEn || row.title,
        category: row.category || 'ARCHITECTURE',
        location: row.location || '',
        locationEn: row.locationEn || row.location || '',
        year: row.year || '2026',
        image: row.image || '',
        images: imagesArray,
        details: {
          area: row.area || '',
          material: row.material || '',
          tectonics: row.tectonics || ''
        }
      };
    });

    return new Response(JSON.stringify(projects), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store" 
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database fetch failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// 2. POST - Insert or update a project record
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const body: any = await request.json();

    const {
      id,
      title,
      titleEn,
      category,
      location,
      locationEn,
      year,
      image,
      images,
      details
    } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate id if not specified
    const projectID = id || `proj-${Math.random().toString(36).substring(2, 9)}`;
    const imagesJson = JSON.stringify(images || (image ? [image] : []));
    
    const area = details?.area || '';
    const material = details?.material || '';
    const tectonics = details?.tectonics || '';

    // Insert or Update into D1: env.wanzhan
    await env.wanzhan
      .prepare(`
        INSERT INTO projects (id, title, titleEn, category, location, locationEn, year, image, images, area, material, tectonics)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          titleEn = excluded.titleEn,
          category = excluded.category,
          location = excluded.location,
          locationEn = excluded.locationEn,
          year = excluded.year,
          image = excluded.image,
          images = excluded.images,
          area = excluded.area,
          material = excluded.material,
          tectonics = excluded.tectonics
      `)
      .bind(
        projectID,
        title,
        titleEn || title,
        category || 'ARCHITECTURE',
        location || '',
        locationEn || '',
        year || '2026',
        image || '',
        imagesJson,
        area,
        material,
        tectonics
      )
      .run();

    return new Response(JSON.stringify({ success: true, id: projectID }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database insert failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// 3. DELETE - Delete researchers archive
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing 'id' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Run DELETE in D1: env.wanzhan
    await env.wanzhan
      .prepare("DELETE FROM projects WHERE id = ?")
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Database delete failed' }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
