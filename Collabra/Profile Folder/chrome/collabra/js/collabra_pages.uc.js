// ==UserScript==
// @name			Spyglass :: About Pages
// @description 	Manages the custom about: pages of Spyglass.
// @author			aubymori, ephemeralViolette
// @github          https://github.com/aubymori
// @github          https://github.com/ephemeralViolette
// @include			main
// ==/UserScript==

{
    const ABOUT_PAGES = {
		"collabra-options": "chrome://userchrome/content/windows/collabra-options/collabra-options.xhtml",
    };
    const { AboutPageManager } = ChromeUtils.importESModule("chrome://modules/content/AboutPageManager.sys.mjs");

    for (const page in ABOUT_PAGES)
    {
        AboutPageManager.registerPage(
            page,
            ABOUT_PAGES[page]
        );
    }
}