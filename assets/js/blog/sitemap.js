async function generateSitemap() {
    try {
        const posts = await loadAllIndexes();

        const now = new Date().toISOString();

        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

<url>
<loc>https://benzem09.github.io/nh-pancasan/</loc>
<lastmod>${now}</lastmod>
<priority>1.0</priority>
</url>
`;

        posts.forEach(post => {

            const lastmod =
                post.date
                ? new Date(post.date).toISOString()
                : now;

            xml += `
<url>
<loc>https://benzem09.github.io/nh-pancasan/?post=${post.slug}</loc>
<lastmod>${lastmod}</lastmod>
<priority>0.8</priority>
</url>
`;
        });

        xml += `
</urlset>`;

        const file = await getGithubFile("sitemap.xml");

        await updateGithubFile(
            "sitemap.xml",
            xml,
            file.sha,
            "Auto update sitemap"
        );

        console.log("Sitemap updated");
    } catch(e) {
        console.error("Generate sitemap gagal", e);
    }
}