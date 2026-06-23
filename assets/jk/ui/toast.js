window.showViewPopup = function(count){

    const popup =
        document.getElementById("viewPopup");

    const text =
        document.getElementById("popupViewCount");

    text.textContent = count;

    popup.classList.remove("hidden");

    setTimeout(() => {
        popup.classList.add("show");
    }, 10);

    setTimeout(() => {

        popup.classList.remove("show");

        setTimeout(() => {
            popup.classList.add("hidden");
        }, 300);

    }, 2200);
};