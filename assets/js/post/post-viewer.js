async function loadFullPost(postId) {
    console.log("loadFullPost start");
    console.log(window.loadCommentSection);
    openModal('viewModal');

    const container = document.getElementById('viewContent');
    const titleElem = document.getElementById('viewTitle');
    const fab = document.getElementById("floatingAction");

    // reset loader
    titleElem.innerText = "Memuat...";
    fab?.classList.add("hidden");

    try {
        const post = await findPostById(postId);

        if (!post) throw new Error("Data kosong");

        renderPost(post, postId);
        wrapTables();
        generateTOC();

        document.getElementById('btnToc').onclick = (e) => {
            e.stopPropagation();
            toggleFabPopup('tocPopup');
        };

        if (fab) fab.classList.remove("hidden");

        initPostActions(post);
        
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
