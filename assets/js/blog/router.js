async function checkUrlPost() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('post');

    if (!slug) return;

    try {
        const years = await getPublicFile('indices/years.json');
        const fetchPromises = years.map(y =>
            getPublicFile(`indices/index_${y}.json`)
        );

        const results = await Promise.all(fetchPromises);

        let allPosts = [];
        results.forEach(c => allPosts = allPosts.concat(c));

        const found = allPosts.find(
            p => (p.slug || generateSlug(p.title)) === slug
        );

        if (found) {
            loadFullPost(found.id);
        }
    } catch (err) {
        console.error(err);
    }
}

checkUrlPost();