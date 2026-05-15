async function refreshBlog(targetData = null, action = null) {
    const feed = document.getElementById("blog-feed");

    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        let sortedPosts = [];

        // JIKA ADA MANIPULASI DATA LOKAL INSTAN
        if (targetData && action) {
            const currentIndexes = await loadAllIndexes(); 
            
            if (action === 'create') {
                if (!currentIndexes.some(p => p.id === targetData.id)) {
                    currentIndexes.push(targetData);
                }
            } else if (action === 'edit') {
                const idx = currentIndexes.findIndex(p => p.id === targetData.id);
                if (idx !== -1) {
                    currentIndexes[idx] = { ...currentIndexes[idx], ...targetData };
                }
            } else if (action === 'delete') {
                // targetData di sini berisi ID dari postingan yang dihapus
                currentIndexes = currentIndexes.filter(p => p.id !== targetData);
            }
            
            sortedPosts = currentIndexes.sort((a, b) => b.id - a.id);
        } else {
            // Jalur normal saat halaman web dibuka pertama kali
            const allPosts = await loadAllIndexes();
            renderPosts(allPosts);
        }

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
    const yearsData = await getPublicFile("indices/years.json");

    const years = yearsData.years || [];
    let allPosts = [];

    for (const year of years) {
        try {
            const monthsData = await getPublicFile(
                `indices/${year}/months.json`
            );

            const months = monthsData.months || [];

            for (const month of months) {
                try {
                    const posts = await getPublicFile(
                        `indices/${year}/${month}/index_${month}.json`
                    );
                    allPosts.push(...posts);
                } catch {}
            }
        } catch {}
    }

    return allPosts;
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