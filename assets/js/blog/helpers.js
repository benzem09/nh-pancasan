// helpers.js

function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function getDateParts() {
    const now = new Date();
    return {
        year: String(now.getFullYear()),
        // Pastikan bulan selalu 2 digit (01-12)
        month: String(now.getMonth() + 1).padStart(2, "0"),
        date: now.toISOString().split("T")[0]
    };
}

function getPostPath(postId, year, month) {
    // Hasil: posts/2026/05/post_123.json
    return `posts/${year}/${month}/post_${postId}.json`;
}

function getIndexPath(year, month) {
    // Hasil: indices/2026/05/index_05.json
    return `indices/${year}/${month}/index_${month}.json`;
}

async function findPostById(postId) {
    // 1. Ambil semua index untuk mencari meta data (Year & Month)
    const allPosts = await loadAllIndexes();
    
    // Pastikan perbandingan ID menggunakan String/Number yang konsisten
    const meta = allPosts.find(p => String(p.id) === String(postId));

    if (!meta) {
        console.error("ID tidak ditemukan di index:", postId);
        throw new Error("Postingan tidak terdaftar di index.");
    }

    // 2. Gunakan year dan month dari index untuk mengambil file asli
    const path = getPostPath(meta.id, meta.year, meta.month);
    
    console.log("Mencoba mengambil file dari:", path); // Untuk debugging di console

    return await getPublicFile(path);
}


function executeDownload(content, filename) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}