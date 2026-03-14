// ==UserScript==
// @name           Collabra :: Menu Bar
// @description    poop
// @author	       travy-patty
// @github         https://github.com/aubymori
// @github         https://github.com/travy-patty
// ==/UserScript==

{
    var { LocaleUtils, waitForElement } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);

    let menusBundle = "chrome://collabra/locale/properties/menus.properties";

    waitForElement("#history-menu").then((menu) => {
        menu.setAttribute("label", LocaleUtils.str(menusBundle, "history_menu.label"));
        menu.setAttribute("accesskey", LocaleUtils.str(menusBundle, "history_menu.accesskey"));
        menu.removeAttribute("data-l10n-id");
    });
}