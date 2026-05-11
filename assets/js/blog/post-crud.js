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

// SUBMIT EDIT (Update Detail & Shard Index Tahunan)
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

// DELETE POST (Hapus dari Shard Index Tahunan)
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


// FUNGSI PENDUKUNG LAINNYA
function resetPostModal() {
    EDIT_POST_ID = null;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    document.querySelector('#postModal h2').innerText = "📝 Tulis Postingan";
    document.getElementById('btnSubmitPost').innerText = "Terbitkan";
    document.getElementById('btnSubmitPost').onclick = submitPost;
}

// open
function openPostEditor() {
    try {
        requireToken();
        openModal('postModal');
    } catch(e) {}
}