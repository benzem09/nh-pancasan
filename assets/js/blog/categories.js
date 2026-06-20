// categories.js

// Fungsi untuk mendapatkan daftar kategori unik secara dinamis dari data postingan
function getAvailableCategories(allPosts) {
    const categories = new Set();
    categories.add("Semua"); // Selalu pastikan opsi "Semua" ada di awal
    
    allPosts.forEach(post => {
        if (post.category) {
            categories.add(post.category);
        }
    });
    
    return Array.from(categories);
}

async function refreshCategories(filter = "Semua") {
    const filterBar = document.getElementById('category-filter-bar');
    const container = document.getElementById('category-posts');
    
    // Pastikan elemen DOM ada sebelum melanjutkan
    if (!filterBar || !container) return;

    // Tampilkan skeleton loading saat mengambil data
    container.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        // 1. AMBIL DATA INDEKS TERBARU dari polder bulanan
        const allPosts = await loadAllIndexes();
        
        // Simpan ke global state jika diperlukan oleh bagian app lain
        window.BLOG_POSTS = allPosts.sort((a, b) => b.id - a.id);

        // 2. DAPATKAN DAFTAR KATEGORI SECARA OTOMATIS
        // Jadi Anda tidak perlu menulis daftar kategori secara manual lagi
        const activeCategories = getAvailableCategories(window.BLOG_POSTS);

        // 3. RENDER TOMBOL FILTER (KATEGORI BAR)
        filterBar.innerHTML = activeCategories.map(cat => `
            <button onclick="refreshCategories('${cat}')" 
                class="px-4 py-1 rounded-full text-[10px] whitespace-nowrap border transition-all ${
                    filter === cat 
                        ? 'bg-blue-600 border-blue-600 text-white font-bold' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }">
                ${cat}
            </button>
        `).join('');

        // 4. FILTER POSTINGAN BERDASARKAN KATEGORI YANG DIKLIK
        let filtered = (filter === "Semua") 
            ? window.BLOG_POSTS 
            : window.BLOG_POSTS.filter(p => p.category === filter);

        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<p class='text-center opacity-40 py-10 text-xs text-slate-400'>Tidak ada postingan di kategori "${filter}".</p>`;
            return;
        }

        // 5. RENDER DAFTAR ARTIKEL KE LAYAR
        container.innerHTML = filtered.map(p => {
            const postSlug = p.slug || generateSlug(p.title);
            const cleanTitle = typeof sanitizeHTML === "function" ? sanitizeHTML(p.title) : p.title;
            
            return `
            <div class="glass p-4 rounded-xl flex justify-between items-center group cursor-pointer mb-2 border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-sm" 
                 onclick="openPost('${postSlug}', ${p.id})">
                <div class="pr-4 overflow-hidden">
                    <span class="text-[8px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded mb-1 inline-block border border-blue-100 font-bold">
                        ${p.category || 'Umum'}
                    </span>
                    <h4 class="font-bold text-sm text-[var(--text-main)] line-clamp-1"># ${cleanTitle}</h4>
                    <span class="text-[8px] text-[var(--text-soft)] block mt-1 font-medium">📅 ${p.date || '-'}</span>
                </div>
                <div class="text-[var(--primary)] transform group-hover:translate-x-1 transition-transform shrink-0 font-bold">→</div>
            </div>`;
        }).join('');

    } catch (e) { 
        console.error("Gagal memuat tab kategori:", e);
        container.innerHTML = `<p class='text-center text-red-400 py-10 text-xs'>⚠️ Gagal memuat data kategori.</p>`;
    }
}
