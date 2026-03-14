// ==UserScript==
// @name			Collabra :: Menu Accelerator
// @description     Adds widest menu accelerator width to all of them to recreate Win32 behavior
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include         main
// ==/UserScript==

document.addEventListener("popupshown", (e) => {
    let menupopup = e.target;

    let accelsNodeList = menupopup.querySelectorAll(".menu-accel");
    if (!accelsNodeList || accelsNodeList.lenght == 0)
        return

    accelsNodeList.forEach(menuAccel => {
        menuAccel.style.width = "";
    })

    var menuAccelWidth = 0;
    accelsNodeList.forEach(menuAccel => {
        if (menuAccel.scrollWidth > menuAccelWidth) {
            menuAccelWidth = menuAccel.scrollWidth;
        }
    })

    accelsNodeList.forEach(menuAccel => {
        menuAccel.style.width = menuAccelWidth + "px";
    })
}, true);