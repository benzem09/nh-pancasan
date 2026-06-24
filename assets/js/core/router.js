async function getAllPosts() {

    if (window.POST_CACHE?.length) {
        return window.POST_CACHE;
    }

    window.POST_CACHE = await loadAllIndexes();
    return window.POST_CACHE;
}

async function checkUrlPost() {

    const params = new URLSearchParams(window.location.search);
    const slug = params.get("post");

    if (!slug) return;

    try {

        const allPosts = await getAllPosts();

        const found = allPosts.find(
            p => (p.slug || generateSlug(p.title)) === slug
        );

        if (found) {
            await loadFullPost(found.id);
        }

    } catch (err) {
        console.error(err);
    }
}

checkUrlPost();