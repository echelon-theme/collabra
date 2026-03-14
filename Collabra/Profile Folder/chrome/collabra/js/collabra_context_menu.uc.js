// ==UserScript==
// @name			Collabra :: Context Menu
// @description 	Changes to the content area context menu
// @author			aubymori
// @github          https://github.com/aubymori
// @include			main
// ==/UserScript===

{
    var { waitForElement } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);

    /* Add labels to navigation items so they can look exactly like normal items again */

    function onContextNavMutation(list)
    {
        for (const mut of list)
        {
            if ((mut.type == "attributes"
            || mut.type == "childList")
            && mut.target.nodeName == "menuitem")
            {
                for (const item of mut.target.parentNode.children)
                {
                    if (item.label != item.getAttribute("aria-label"))
                    {
                        item.label = item.getAttribute("aria-label");
                    }
                }
            }
        }
    }

    waitForElement("#context-navigation").then(e => {
        let observer = new MutationObserver(onContextNavMutation);
        observer.observe(
            e,
            {
                attributes: true,
                attributeFilter: ["aria-label", "disabled", "label"],
                childList: true,
                subtree: true
            }
        );
        for (const item of e.children)
        {
            item.label = item.getAttribute("aria-label");
        }
    });
}

this.FillHistoryMenu = function _FillHistoryMenu(event) {
    let parent = event.target;

    // Lazily add the hover listeners on first showing and never remove them
    if (!parent.hasStatusListener) {
        // Show history item's uri in the status bar when hovering, and clear on exit
        parent.addEventListener("DOMMenuItemActive", function (aEvent) {
            // Only the current page should have the checked attribute, so skip it
            if (!aEvent.target.hasAttribute("checked")) {
                XULBrowserWindow.setOverLink(aEvent.target.getAttribute("uri"));
            }
        });
        parent.addEventListener("DOMMenuItemInactive", function () {
            XULBrowserWindow.setOverLink("");
        });

        parent.hasStatusListener = true;
    }

    // Remove old entries if any
    let children = parent.children;
    for (var i = children.length - 1; i >= 0; --i) {
        if (children[i].hasAttribute("index")) {
            parent.removeChild(children[i]);
        }
    }

    const MAX_HISTORY_MENU_ITEMS = 15;

    function updateSessionHistory(sessionHistory, initial, ssInParent) {
        let count = ssInParent
            ? sessionHistory.count
            : sessionHistory.entries.length;

        if (!initial) {
            if (count <= 1) {
                // if there is only one entry now, close the popup.
                parent.hidePopup();
                return;
            } else if (parent.id != "backForwardMenu" && !parent.parentNode.open) {
                // if the popup wasn't open before, but now needs to be, reopen the menu.
                // It should trigger FillHistoryMenu again. This might happen with the
                // delay from click-and-hold menus but skip this for the context menu
                // (backForwardMenu) rather than figuring out how the menu should be
                // positioned and opened as it is an extreme edgecase.
                parent.parentNode.open = true;
                return;
            }
        }

        let index = sessionHistory.index;
        let half_length = Math.floor(MAX_HISTORY_MENU_ITEMS / 2);
        let start = Math.max(index - half_length, 0);
        let end = Math.min(
            start == 0 ? MAX_HISTORY_MENU_ITEMS : index + half_length + 1,
            count
        );
        if (end == count) {
            start = Math.max(count - MAX_HISTORY_MENU_ITEMS, 0);
        }

        let existingIndex = 0;

        for (let j = end - 1; j >= start; j--) {
            let entry = ssInParent
                ? sessionHistory.getEntryAtIndex(j)
                : sessionHistory.entries[j];
            // Explicitly check for "false" to stay backwards-compatible with session histories
            // from before the hasUserInteraction was implemented.
            if (
                BrowserUtils.navigationRequireUserInteraction &&
                entry.hasUserInteraction === false &&
                // Always list the current and last navigation points.
                j != end - 1 &&
                j != index
            ) {
                continue;
            }
            let uri = ssInParent ? entry.URI.spec : entry.url;

            let item =
                existingIndex < children.length
                    ? children[existingIndex]
                    : document.createXULElement("menuitem");

            let displayNumber = existingIndex;

            item.setAttribute("uri", uri);
            item.setAttribute("accesskey", displayNumber);
            item.setAttribute("label", `${displayNumber} ${entry.title || uri}`);
            item.setAttribute("index", j);

            // Cache this so that BrowserCommands.gotoHistoryIndex doesn't need the
            // original index
            item.setAttribute("historyindex", j - index);

            if (!item.parentNode) {
                parent.appendChild(item);
            }

            existingIndex++;
        }

        if (!initial) {
            let existingLength = children.length;
            while (existingIndex < existingLength) {
                parent.removeChild(parent.lastElementChild);
                existingIndex++;
            }
        }
    }

    // If session history in parent is available, use it. Otherwise, get the session history
    // from session store.
    let sessionHistory = gBrowser.selectedBrowser.browsingContext.sessionHistory;
    if (sessionHistory?.count) {
        // Don't show the context menu if there is only one item.
        if (sessionHistory.count <= 1) {
            event.preventDefault();
            return;
        }

        updateSessionHistory(sessionHistory, true, true);
    } else {
        sessionHistory = SessionStore.getSessionHistory(
            gBrowser.selectedTab,
            updateSessionHistory
        );
        updateSessionHistory(sessionHistory, true, false);
    }
}