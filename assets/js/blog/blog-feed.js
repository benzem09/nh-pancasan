let INDEX_CACHE = null;
let INDEX_PROMISE = null;

async function getAllPosts(force = false) {
    console.count("loadAllIndexes call");
    return await loadAllIndexes(force);
}

async function refreshBlog(targetData = null, action = null) {
    const feed = document.getElementById("blog-feed");

    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        let posts = await getAllPosts();

        // JIKA ADA MANIPULASI DATA LOKAL INSTAN
        if (targetData && action) {
            if (action === "create") {
                if (!posts.some(p => p.id === targetData.id)) {
                    posts.push(targetData);
                }
            }

            if (action === "edit") {
                const idx = posts.findIndex(p => p.id === targetData.id);
                if (idx !== -1) {
                    posts[idx] = { ...posts[idx], ...targetData };
                }
            }

            if (action === "delete") {
                posts = posts.filter(p => p.id !== targetData);
            }
        }

        const sortedPosts = posts.sort((a, b) => b.id - a.id);

        if (!sortedPosts.length) {
            feed.innerHTML =
                "<p class='text-[var(--text-soft)] text-xs font-medium'>Belum ada postingan</p>";
            return;
        }

        feed.innerHTML = sortedPosts.map(p => {
            const isOwner =
                typeof CURRENT_USER !== "undefined" &&
                (p.author === CURRENT_USER || CURRENT_USER === "admin");
            const defaultThumb = "assets/icons/article.svg";

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

    } catch (e) {
        console.error(e);
        feed.innerHTML = `<p>Error: ${e.message}</p>`;
    }
}

async function loadAllIndexes(force = false) {

    console.log("🔥 loadAllIndexes dipanggil", new Date().toLocaleTimeString());

    if (!force && INDEX_CACHE) {
        return INDEX_CACHE;
    }

    if (!force && INDEX_PROMISE) {
        return await INDEX_PROMISE;
    }

    INDEX_PROMISE = (async () => {
        try {
            const yearsData = await getPublicFile("indices/years.json");
            const years = yearsData.years || [];
            let allPosts = [];

            const monthPromises = years.map(async (year) => {
                try {
                    const monthsData = await getPublicFile(`indices/${year}/months.json`);
                    const months = monthsData.months || [];
                    return { year, months };
                } catch {
                    return { year, months: [] };
                }
            });

            const yearsWithMonths = await Promise.all(monthPromises);

            const indexPromises = [];

            yearsWithMonths.forEach(({ year, months }) => {
                months.forEach(month => {
                    const p = getPublicFile(`indices/${year}/${month}/index_${month}.json`)
                        .then(posts => {
                            if (Array.isArray(posts)) {
                                allPosts.push(...posts);
                            }
                        })
                        .catch(() => {});
                    indexPromises.push(p);
                });
            });

            await Promise.all(indexPromises);

            return allPosts;

        } catch (err) {
            console.error(err);
            return [];
        }
    })();

    INDEX_CACHE = await INDEX_PROMISE;
    INDEX_PROMISE = null;

    return INDEX_CACHE;
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

        renderPosts(posts);
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