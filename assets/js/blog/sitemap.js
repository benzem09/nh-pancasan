async function generateSitemap() {
    try {
        const allPosts = await loadAllIndexes();

        const base = "https://benzem09.github.io/nh-pancasan";

        let xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>${base}/</loc>
    <priority>1.0</priority>
  </url>
`;

        allPosts.forEach(post => {
            xml += `
  <url>
    <loc>${base}/?post=${encodeURIComponent(post.slug)}</loc>
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
