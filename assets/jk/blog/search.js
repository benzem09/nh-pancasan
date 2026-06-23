//search
function highlightText(keyword) {
    const content = document.getElementById("main-post-content");
    if (!content) return;

    // reset dulu
    const original = content.dataset.original || content.innerHTML;
    if (!content.dataset.original) {
        content.dataset.original = original;
    }

    if (!keyword.trim()) {
        content.innerHTML = original;
        return;
    }

    const regex = new RegExp(`(${keyword})`, "gi");

    content.innerHTML = original.replace(
        regex,
        `<mark class="search-highlight">$1</mark>`
    );
}