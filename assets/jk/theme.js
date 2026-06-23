// ======================
// THEME SYSTEM
// ======================

function setTheme(theme){

    document.body.classList.remove(
        "light"
    );

    if(theme === "light"){
        document.body.classList.add(
            "light"
        );
    }

    localStorage.setItem(
        "theme",
        theme
    );

}

function toggleTheme(){

    const isDark =
        document.body.classList.contains(
            "light"
        );

    setTheme(
        isDark
            ? "dark"
            : "light"
    );

}

function loadTheme(){

    const savedTheme =
        localStorage.getItem(
            "theme"
        ) || "dark";

    setTheme(savedTheme);

}

document.addEventListener(
    "DOMContentLoaded",
    loadTheme
);

