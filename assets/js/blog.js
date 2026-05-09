let EDIT_POST_ID = null;
const availableCategories = ["Semua", "Fiqih", "sharaf", "Nahu", "Hadist", "Umum"];

// 1. FUNGSI PEMBANTU (Helper)
function getBlogIndexPath(year = new Date().getFullYear()) {
    return `indices/index_${year}.json`;
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// 2. REFRESH BLOG (Menggabungkan Index dari Semua Tahun)
async function refreshBlog() {
    const feed = document.getElementById('blog-feed');
    feed.innerHTML = `
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
        <div class="glass p-3 rounded-lg h-12 skeleton mb-2"></div>
    `;

    try {
        // Ambil daftar tahun yang aktif dari indices/years.json
        const yearsRes = await getPublicFile('indices/years.json');
        const years = yearsRes.sort((a, b) => b - a); // Tahun terbaru di atas

        // Ambil semua file index tahunan secara paralel
        const fetchPromises = years.map(y => getPublicFile(`indices/index_${y}.json`));
        const results = await Promise.all(fetchPromises);
        
        let allPosts = [];
        results.forEach(content => {
            allPosts = allPosts.concat(content);
        });

        // Urutkan berdasarkan ID (Timestamp) terbaru
        const sortedPosts = allPosts.sort((a, b) => b.id - a.id);

        if (sortedPosts.length === 0) throw new Error("Empty");

        feed.innerHTML = sortedPosts.map(p => {
            const cleanTitle = sanitizeHTML(p.title);
            const isOwner = p.author === CURRENT_USER || CURRENT_USER === 'admin';
            
            return `
            <div class="glass p-3 rounded-xl hover:border-blue-500/30 transition-all relative group mb-2">
                <div class="cursor-pointer" onclick="openPost('${p.slug || generateSlug(p.title)}', ${p.id})">
                    <h3 class="font-bold text-sm text-blue-400 pr-12 line-clamp-1"> ${cleanTitle}</h3>
                    <div class="flex justify-between mt-2 pt-2 border-t border-white/5 opacity-40 text-[8px]">
                        <span>👤 ${p.author.toUpperCase()} | 🏷 ${p.category || 'Umum'} | 📅 ${p.date}</span>
                        <span> ${isOwner ? `
                            <button onclick="event.stopPropagation(); prepareEdit(${p.id})" class="text-blue-500 opacity-40 hover:opacity-100 p-1 text-xs">✏️</button>
                            <button onclick="event.stopPropagation(); deletePost(${p.id})" class="text-red-500 opacity-40 hover:opacity-100 p-1 text-xs">🗑️</button>
                        ` : ''} </span>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (e) { 
        feed.innerHTML = "<p class='text-center opacity-30 py-10'>Belum ada postingan di sistem Sharding baru.</p>";
    }
}

// 3. SUBMIT POST (Simpan Detail & Update Shard Index Tahunan)
async function submitPost() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const cat = document.getElementById('postCategory').value;
    
    if(!t || !c) return alert("Isi judul & konten!");
    
    const btn = document.getElementById('btnSubmitPost');
    const originalText = btn.innerText;
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const postId = Date.now();
    const slug = generateSlug(t);
    const now = new Date();
    const year = now.getFullYear();
    const dateStr = now.toISOString().split('T')[0];

    try {
        // A. Simpan Detail ke posts/post_ID.json (Level 1)
        const detailedData = { id: postId, slug, title: t, content: c, category: cat, author: CURRENT_USER, date: dateStr, reactions: {}, comments: [] };
        await updateGithubFile(`posts/post_${postId}.json`, detailedData, null, `Create post ${postId}`);

        // B. Update Daftar Tahun (indices/years.json)
        let yearsRes;
        try { 
            const data = await getGithubFile('indices/years.json');
            yearsRes = { content: data.content, sha: data.sha };
        } catch (e) { yearsRes = { content: [], sha: null }; }

        if (!yearsRes.content.includes(year)) {
            yearsRes.content.push(year);
            await updateGithubFile('indices/years.json', yearsRes.content, yearsRes.sha, "Update Year List");
        }

        // C. Update Index Tahunan (indices/index_YYYY.json) (Level 2)
        const indexPath = getBlogIndexPath(year);
        let indexRes;
        try {
            const data = await getGithubFile(indexPath);
            indexRes = { content: data.content, sha: data.sha };
        } catch (e) { indexRes = { content: [], sha: null }; }

        indexRes.content.push({ id: postId, slug, title: t, author: CURRENT_USER, category: cat, date: dateStr });
        await updateGithubFile(indexPath, indexRes.content, indexRes.sha, `Update Index ${year}`);
        
        closeModal('postModal');
        resetPostModal();
        await new Promise(r => setTimeout(r, 1500));
        refreshBlog();
    } catch (e) {
        alert("Gagal mengirim!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// LOAD FULL POST + SEO + TOC + DOWNLOAD + SHARE
async function loadFullPost(postId) {
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");

    container.innerHTML = "<div class='skeleton h-32 w-full'></div>";
    titleElem.innerText = "Memuat...";

    fab.classList.add("hidden");
    document.querySelectorAll('.fab-popup').forEach(p => p.classList.add('hidden'));

    try {
        const post = await getPublicFile(`posts/post_${postId}.json`);

        // title
        titleElem.innerText = post.title || "Tanpa Judul";

        // SEO
        document.title = `${post.title} - NH Pancasan`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute(
                "content",
                (post.content || "")
                .replace(/[#>*`]/g, "")
                .slice(0, 150)
            );
        }

        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.href = window.location.href;

        // render content
        container.innerHTML = `
            <div class="post-body text-slate-300 leading-relaxed">
                <div class="flex items-center gap-2 mb-6 opacity-60">
                    <span class="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                        ${post.category || 'Umum'}
                    </span>
                    <span class="text-[10px]">👤 @${post.author || "admin"}</span>
                    <span class="text-[10px]">📅 ${post.date || "-"}</span>
                </div>

                <div id="main-post-content">
                    ${marked.parse(post.content || "")}
                </div>
            </div>
        `;

        // table wrapper
        container.querySelectorAll("table").forEach(table => {
            const wrapper = document.createElement("div");
            wrapper.className = "table-wrapper";
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        // TOC
        const headings = container.querySelectorAll("h1,h2,h3");

        if (headings.length > 1) {
            let tocHTML = `
                <div class="popup-title">📑 Daftar Isi</div>
                <ul class="max-h-[50vh] overflow-y-auto">
            `;

            headings.forEach((heading, index) => {
                const id = `heading-${index}`;
                heading.id = id;

                const indent =
                    heading.tagName === "H2" ? "ml-3" :
                    heading.tagName === "H3" ? "ml-6" : "";

                tocHTML += `
                    <li class="${indent} mb-2">
                        <a href="#${id}" class="text-slate-400 text-[11px] hover:text-blue-400">
                            • ${heading.innerText}
                        </a>
                    </li>
                `;
            });

            tocHTML += `</ul>`;
            document.getElementById("tocContainer").innerHTML = tocHTML;
        }

        fab.classList.remove("hidden");

        // TOC button
        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
        };

        // SHARE native android
        document.getElementById('btnShare').onclick = async (e) => {
            e.stopPropagation();

            try {
                if (navigator.share) {
                    await navigator.share({
                        title: post.title || document.title,
                        text: `Baca artikel: ${post.title}`,
                        url: window.location.href
                    });
                } else {
                    await navigator.clipboard.writeText(window.location.href);
                    alert("Link disalin!");
                }
            } catch (err) {
                console.log("Share dibatalkan");
            }
        };

        // DOWNLOAD popup
        document.getElementById('btnDownload').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('downloadPopup');
        };

        const fileName = post.slug || generateSlug(post.title);

        document.getElementById('dlMd').onclick = () => {
            executeDownload(post.content, `${fileName}.md`);
        };

        document.getElementById('dlHtml').onclick = () => {
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${post.title}</title>
</head>
<body>
${marked.parse(post.content)}
</body>
</html>`;
            executeDownload(htmlContent, `${fileName}.html`);
        };

    } catch (err) {
        console.error(err);
        titleElem.innerText = "Error";
        container.innerHTML = "Gagal memuat detail postingan.";
    }
}


// download helper
function executeDownload(content, filename) {
    const blob = new Blob([content], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}


// popup toggle
function toggleFabPopup(id) {
    const target = document.getElementById(id);
    const isHidden = target.classList.contains('hidden');

    document.querySelectorAll('.fab-popup')
        .forEach(p => p.classList.add('hidden'));

    if (isHidden) target.classList.remove('hidden');
}

// slug open
function openPost(slug, id) {
    history.pushState({}, '', `?post=${slug}`);
    loadFullPost(id);
}

// 5. PREPARE EDIT (Mengambil detail dari shard)
async function prepareEdit(postId) {
    try {
        requireToken();
        const post = await getPublicFile(`posts/post_${postId}.json`);
        document.getElementById('postTitle').value = post.title || "";
        document.getElementById('postContent').value = post.content || "";
        document.getElementById('postCategory').value = post.category || "Umum";
        document.querySelector('#postModal h2').innerText = "✏️ Edit Postingan";
        document.getElementById('btnSubmitPost').innerText = "Simpan Perubahan";
        document.getElementById('btnSubmitPost').onclick = submitEdit;
        EDIT_POST_ID = postId;
        openModal('postModal');
    } catch (e) {
        alert("Gagal mengambil data postingan.");
    }
}

// 6. SUBMIT EDIT (Update Detail & Shard Index Tahunan)
async function submitEdit() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const cat = document.getElementById('postCategory').value;
    if (!t || !c) return alert("Isi judul & konten!");

    const btn = document.getElementById('btnSubmitPost');
    btn.innerText = "Saving...";

    try {
        // A. Update File Detail di posts/
        const file = await getGithubFile(`posts/post_${EDIT_POST_ID}.json`);
        const postYear = new Date(file.content.date).getFullYear(); // Ambil tahun dari data asli

        file.content.title = t;
        file.content.slug = generateSlug(t);
        file.content.content = c;
        file.content.category = cat;

        await updateGithubFile(`posts/post_${EDIT_POST_ID}.json`, file.content, file.sha, `Edit post ${EDIT_POST_ID}`);

        // B. Update Index Tahunan yang Sesuai di indices/
        const indexPath = `indices/index_${postYear}.json`;
        const index = await getGithubFile(indexPath);
        const idx = index.content.findIndex(p => p.id === EDIT_POST_ID);

        if (idx !== -1) {
            index.content[idx].title = t;
            index.content[idx].slug = generateSlug(t);
            index.content[idx].category = cat;
            await updateGithubFile(indexPath, index.content, index.sha, `Update Index ${postYear}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        resetPostModal();
        closeModal('postModal');
        refreshBlog();
    } catch (e) {
        alert("Gagal menyimpan!");
    } finally {
        btn.innerText = "Simpan Perubahan";
    }
}

// 7. DELETE POST (Hapus dari Shard Index Tahunan)
async function deletePost(postId) {
    if (!confirm("Hapus postingan ini?")) return;

    try {
        requireToken();
        // Ambil info post dulu untuk tahu tahunnya sebelum dihapus
        const postDetail = await getPublicFile(`posts/post_${postId}.json`);
        const postYear = new Date(postDetail.date).getFullYear();
        const indexPath = `indices/index_${postYear}.json`;

        // Update Index Tahunan
        const index = await getGithubFile(indexPath);
        index.content = index.content.filter(post => post.id !== postId);
        await updateGithubFile(indexPath, index.content, index.sha, `Delete post ${postId} from index`);

        // (Opsional) Kamu bisa menghapus file di posts/post_ID.json juga jika ingin benar-benar bersih
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        refreshBlog();
        alert("Postingan dihapus!");
    } catch (e) {
        alert("Gagal menghapus postingan");
    }
}


// 8. FUNGSI PENDUKUNG LAINNYA
function resetPostModal() {
    EDIT_POST_ID = null;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    document.querySelector('#postModal h2').innerText = "📝 Tulis Postingan";
    document.getElementById('btnSubmitPost').innerText = "Terbitkan";
    document.getElementById('btnSubmitPost').onclick = submitPost;
}

// 9. refresh
function filterBlog() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const posts = document.querySelectorAll('#blog-feed > div');
    posts.forEach(post => {
        const title = post.querySelector('h3').innerText.toLowerCase();
        post.style.display = title.includes(query) ? "block" : "none";
    });
}

// 10. REFRESH CATEGORIES (Mendukung Sharding Index)
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

// DRAG FAB
let isDraggingFab = false;
let fabStartY = 0;
let fabStartTop = 0;

const fabContainer = document.getElementById("floatingAction");

fabContainer.addEventListener('mousedown', startFabDrag);
fabContainer.addEventListener('touchstart', startFabDrag, { passive: false });

function startFabDrag(e) {
    isDraggingFab = true;

    const touch = e.touches ? e.touches[0] : e;
    fabStartY = touch.clientY;
    fabStartTop = fabContainer.offsetTop;
}

document.addEventListener('mousemove', doFabDrag);
document.addEventListener('touchmove', doFabDrag, { passive: false });

function doFabDrag(e) {
    if (!isDraggingFab) return;

    const touch = e.touches ? e.touches[0] : e;

    let newTop = fabStartTop + (touch.clientY - fabStartY);

    if (newTop < 50) newTop = 50;
    if (newTop > window.innerHeight - 180) {
        newTop = window.innerHeight - 180;
    }

    fabContainer.style.top = newTop + "px";
    fabContainer.style.bottom = "auto";

    document.querySelectorAll('.fab-popup').forEach(p => {
        p.style.top = newTop + "px";
        p.style.bottom = "auto";
    });
}

document.addEventListener('mouseup', () => isDraggingFab = false);
document.addEventListener('touchend', () => isDraggingFab = false);

//11. open
function openPostEditor() {
    try {
        requireToken();
        openModal('postModal');
    } catch(e) {}
}
