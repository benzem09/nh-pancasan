// post-crud.js
async function submitPost() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const imgMatch = c.match(/!\[.*?\]\((.*?)\)/);
    const thumbnail = imgMatch ? imgMatch[1] : "assets/img/articel.jpg";
    const cat = document.getElementById('postCategory').value;
    
    if(!t || !c) return alert("Isi judul & konten!");
    
    const btn = document.getElementById('btnSubmitPost');
    const originalText = btn.innerText;
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const postId = Date.now();
    const { year, month, date } = getDateParts();
    const slug = generateSlug(t);

    try {
        // A. Simpan Detail ke posts/YYYY/MM/post_ID.json
        const detailedData = {
          id: postId,
          slug: slug,
          title: t,
          content: c,
          category: cat,
          thumbnail: thumbnail,
          author: typeof CURRENT_USER !== "undefined" ? CURRENT_USER : "admin",
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
            yearsRes.content.years.sort((a, b) => b - a);
            await updateGithubFile("indices/years.json", yearsRes.content, yearsRes.sha, "Update Year List");
        }
        
        // C. Update daftar bulan per tahun
        let monthsRes;
        try {
            const data = await getGithubFile(`indices/${year}/months.json`);
            monthsRes = { content: data.content, sha: data.sha };
        } catch {
            monthsRes = { content: { months: [] }, sha: null };
        }

        if (!monthsRes.content.months.includes(month)) {
            monthsRes.content.months.push(month);
            await updateGithubFile(
                `indices/${year}/months.json`,
                monthsRes.content,
                monthsRes.sha,
                `Update months ${year}`
            );
        }

        // D. Update Index Bulanan (indices/YYYY/MM/index_MM.json)
        const indexPath = getIndexPath(year, month);
        let indexRes;
        try {
            const data = await getGithubFile(indexPath);
            indexRes = { content: data.content, sha: data.sha };
        } catch (e) { 
            indexRes = { content: [], sha: null }; 
        }

        const newIndexItem = {
          id: postId,
          slug: slug,
          title: t,
          thumbnail: thumbnail,
          author: detailedData.author,
          category: cat,
          date,
          year,
          month 
        };
        indexRes.content.push(newIndexItem);
        await updateGithubFile(indexPath, indexRes.content, indexRes.sha, `Update Index ${month}-${year}`);
        await generateSitemap();
        
        // PEMBERSIHAN FORM & PROSES SELESAI
        closeModal('postModal');
        resetPostModal();
        
        // LANGSUNG DI-REFRESH SECARA INSTAN MENGGUNAKAN DATA BARU
        refreshBlog(newIndexItem, 'create');

    } catch (e) {
        console.error(e);
        alert("Gagal mengirim! Periksa koneksi atau token.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// --- FUNGSI EDIT ---

async function prepareEdit(postId) {
    try {
        requireToken();
        
        // 1. Cari data meta untuk tahu lokasi filenya (Year/Month)
        const post = await findPostById(postId); 
        
        // 2. Isi Form Modal dengan data yang ada
        document.getElementById('postTitle').value = post.title || "";
        document.getElementById('postContent').value = post.content || "";
        document.getElementById('postCategory').value = post.category || "Umum";
        
        // 3. Ubah UI Modal menjadi mode Edit
        document.querySelector('#postModal h2').innerText = "✏️ Edit Postingan";
        const btn = document.getElementById('btnSubmitPost');
        btn.innerText = "Simpan Perubahan";
        btn.onclick = submitEdit; // Arahkan ke fungsi submitEdit
        
        EDIT_POST_ID = postId;
        openModal('postModal');
    } catch (e) {
        console.error(e);
        alert("Gagal mengambil data postingan.");
    }
}

async function submitEdit() {
    const t = document.getElementById('postTitle').value.trim();
    const c = document.getElementById('postContent').value.trim();
    const imgMatch = c.match(/!\[.*?\]\((.*?)\)/);
    const thumbnail = imgMatch ? imgMatch[1] : "assets/img/articel.jpg";
    const cat = document.getElementById('postCategory').value;
    
    if (!t || !c) return alert("Isi judul & konten!");

    const btn = document.getElementById('btnSubmitPost');
    const originalText = btn.innerText;
    btn.innerText = "Saving...";
    btn.disabled = true;

    try {
        // 1. Ambil meta data lama untuk mendapatkan Year dan Month
        const allPosts = await loadAllIndexes();
        const meta = allPosts.find(p => p.id === EDIT_POST_ID);
        
        if (!meta) throw new Error("Post tidak ditemukan di index");

        const postYear = meta.year;
        const postMonth = meta.month;
        const newSlug = generateSlug(t);

        // 2. Update File Detail di posts/YYYY/MM/post_ID.json
        const postPath = getPostPath(EDIT_POST_ID, postYear, postMonth);
        const file = await getGithubFile(postPath);

        file.content.title = t;
        file.content.slug = newSlug;
        file.content.content = c;
        file.content.category = cat;

        await updateGithubFile(postPath, file.content, file.sha, `Edit post ${EDIT_POST_ID}`);

        // 3. Update Index Bulanan (indices/YYYY/MM/index_MM.json)
        const indexPath = getIndexPath(postYear, postMonth);
        const index = await getGithubFile(indexPath);
        const idx = index.content.findIndex(p => p.id === EDIT_POST_ID);

        if (idx !== -1) {
            index.content[idx].title = t;
            index.content[idx].slug = newSlug;
            index.content[idx].category = cat;
            index.content[idx].thumbnail = thumbnail;
            await updateGithubFile(indexPath, index.content, index.sha, `Update Index ${postMonth}-${postYear}`);
            await generateSitemap();
        }

        // Object data baru untuk memanipulasi feed UI secara lokal
        const updatedIndexItem = {
            id: EDIT_POST_ID,
            title: t,
            slug: newSlug,
            category: cat
        };

        // 4. Selesai (Penundaan dihapus)
        resetPostModal();
        closeModal('postModal');
        
        // Perbarui feed secara instan tanpa menunggu cache CDN GitHub
        refreshBlog(updatedIndexItem, 'edit');
        alert("Postingan berhasil diperbarui!");
    } catch (e) {
        console.error(e);
        alert("Gagal menyimpan perubahan!");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function deletePost(postId) {
    if (!confirm("Hapus postingan ini secara permanen?")) return;

    try {
        requireToken();
        
        // 1. Cari meta data post (untuk tahu tahun & bulan)
        const allPosts = await loadAllIndexes();
        const meta = allPosts.find(p => p.id === postId);
        
        if (!meta) throw new Error("Post tidak ditemukan di index");

        const postYear = meta.year;
        const postMonth = meta.month;

        // 2. Hapus dari Index Bulanan (indices/YYYY/MM/index_MM.json)
        const indexPath = getIndexPath(postYear, postMonth);
        const index = await getGithubFile(indexPath);
        
        index.content = index.content.filter(post => post.id !== postId);
        await updateGithubFile(indexPath, index.content, index.sha, `Delete post ${postId} from index`);

        // 3. Hapus File Detail (posts/YYYY/MM/post_ID.json)
        const postPath = getPostPath(postId, postYear, postMonth);
        try {
            const fileDetail = await getGithubFile(postPath);
            if(typeof deleteGithubFile === "function") {
                await deleteGithubFile(postPath, fileDetail.sha, `Permanent delete post ${postId}`);
            } else {
                console.warn("Fungsi delete file detail tidak tersedia, hanya index yang dihapus.");
            }
        } catch (err) {
            console.warn("File fisik tidak ditemukan, kemungkinan sudah terhapus.");
        }
        
        // 4. updaye sitemap
        await generateSitemap();
        
        // 5. Refresh UI secara instan (Penundaan dihapus)
        refreshBlog(postId, 'delete');
        alert("Postingan berhasil dihapus!");
    } catch (e) {
        console.error(e);
        alert("Gagal menghapus postingan.");
    }
}


// FUNGSI PENDUKUNG LAINNYA
function resetPostModal() {
    EDIT_POST_ID = null;
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    document.querySelector('#postModal h2').innerText = "✍️ Tulis Postingan";
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