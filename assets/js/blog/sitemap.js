async function generateSitemap() {
    try {
        const allPosts = await loadAllIndexes();

        const base = "https://benzem09.github.io/nh-pancasan";
        
        // Ambil waktu saat ini untuk halaman utama / base URL
        const currentDate = new Date().toISOString();

        let xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <url>
    <loc>${base}/</loc>
    <lastmod>${currentDate}</lastmod>
    <priority>1.0</priority>
  </url>
`;

        const usedSlugs = new Set();

            allPosts.forEach(post => {

                if (!post.slug) return;

                if (usedSlugs.has(post.slug)) return;

                usedSlugs.add(post.slug);

                const postDate =
                    post.updated ||
                    post.date ||
                    currentDate;

                const formattedDate =
                    new Date(postDate).toISOString();

                xml += `
              <url>
                <loc>${base}/?post=${encodeURIComponent(post.slug)}</loc>
                <lastmod>${formattedDate}</lastmod>
                <priority>0.8</priority>
              </url>`;
            });

        xml += `
</urlset>`;

        let sha = null;

        try {
            const file = await fetch(
                `https://api.github.com/repos/${REPO_PATH}/contents/sitemap.xml`,
                {
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`
                    }
                }
            );

            if (file.ok) {
                const data = await file.json();
                sha = data.sha;
            }
        } catch {}

        await updateGithubFile(
            "sitemap.xml",
            xml,
            sha,
            "Auto update sitemap"
        );

        console.log("Sitemap updated");
    } catch (e) {
        console.error("Sitemap gagal:", e);
    }
}
