window.toggleWideMode = function(){
    const app = document.getElementById("appContainer");
    const btn = document.getElementById("screenModeBtn");

    app.classList.toggle("wide-mode");

    const enabled = app.classList.contains("wide-mode");

    localStorage.setItem("wide_mode", enabled);

    if (btn) btn.classList.toggle("wide-active", enabled);
}

window.loadWideMode = function(){

    const wide =
        localStorage.getItem(
            "wide_mode"
        ) === "true";

    if (wide) {

        document
            .getElementById("appContainer")
            ?.classList.add("wide-mode");

        document
            .getElementById("screenModeBtn")
            ?.classList.add("wide-active");
    }
}