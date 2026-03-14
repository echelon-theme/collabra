// ==UserScript==
// @name			Collabra :: Menu Bar
// @description 	Scripts to restore the "Navigator" menu
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include			main
// ==/UserScript===

var g_NavigatorMenu;

{
    var { renderElement, PrefCalls, LocaleUtils, waitForElement } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);
    renderElement = renderElement.bind(window);

    let menusBundle = "chrome://collabra/locale/properties/menus.properties";
    
    const NAVIGATOR_MENU_XUL = 
    `
    <menu id="navigator-menu" label="${LocaleUtils.str(menusBundle, 'navigator_menu.label')}" accesskey="${LocaleUtils.str(menusBundle, 'navigator_menu.accesskey')}">
        <menupopup id="menu_NavigatorPopup">
        </menupopup>
    </menu>
    `;

    class NavigatorMenu {
        elm = renderElement;

        get menupopup()
        {
            let menupopup = document.getElementById("menu_NavigatorPopup");
            Object.defineProperty(this, "menupopup", {
                value: menupopup,
                writable: false
            });
            return menupopup;
        }

        get menupopupItems() {
            return [
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_navigator",
                    "oncommand": "OpenBrowserWindow()",
                    "acceltext": "Ctrl+1",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_navigator.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_navigator.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_messenger",
                    "command": "Tools:PrivateBrowsing",
                    "acceltext": "Ctrl+2",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_messenger.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_messenger.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_composer",
                    "command": "Tools:PrivateBrowsing",
                    "acceltext": "Ctrl+4",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_composer.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_composer.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_aol",
                    "command": "Tools:PrivateBrowsing",
                    "acceltext": "Ctrl+9",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_aol.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_aol.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_radio",
                    "command": "Tools:PrivateBrowsing",
                    "acceltext": "Ctrl+7",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_radio.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_radio.accesskey')
                }),
                this.elm("xul:menuseparator", {}),
                this.elm("xul:menu", {
                    "id": "navigatorMenu_bookmarks",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_bookmarks.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_bookmarks.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_newsgroups",
                    "command": "Tools:PrivateBrowsing",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_newsgroups.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_newsgroups.accesskey')
                }),
                this.elm("xul:menuitem", {
                    "id": "navigatorMenu_addr",
                    "command": "Tools:PrivateBrowsing",
                    "acceltext": "Ctrl+Shift+2",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_addr.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_addr.accesskey')
                }),
                this.elm("xul:menuseparator", {}),
                this.elm("xul:menu", {
                    "id": "navigatorMenu_tools",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_tools.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_tools.accesskey')
                }),
                this.elm("xul:menu", {
                    "id": "navigatorMenu_serverTools",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_serverTools.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_serverTools.accesskey')
                }, [
                    this.elm("xul:menupopup", {}, [
                        this.elm("xul:menuitem", {
                            "id": "navigatorMenu_pageServices",
                            "label": LocaleUtils.str(menusBundle, 'navigatorMenu_pageServices.label'),
                            "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_pageServices.accesskey'),
                            "disabled": "true",
                        }),
                    ]),
                ]),
                this.elm("xul:menuseparator", {}),
                this.elm("xul:menu", {
                    "id": "navigatorMenu_window",
                    "label": LocaleUtils.str(menusBundle, 'navigatorMenu_window.label'),
                    "accesskey": LocaleUtils.str(menusBundle, 'navigatorMenu_window.accesskey')
                }, [
                    this.elm("xul:menupopup", {"id": "navigatorMenu_window_menupopup"}),
                ]),
            ];
        }

        init() {
            this.menupopup.addEventListener("popupshowing", this.populateMenupopup.bind(this));
        }

        switchTo(win)
        {
            try
            {
                win.document.commandDispatcher.focusedWindow.focus();
            }
            catch(err)
            {
                win.focus();
            }
        }

        populateMenupopup(e) {
            let menupopup = e.target;

            if (menupopup.id !== "menu_NavigatorPopup") 
                return

            menupopup.innerHTML = '';

            for (let item of this.menupopupItems) {
                if (item.id === "navigatorMenu_bookmarks") {
                    let menubarPopup = document.getElementById("bookmarksMenuPopup");
                    item.innerHTML = '';
                    item.appendChild(menubarPopup.cloneNode(true));
                }
                
                menupopup.appendChild(item);
            }

            let windowList = Services.wm.getEnumerator("navigator:browser");
            let index = 0;
            for (let win of windowList)
            {
                let winIndex = ++index;
                let item = document.createXULElement("menuitem");
                item.setAttribute("type", "radio");
                if (win == window)
                    item.setAttribute("checked", "true");
                item.setAttribute("class", "window-item");
                item.setAttribute("label", String(winIndex) + " " + win.document.title);
                item.setAttribute("accesskey", String(winIndex));
                item.addEventListener("command", () => {
                    this.switchTo(win);
                });
                document.getElementById("navigatorMenu_window_menupopup").appendChild(item);
            }

            let toolsMenu = document.getElementById("navigatorMenu_tools");
            let menuWebDeveloper = document.getElementById("menuWebDeveloperPopup");

            let evt = new Event("popupshowing", {
                bubbles: true,
                cancelable: true,
            });

            menuWebDeveloper.dispatchEvent(evt);
            
            toolsMenu.appendChild(menuWebDeveloper.cloneNode(true));
        }
    }

    g_NavigatorMenu = new NavigatorMenu;

    waitForElement("#tools-menu").then((menu) => {
        let fragment = MozXULElement.parseXULToFragment(NAVIGATOR_MENU_XUL);
        menu.insertAdjacentElement("afterend", fragment.children[0]);

        g_NavigatorMenu.init();
    });
}