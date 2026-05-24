function openImageModal(src) {

    const modal =
        document.getElementById(
            "imageModal"
        );

    const img =
        document.getElementById(
            "fullscreenImage"
        );

    img.src = src;
    modal.style.display = "flex";
}

function closeImageModal() {

    const modal =
        document.getElementById(
            "imageModal"
        );

    modal.style.display = "none";
}
