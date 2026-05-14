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
    const allPosts = await loadAllIndexes();
    const meta = allPosts.find(post => post.id === postId);

    if (!meta) {
        throw new Error("Post tidak ditemukan");
    }

    return await getPublicFile(
        getPostPath(postId, meta.year, meta.month)
    );
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