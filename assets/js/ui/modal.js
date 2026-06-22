window.openModal = function(id){
    document.getElementById(id).style.display = "flex";
}

window.closeModal = function(id){
    document.getElementById(id).style.display = "none";
}

window.openImageModal = function (src) {

    const modal =
        document.getElementById(
            "imageModal"
        );
    const image =
        document.getElementById(
            "fullscreenImage"
        );
    image.src = src;
    modal.classList.remove(
        "hidden"
    );
}

window.closeImageModal = function () {
    document
        .getElementById(
            "imageModal"
        )
        .classList.add(
            "hidden"
        );
}