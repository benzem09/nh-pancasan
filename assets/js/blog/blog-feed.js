async function refreshBlog() {
    const feed = document.getElementById('blog-feed');

    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        const allPosts = await loadAllIndexes();

        const sortedPosts = allPosts.sort((a, b) => b.id - a.id);

        if (!sortedPosts.length) throw new Error("Belum ada postingan");

        feed.innerHTML = sortedPosts.map(p => {
            const cleanTitle =
                typeof sanitizeHTML === "function"
                    ? sanitizeHTML(p.title)
                    : p.title;

            const isOwner =
                typeof CURRENT_USER !== "undefined" &&
                (p.author === CURRENT_USER || CURRENT_USER === "admin");

            return `
            <div class="glass p-3 rounded-xl hover:border-blue-500/30 transition-all relative group mb-2">
                <div class="cursor-pointer" onclick="openPost('${p.slug || generateSlug(p.title)}', ${p.id})">
                    <h3 class="font-bold text-sm text-blue-400 pr-12 line-clamp-1">${cleanTitle}</h3>

                    <div class="flex justify-between mt-2 pt-2 border-t border-white/5 opacity-40 text-[8px]">
                        <span>
                            👤 ${p.author.toUpperCase()} |
                            🏷 ${p.category || 'Umum'} |
                            📅 ${p.date}
                        </span>

                        <span>
                            ${isOwner ? `
                                <button onclick="event.stopPropagation(); prepareEdit(${p.id})"
                                    class="text-blue-500 opacity-40 hover:opacity-100 p-1 text-xs">✏️</button>

                                <button onclick="event.stopPropagation(); deletePost(${p.id})"
                                    class="text-red-500 opacity-40 hover:opacity-100 p-1 text-xs">🗑️</button>
                            ` : ''}
                        </span>
                    </div>
                </div>
            </div>
            `;
        }).join('');

    } catch (e) {
        feed.innerHTML = `
            <p class="text-red-400 text-xs p-4">
                Error: ${e.message}
            </p>
        `;
    }
}

async function loadAllIndexes() {
    const yearsData = await getPublicFile("indices/years.json");
    let allPosts = [];

    for (const year of yearsData.years) {
        const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
        
        // Ambil semua bulan secara paralel
        const requests = months.map(month => 
            getPublicFile(`indices/${year}/index_${month}.json`).catch(() => null)
        );

        const results = await Promise.all(requests);
        results.forEach(posts => {
            if (posts && Array.isArray(posts)) {
                allPosts.push(...posts);
            }
        });
    }
    return allPosts;
}


function filterBlog() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const posts = document.querySelectorAll('#blog-feed > div');
    posts.forEach(post => {
        const title = post.querySelector('h3').innerText.toLowerCase();
        post.style.display = title.includes(query) ? "block" : "none";
    });
}