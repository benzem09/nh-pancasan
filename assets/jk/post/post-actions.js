console.log("post-actions.js loaded");

window.initPostActions = function (post) {
    // TOC
    document.getElementById('btnToc').onclick = (e) => {
        e.stopPropagation();
        toggleFabPopup('tocPopup');
    };

    // SEARCH
    document.getElementById('btnSearch').onclick = (e) => {
        e.stopPropagation();
        toggleFabPopup('searchPopup');
    };

    const searchInput = document.getElementById("searchInPost");
    if (searchInput) {
        searchInput.oninput = function () {
            if (typeof highlightText === "function") highlightText(this.value);
        };
    }

    // SHARE
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
}