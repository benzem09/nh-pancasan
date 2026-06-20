// ======================
// THEME SYSTEM
// ======================

function setTheme(theme){

    document.body.classList.remove(
        "dark"
    );

    if(theme === "dark"){
        document.body.classList.add(
            "dark"
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
            "dark"
        );

    setTheme(
        isDark
            ? "light"
            : "dark"
    );

}

function loadTheme(){

    const savedTheme =
        localStorage.getItem(
            "theme"
        ) || "light";

    setTheme(savedTheme);

}

document.addEventListener(
    "DOMContentLoaded",
    loadTheme
);

