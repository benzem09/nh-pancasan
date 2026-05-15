async function refreshBlog(targetData = null, action = null) {
    const feed = document.getElementById("blog-feed");

    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        let posts = await loadAllIndexes();

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
                "<p class='opacity-50 text-xs'>Belum ada postingan</p>";
            return;
        }
        renderPosts(sortedPosts);

        feed.innerHTML = sortedPosts.map(p => {
            const isOwner =
                typeof CURRENT_USER !== "undefined" &&
                (p.author === CURRENT_USER || CURRENT_USER === "admin");

            return `
            <div class="glass p-3 rounded-xl mb-2">
                <div onclick="openPost('${p.slug}', ${p.id})" class="cursor-pointer">
                    <h3 class="font-bold text-sm text-blue-400">${sanitizeHTML(p.title)}</h3>
                    <div class="flex justify-between mt-2 text-[9px] opacity-50">
                        <span>👤 ${p.author.toUpperCase()} | 🏷 ${p.category || 'Umum'} | 📅 ${p.date}</span>
                        ${isOwner ? `
                            <span>
                                <button onclick="event.stopPropagation(); prepareEdit(${p.id})">✏️</button>
                                <button onclick="event.stopPropagation(); deletePost(${p.id})">🗑️</button>
                            </span>
                        ` : ""}
                    </div>
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

async function loadAllIndexes() {
    try {
        const yearsData = await getPublicFile("indices/years.json");
        const years = yearsData.years || [];
        let allPosts = [];

        // 1. Ambil semua data months.json secara paralel untuk setiap tahun
        const monthPromises = years.map(async (year) => {
            try {
                const monthsData = await getPublicFile(`indices/${year}/months.json`);
                const months = monthsData.months || [];
                
                // Kembalikan objek yang memasangkan tahun dengan bulan-bulannya
                return { year, months };
            } catch (e) {
                console.error(`Gagal memuat bulan untuk tahun ${year}:`, e);
                return { year, months: [] };
            }
        });

        const yearsWithMonths = await Promise.all(monthPromises);

        // 2. Kumpulkan semua target URL file indeks bulanan yang harus diunduh
        const indexPromises = [];
        
        yearsWithMonths.forEach(({ year, months }) => {
            months.forEach(month => {
                const fetchPromise = getPublicFile(`indices/${year}/${month}/index_${month}.json`)
                    .then(posts => {
                        if (Array.isArray(posts)) {
                            allPosts.push(...posts);
                        }
                    })
                    .catch(e => {
                        console.error(`Gagal memuat file indeks indices/${year}/${month}/index_${month}.json :`, e);
                    });
                
                indexPromises.push(fetchPromise);
            });
        });

        // 3. Unduh seluruh file indeks bulanan secara bersamaan (paralel)
        await Promise.all(indexPromises);

        return allPosts;
    } catch (err) {
        console.error("Gagal total memuat seluruh indeks blog:", err);
        return [];
    }
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
                <h3 class="font-bold text-blue-400">${year}</h3>`;

            try {
                const monthsData = await getPublicFile(
                    `indices/${year}/months.json`
                );

                for (const month of monthsData.months) {
                    html += `
                        <button
                            onclick="filterArchive('${year}','${month}')"
                            class="block text-xs opacity-70 hover:text-blue-400 ml-3 mt-1">
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