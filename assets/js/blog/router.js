async function checkUrlPost() {

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('post');

    if (!slug) return;

    try {

        const allPosts = await loadAllIndexes();

        const found = allPosts.find(
            p => (p.slug || generateSlug(p.title)) === slug
        );

        console.log("Slug URL :", slug);
        console.log("FOUND :", found);

        if (found) {
            await loadFullPost(found.id);
        } else {
            console.warn("Post tidak ditemukan:", slug);
        }

    } catch (err) {
        console.error("Router Error:", err);
    }
}

checkUrlPost();