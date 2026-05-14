async function refreshBlog() {
    const feed = document.getElementById("blog-feed");

    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        const allPosts = await loadAllIndexes();
        const sortedPosts = allPosts.sort((a, b) => b.id - a.id);

        if (!sortedPosts.length) {
            feed.innerHTML = "<p class='opacity-50 text-xs'>Belum ada postingan</p>";
            return;
        }

        feed.innerHTML = sortedPosts.map(p => {
            const isOwner =
                typeof CURRENT_USER !== "undefined" &&
                (p.author === CURRENT_USER || CURRENT_USER === "admin");

            return `
            <div class="glass p-3 rounded-xl mb-2">
                <div onclick="openPost('${p.slug}', ${p.id})" class="cursor-pointer">
                    <h3 class="font-bold text-sm text-blue-400">${sanitizeHTML(p.title)}</h3>

                    <div class="flex justify-between mt-2 text-[9px] opacity-50">
                        <span>${p.date} • ${p.category}</span>
                        ${
                            isOwner
                            ? `
                            <span>
                                <button onclick="event.stopPropagation(); prepareEdit(${p.id})">✏️</button>
                                <button onclick="event.stopPropagation(); deletePost(${p.id})">🗑️</button>
                            </span>
                            `
                            : ""
                        }
                    </div>
                </div>
            </div>
            `;
        }).join("");

    } catch (e) {
        console.error(e);
        feed.innerHTML = `<p>Error: ${e.message}</p>`;
    }
}

async function loadAllIndexes() {
    try {
        const yearsData = await getPublicFile("indices/years.json");
        const years = Array.isArray(yearsData.years) ? yearsData.years : [];
        let allPosts = [];

        for (const year of years) {
            // List bulan 01 s/d 12
            const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
            
            // Mencari di folder: indices/YYYY/MM/index_MM.json
            const requests = months.map(month => 
                getPublicFile(`indices/${year}/${month}/index_${month}.json`).catch(() => null)
            );

            const results = await Promise.all(requests);
            
            results.forEach(posts => {
                if (posts && Array.isArray(posts)) {
                    allPosts.push(...posts);
                }
            });
        }
        return allPosts;
    } catch (err) {
        console.error("Gagal memuat index:", err);
        return [];
    }
}

function filterBlog() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const posts = document.querySelectorAll('#blog-feed > div');
    posts.forEach(post => {
        const title = post.querySelector('h3').innerText.toLowerCase();
        post.style.display = title.includes(query) ? "block" : "none";
    });
}
