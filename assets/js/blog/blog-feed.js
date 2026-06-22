window.POST_CACHE = window.POST_CACHE || [];
window.POST_CACHE_PROMISE = null;

async function refreshBlog() {

    if (
        !window.POST_CACHE.length
    ) {
        await loadAllIndexes();
    }

    renderFeed(
        [...window.POST_CACHE]
        .sort((a,b)=>b.id-a.id)
    );

    if (
        typeof refreshCategories
        === "function"
    ) {
        refreshCategories(
            "Semua"
        );
    }

}

function renderFeed(posts) {
    const feed = document.getElementById("blog-feed");

    if (!posts.length) {
        feed.innerHTML =
            "<p class='text-[var(--text-soft)] text-xs font-medium'>Belum ada postingan</p>";
        return;
    }

    feed.innerHTML = posts.map(p => {
        const isOwner =
            typeof CURRENT_USER !== "undefined" &&
            (p.author === CURRENT_USER || CURRENT_USER === "admin");

        const defaultThumb =
            "assets/icons/article.svg";

        const thumb =
            !p.thumbnail ||
            p.thumbnail === "assets/img/articel.jpg" ||
            p.thumbnail === "assets/img/no-image.png"
                ? defaultThumb
                : p.thumbnail;

        return `
            <div class="glass post-card p-3 rounded-xl mb-3">
                <div onclick="openPost('${p.slug}', ${p.id})"
                     class="cursor-pointer flex items-center gap-3">

                    <!-- Thumbnail -->
                    <div class="post-thumb shrink-0">
                        <img src="${thumb}"
                             class="w-full h-full object-cover rounded-lg"
                             loading="lazy">
                    </div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-sm text-blue-400">
                            ${sanitizeHTML(p.title)}
                        </h3>

                        <div class="text-[10px] text-[var(--text-main)] mt-1 font-medium">
                            👤 ${p.author.toUpperCase()}
                            · 🏷 ${p.category || 'Umum'}
                            · 📅 ${p.date}
                        </div>
                    </div>

                    <!-- Action -->
                    ${isOwner ? `
                    <div class="flex gap-2 text-xs shrink-0">
                        <button onclick="event.stopPropagation(); prepareEdit(${p.id})">✏️</button>
                        <button onclick="event.stopPropagation(); deletePost(${p.id})">🗑️</button>
                    </div>
                    ` : ""}
                </div>
            </div>
            `;
        }).join("");
      if (typeof refreshCategories === "function") {
            refreshCategories("Semua");
        }
  
}

async function loadAllIndexes(force = false) {

    if (
        !force &&
        window.POST_CACHE &&
        window.POST_CACHE.length
    ) {
        return window.POST_CACHE;
    }

    try {
        const yearsData =
            await getPublicFile(
                "indices/years.json"
            );

        const years =
            yearsData.years || [];

        let allPosts = [];

        const monthPromises =
            years.map(async year => {

                try {

                    const monthsData =
                        await getPublicFile(
                            `indices/${year}/months.json`
                        );

                    return {
                        year,
                        months:
                            monthsData.months || []
                    };

                } catch {

                    return {
                        year,
                        months: []
                    };

                }

            });

        const yearsWithMonths =
            await Promise.all(
                monthPromises
            );

        const indexPromises = [];

        yearsWithMonths.forEach(
            ({year, months}) => {

                months.forEach(month => {

                    indexPromises.push(

                        getPublicFile(
                            `indices/${year}/${month}/index_${month}.json`
                        )

                        .then(posts => {

                            if (
                                Array.isArray(posts)
                            ) {
                                allPosts.push(
                                    ...posts
                                );
                            }

                        })

                        .catch(() => {})

                    );

                });

            }
        );

        await Promise.all(
            indexPromises
        );

        // simpan ke cache
        window.POST_CACHE = allPosts;
        return allPosts;

    } catch (err) {

        console.error(
            "Gagal load index:",
            err
        );

        return [];

    }

}

async function rebuildPostCache() {

    console.log(
        "Rebuilding POST_CACHE..."
    );

    window.POST_CACHE =
        await loadAllIndexes(true);

    return window.POST_CACHE;

}

async function renderArchive() {
    const archive = document.getElementById("archiveList");
    if (!archive) return;

    archive.innerHTML = "Loading...";

    try {
        const yearsData = await getPublicFile("indices/years.json");
        const years = yearsData.years || [];

        let html = "";

        for (const year of years.sort((a,b)=>b-a)) {
            html += `<div class="mb-4">
                <h3 class="font-bold text-blue-600">${year}</h3>`;

            try {
                const monthsData = await getPublicFile(
                    `indices/${year}/months.json`
                );

                for (const month of monthsData.months) {
                    html += `
                        <button
                            onclick="filterArchive('${year}','${month}')"
                            class= block text-xs text-gray-600 hover:text-blue-600 ml-3 mt-1 font-medium">
                            📁 ${month}
                        </button>
                    `;
                }
            } catch {}

            html += `</div>`;
        }

        archive.innerHTML = html;
    } catch {
        archive.innerHTML = "Archive kosong";
    }
}

async function filterArchive(year, month) {
    const feed = document.getElementById("blog-feed");

    try {
        const posts = await getPublicFile(
            `indices/${year}/${month}/index_${month}.json`
        );

        renderFeed(posts);
    } catch {
        feed.innerHTML = "Tidak ada postingan.";
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