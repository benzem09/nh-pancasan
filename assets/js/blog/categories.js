async function refreshCategories(filter = "Semua") {
    const filterBar = document.getElementById('category-filter-bar');
    if (!filterBar) return;

    // 1. Render tombol kategori (Tetap sama)
    filterBar.innerHTML = availableCategories.map(cat => `
        <button onclick="refreshCategories('${cat}')" 
            class="px-4 py-1 rounded-full text-[10px] whitespace-nowrap border ${filter === cat ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/5 border-white/10 text-slate-400'}">
            ${cat}
        </button>
    `).join('');

    const container = document.getElementById('category-posts');
    if (!container) return;

    try {
        // 2. AMBIL DATA DARI GLOBAL STATE (Atau fetch jika data global belum dimuat)
        if (typeof BLOG_POSTS === "undefined" || BLOG_POSTS.length === 0) {
            container.innerHTML = `<div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>`;
            const allPosts = await loadAllIndexes();
            BLOG_POSTS = allPosts.sort((a, b) => b.id - a.id);
        }

        // 3. Filter berdasarkan kategori yang dipilih
        let filtered = (filter === "Semua") 
            ? BLOG_POSTS 
            : BLOG_POSTS.filter(p => p.category === filter);

        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<p class='text-center opacity-30 py-10 text-xs'>Tidak ada postingan di kategori ${filter}.</p>`;
            return;
        }

        // 4. Render hasil filter secara instan ke ID 'category-posts'
        container.innerHTML = filtered.map(p => {
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
        container.innerHTML = `<p class='text-center text-red-400 py-10 text-xs'>Gagal memuat data kategori.</p>`;
    }
}
