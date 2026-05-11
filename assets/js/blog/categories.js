async function refreshCategories(filter = "Semua") {
    const filterBar = document.getElementById('category-filter-bar');
    if (!filterBar) return;

    // 1. Render tombol kategori
    filterBar.innerHTML = availableCategories.map(cat => `
        <button onclick="refreshCategories('${cat}')" 
            class="px-4 py-1 rounded-full text-[10px] whitespace-nowrap border ${filter === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}">
            ${cat}
        </button>
    `).join('');

    try {
        // 2. Ambil semua index tahunan untuk filter
        const years = await getPublicFile('indices/years.json');
        const fetchPromises = years.map(y => getPublicFile(`indices/index_${y}.json`));
        const results = await Promise.all(fetchPromises);
        
        let allPosts = [];
        results.forEach(c => allPosts = allPosts.concat(c));
        
        let filtered = (filter === "Semua") ? allPosts : allPosts.filter(p => p.category === filter);

        const container = document.getElementById('category-posts');
        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<p class='text-center opacity-30 py-10 text-xs'>Tidak ada postingan di kategori ${filter}.</p>`;
            return;
        }

        // 3. Render hasil filter (Menggunakan openPost agar URL berubah)
        container.innerHTML = filtered.sort((a,b) => b.id - a.id).map(p => {
            // Gunakan slug jika ada, jika tidak generate dari judul
            const postSlug = p.slug || generateSlug(p.title);
            
            return `
            <div class="glass p-4 rounded-xl flex justify-between items-center group cursor-pointer mb-2" 
                 onclick="openPost('${postSlug}', ${p.id})">
                <div>
                    <span class="text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded mb-1 inline-block">${p.category || 'Umum'}</span>
                    <h4 class="font-bold text-sm text-slate-200"># ${sanitizeHTML(p.title)}</h4>
                </div>
                <div class="text-blue-500">→</div>
            </div>`;
        }).join('');
    } catch (e) { 
        console.error("Gagal memuat kategori:", e); 
    }
}