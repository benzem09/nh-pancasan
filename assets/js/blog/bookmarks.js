console.log("bookmarks.js loaded");

window.getBookmarks = function() {
    return JSON.parse(localStorage.getItem("bookmarks") || "[]");
};

window.isBookmarked = function(postId) {
    return getBookmarks().includes(String(postId));
};

window.toggleBookmark = function(postId) {
    let bookmarks = getBookmarks();
    postId = String(postId);

    if (bookmarks.includes(postId)) {
        bookmarks = bookmarks.filter(id => id !== postId);
    } else {
        bookmarks.push(postId);
    }

    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
    updateBookmarkButton(postId);
};

window.updateBookmarkButton = function(postId) {
    const btn = document.getElementById("bookmarkBtn");
    if (!btn) return;

    btn.innerText = isBookmarked(postId)
        ? "🔖 Disimpan"
        : "🔖 Simpan";
};

