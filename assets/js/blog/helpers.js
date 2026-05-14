// 1. FUNGSI PEMBANTU (Helper)
function getPostPath(postId, year, month) {
    // Path: posts/2026/05/post_12345.json
    return `posts/${year}/${month}/post_${postId}.json`;
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

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

function getIndexPath(year, month) {
    // Path: indices/2026/05/index_05.json
    return `indices/${year}/${month}/index_${month}.json`;
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

async function findPostById(postId) {
    // Memuat semua index bulan/tahun untuk mencari koordinat post
    const allPosts = await loadAllIndexes(); 
    const meta = allPosts.find(post => post.id === postId);

    if (!meta) {
        throw new Error("Post tidak ditemukan");
    }

    // Mengambil file fisik berdasarkan tahun dan bulan dari meta index
    return await getPublicFile(
        getPostPath(postId, meta.year, meta.month)
    );
}
