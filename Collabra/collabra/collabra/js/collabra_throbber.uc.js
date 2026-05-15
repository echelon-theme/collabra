// ==UserScript==
// @name			Collabra :: Throbber
// @description 	Throbber Behavior
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include         main
// ==/UserScript==

var NavigatorThrobber = {
    get busy() {
        return gBrowser.selectedTab.hasAttribute("busy");
    },

    init() {
        document.addEventListener("TabAttrModified", this._update, false);
        document.addEventListener("TabSelect", this._update, false);
        document.addEventListener("TabOpen", this._update, false);
        document.addEventListener("TabClose", this._update, false);
        document.addEventListener("load", this._update, false);

        return document;
    },

    _update() {
        let busy = gBrowser.selectedTab.hasAttribute("busy");
        let throbber = document.querySelector("#navigator-throbber");

        if (busy)
        {
            throbber.setAttribute("busy", "true");

            document.dispatchEvent(new CustomEvent("collabra-navigation-busy"));
        }
        else {
            throbber.removeAttribute("busy");
            document.dispatchEvent(new CustomEvent("collabra-navigation-done"));
        }
    },
}