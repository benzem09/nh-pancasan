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
    const { year, month, date } = getDateParts();
    const slug = generateSlug(t); // PERBAIKAN 1: Definisi slug

    try {
        // A. Simpan Detail ke posts/YYYY/MM/post_ID.json
        const detailedData = {
          id: postId,
          slug: slug,
          title: t,
          content: c,
          category: cat,
          author: CURRENT_USER,
          date,
          year,
          month,
          reactions: {},
          comments: [] 
        };
        const postPath = getPostPath(postId, year, month);
        await updateGithubFile(postPath, detailedData, null, `Create post ${postId}`);

        // B. Update Daftar Tahun (indices/years.json)
        let yearsRes;
        try { 
            const data = await getGithubFile("indices/years.json");
            yearsRes = { content: data.content, sha: data.sha };
        } catch (e) {
            yearsRes = { content: { years: [] }, sha: null };
        }

        if (!yearsRes.content.years.includes(year)) {
            yearsRes.content.years.push(year);
            await updateGithubFile("indices/years.json", yearsRes.content, yearsRes.sha, "Update Year List");
        }

        // C. Update Index Bulanan (indices/YYYY/index_MM.json)
        const indexPath = getIndexPath(year, month);
        let indexRes;
        try {
            const data = await getGithubFile(indexPath);
            indexRes = { content: data.content, sha: data.sha };
        } catch (e) { 
            indexRes = { content: [], sha: null }; 
        }

        indexRes.content.push({
          id: postId,
          slug: slug,
          title: t,
          author: CURRENT_USER,
          category: cat,
          date,
          year,
          month 
        });
        await updateGithubFile(indexPath, indexRes.content, indexRes.sha, `Update Index ${month}-${year}`);
        
        closeModal('postModal');
        resetPostModal();
        // Beri jeda sedikit agar GitHub memproses commit sebelum refresh
        await new Promise(r => setTimeout(r, 2000));
        refreshBlog();
    } catch (e) {
        console.error(e); // Cek konsol browser untuk detail error
        alert("Gagal mengirim! Periksa koneksi atau token.");
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
        // 1. Ambil data lama untuk mendapatkan Year dan Month
        const oldPost = await findPostById(EDIT_POST_ID);
        const postYear = oldPost.year;
        const postMonth = oldPost.month;

        // 2. Update File Detail di posts/YYYY/MM/post_ID.json
        const postPath = getPostPath(EDIT_POST_ID, postYear, postMonth);
        const file = await getGithubFile(postPath);

        file.content.title = t;
        file.content.slug = generateSlug(t);
        file.content.content = c;
        file.content.category = cat;

        await updateGithubFile(postPath, file.content, file.sha, `Edit post ${EDIT_POST_ID}`);

        // 3. Update Index Bulanan (indices/YYYY/index_MM.json)
        const indexPath = getIndexPath(postYear, postMonth);
        const index = await getGithubFile(indexPath);
        const idx = index.content.findIndex(p => p.id === EDIT_POST_ID);

        if (idx !== -1) {
            index.content[idx].title = t;
            index.content[idx].slug = generateSlug(t);
            index.content[idx].category = cat;
            await updateGithubFile(indexPath, index.content, index.sha, `Update Index ${postMonth}-${postYear}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        resetPostModal();
        closeModal('postModal');
        refreshBlog();
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan perubahan!");
    } finally {
        btn.innerText = "Simpan Perubahan";
    }
}

// 2. Perbaikan Fungsi `deletePost`
async function deletePost(postId) {
    if (!confirm("Hapus postingan ini?")) return;

    try {
        requireToken();
        
        // 1. Cari meta data post (untuk tahu tahun & bulan)
        const allPosts = await loadAllIndexes();
        const meta = allPosts.find(p => p.id === postId);
        
        if (!meta) throw new Error("Post tidak ditemukan di index");

        const postYear = meta.year;
        const postMonth = meta.month;

        // 2. Hapus dari Index Bulanan
        const indexPath = getIndexPath(postYear, postMonth);
        const index = await getGithubFile(indexPath);
        
        index.content = index.content.filter(post => post.id !== postId);
        await updateGithubFile(indexPath, index.content, index.sha, `Delete post ${postId} from index`);

        // 3. (Opsional namun disarankan) Hapus file detail aslinya
        const postPath = getPostPath(postId, postYear, postMonth);
        try {
            const fileDetail = await getGithubFile(postPath);
            // Anda perlu fungsi deleteGithubFile atau mengirim content null/empty tergantung library API Anda
            // Jika updateGithubFile mendukung penghapusan, gunakan di sini.
        } catch (err) {
            console.warn("File fisik tidak ditemukan, tapi index sudah dibersihkan.");
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        refreshBlog();
        alert("Postingan berhasil dihapus!");
    } catch (e) {
        console.error(e);
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