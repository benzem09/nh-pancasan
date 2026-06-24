async function loadFullPost(postId) {
    console.log("loadFullPost start");
    console.log(window.loadCommentSection);
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");



    try {
        const post = await findPostById(postId);

        if (!post) throw new Error("Data kosong");

        
        renderPost(post, postId);

        console.log("SEO dipanggil");
        updateSEO(post);

        wrapTables();
        generateTOC();

        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
        };

        if (fab) fab.classList.remove("hidden");

        initPostActions(post);

        // PERBAIKAN: Panggil fungsi aksi download di sini dengan mengoper objek 'post'
        if (typeof window.initDownloadActions === "function") {
            window.initDownloadActions(post);
        }
        
        // Memanggil fungsi dari comments.js secara aman
        if (typeof window.loadCommentSection === "function") {
            await window.loadCommentSection(postId);
        } else {
            console.error("Fungsi loadCommentSection tidak ditemukan. Pastikan comments.js dimuat sebelum post-viewer.js");
        }

        if (typeof window.loadLikes === "function") {
            await window.loadLikes(postId);
        }

        if (typeof addView === "function") {
            await addView(postId);
        }

        if (typeof updateBookmarkButton === "function") {
            updateBookmarkButton(postId);
        }

        setTimeout(() => {
            if (typeof initFabAutoHide === "function") initFabAutoHide();
            if (typeof showFab === "function") showFab();
        }, 500);

    } catch (err) {
        console.error("Detail Error:", err);
        titleElem.innerText = "Gagal Memuat";
        container.innerHTML = errorHTML(postId);
    }
}

function wrapArabic(text) {
    const lines = text.split('\n');

    return lines.map(line => {

        if (/[\u0600-\u06FF]/.test(line)) {
            return `<div class="arabic-text">${line}</div>`;
        }

        return line;

    }).join('\n');
}
function processArabicBlocks(text){

    return text.replace(
        /:::arab\s*([\s\S]*?)\s*:::/g,
        (_, arabic) => {

            return `
<div class="arabic-text">
${arabic.trim()}
</div>
`;

        }
    );

}
// render post
function renderPost(post, postId) {
    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');

    // title + SEO
    titleElem.innerText = post.title || "Tanpa Judul";
    document.title = `${post.title} - NH Pancasan`;

    updateSEO(post);

    // render html
    container.innerHTML = `
        <div class="post-body leading-relaxed">
            <div class="
                flex items-center justify-between
                bg-slate-600/20
                border border-white/10
                rounded-xl
                px-2 py-1.5
                mb-3
                backdrop-blur-md
                shadow-lg shadow-black/20
                text-xs font-medium
            ">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="shrink-0">
                        🏷 ${post.category || 'Umum'}
                    </span>
                    <span class="truncate">
                        👤 @${post.author || "admin"}
                    </span>
                </div>

                <div class="relative shrink-0">
                    <button
                        onclick="toggleMetaInfo()"
                        class="flex items-center justify-center text-xl shadow-md active:scale-95 transition">
                        ⋯
                    </button>

                    <div id="metaDropdown"
                        class="hidden absolute right-0 top-12 w-48
                        bg-slate-900/95 backdrop-blur-xl
                        border border-white/10 rounded-2xl
                        p-4 text-xs shadow-2xl z-50">

                        <div class="space-y-3 text-slate-300">
                            <div class="flex items-center justify-between border-b border-white/5 pb-2">
                                <span>📅 Tanggal</span>
                                <span>${post.date || "-"}</span>
                            </div>

                            <div class="flex items-center justify-between border-b border-white/5 pb-2">
                                <span>👁 Views</span>
                                <span id="viewCount">0</span>
                            </div>

                            <div
                                onclick="toggleLike(${postId})"
                                class="flex items-center justify-between border-b border-white/5 pb-2 cursor-pointer hover:text-red-400 transition">
                                <span>❤️ Likes</span>
                                <span id="likeCount">0</span>
                            </div>

                            <div
                                id="bookmarkBtn"
                                onclick="toggleBookmark(${postId})"
                                class="flex items-center justify-between cursor-pointer hover:text-blue-400 transition">
                                <span>🔖 Bookmark</span>
                                <span>Simpan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="h-px bg-white/5 mb-6"></div>

            <div id="main-post-content">
                ${marked.parse(
                processArabicBlocks(
                        post.content || ""))}
                <div style="height:100px;"></div>
            </div>
        </div>
    `;
    // image viewer
    container.querySelectorAll('.post-body img').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.onclick = () => {
            openImageModal(img.src);
        };
    });
}

// table wrapper + TOC
function wrapTables() {
    const container = document.getElementById('viewContent');
    container.querySelectorAll("table").forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}



// slug open
function openPost(slug, id) {
    history.pushState({}, '', `?post=${slug}`);
    loadFullPost(id);
}

function updateSEO(post) {

    console.log("SEO UPDATE:", post.title);
    const siteUrl = "https://benzem09.github.io/nh-pancasan";
    console.log(document.querySelector('meta[name="description"]'));
    console.log(document.querySelector('link[rel="canonical"]'));

    const slug =
        post.slug || generateSlug(post.title);

    const canonicalUrl =
        `${siteUrl}/?post=${slug}`;

    const description =
        (post.content || "")
        .replace(/[#>*`]/g, "")
        .replace(/\n/g, " ")
        .substring(0, 160);

    const metaDesc =
        document.querySelector('meta[name="description"]');

    if (metaDesc) {
        metaDesc.setAttribute("content", description);
    }

    const canonical =
        document.querySelector('link[rel="canonical"]');

    if (canonical) {
        canonical.setAttribute("href", canonicalUrl);
    }

    const ogTitle =
        document.querySelector('meta[property="og:title"]');

    if (ogTitle) {
        ogTitle.setAttribute("content", post.title);
    }

    const ogDesc =
        document.querySelector('meta[property="og:description"]');

    if (ogDesc) {
        ogDesc.setAttribute("content", description);
    }

    const ogUrl =
        document.querySelector('meta[property="og:url"]');

    if (ogUrl) {
        ogUrl.setAttribute("content", canonicalUrl);
    }
}