// ==UserScript==
// @name			Collabra :: URLbar
// @description 	Several modifications to the URlBar
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include         main
// ==/UserScript==

{
    var { waitForElement, LocaleUtils } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);

    waitForElement("#urlbar").then(e => {
        let dropmarker = window.MozXULElement.parseXULToFragment(`
            <dropmarker id="historydropmarker" class="autocomplete-history-dropmarker urlbar-history-dropmarker"/>
        `);

        let urlbarInputContainer = e.querySelector(".urlbar-input-container");

        urlbarInputContainer.appendChild(dropmarker);

        e.querySelector(".urlbar-history-dropmarker").addEventListener("mousedown", openURLView);
        
        function openURLView() {
            // Related Firefox code involving opening the URLbar Dropdown seems to use
            // Private Properties, so this will do for now.
            gURLBar._inputContainer.click();
            gURLBar.searchMode = {
                source: UrlbarUtils.RESULT_SOURCE.BOOKMARKS,
                entry: "shortcut",
            };
            gURLBar.search(gURLBar.value);
            gURLBar.select();
        }
    });
}