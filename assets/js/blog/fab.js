// DRAG FAB
let isDraggingFab = false;
let fabStartY = 0;
let fabStartTop = 0;

const fabContainer = document.getElementById("floatingAction");

fabContainer.addEventListener('mousedown', startFabDrag);
fabContainer.addEventListener('touchstart', startFabDrag, { passive: false });

function startFabDrag(e) {
    isDraggingFab = true;

    const touch = e.touches ? e.touches[0] : e;
    fabStartY = touch.clientY;
    fabStartTop = fabContainer.offsetTop;
}

document.addEventListener('mousemove', doFabDrag);
document.addEventListener('touchmove', doFabDrag, { passive: false });

function doFabDrag(e) {
    if (!isDraggingFab) return;

    const touch = e.touches ? e.touches[0] : e;

    let newTop = fabStartTop + (touch.clientY - fabStartY);

    if (newTop < 50) newTop = 50;
    if (newTop > window.innerHeight - 180) {
        newTop = window.innerHeight - 180;
    }

    fabContainer.style.top = newTop + "px";
    fabContainer.style.bottom = "auto";

    document.querySelectorAll('.fab-popup').forEach(p => {
        p.style.top = newTop + "px";
        p.style.bottom = "auto";
    });
}

document.addEventListener('mouseup', () => isDraggingFab = false);
document.addEventListener('touchend', () => isDraggingFab = false);