// ==UserScript==
// @name			Collabra :: Layout
// @description 	Creates the layout for Collabra
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include			(.*)
// @loadOrder       0
// ==/UserScript==

var g_CollabraLayout;

{
    var { waitForElement, PrefCalls, setAttributes, LocaleUtils } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);

    class ToolbarGrippyElement extends MozXULElement
    {
        static get fragment() {
            let frag = document.importNode(
            MozXULElement.parseXULToFragment(`
                <image class="toolbargrippy-arrow" />
                <spacer class="toolbargrippy-texture" flex="1" />
                <image class="toolbargrippy-end" />
            `),
            true
            );
            Object.defineProperty(this, "fragment", { value: frag });
            return frag;
        }

        get _hasRendered() {
            return this.querySelector(":scope > .toolbargrippy-arrow") != null;
        }

        get collapsed() {
            return this.hasAttribute("moz_grippy_collapsed");
        }

        set collapsed(val) {
            if (val) {
                this.setAttribute("moz_grippy_collapsed", "true");
            }
            else {
                this.removeAttribute("moz_grippy_collapsed");
            }

            return val;
        }

        get toolbarStates() {
            try {
			    return JSON.parse(Services.prefs.getCharPref("collabra.toolbar.states"));
            }
            catch (e) {
                // If the preference doesn't exist (or any other error occurs
                // during retrieval), then we'll just return an empty array
                // rather than having the exception bubble up. This getter is
                // accessed in writeGrippyState(), which caused it to crash
                // before it even gets to setToolbarStates().
                return [];
            }
		}

        setToolbarStates(states) {
            PrefCalls.setPref("collabra.toolbar.states", JSON.stringify(states));
        }

        writeGrippyState(toolbarNode, state)
        {
            const toolbarStates = this.toolbarStates;
            let toolbarNodeID = toolbarNode.id;

            const collapsedToolbar = {
                id: toolbarNodeID,
                collapsed: state,
            };

            let duplicate = toolbarStates.find(prop => prop.id == toolbarNodeID);

            if (duplicate) {
                duplicate.collapsed = state;
            }
            else {
                toolbarStates.push(collapsedToolbar);
            }

            this.setToolbarStates(toolbarStates);
        } 

        connectedCallback() {
            if (this.delayConnectedCallback())
                return;

            this.render();
        }

        render() {
            if (this._hasRendered)
                return;

            this.appendChild(this.constructor.fragment.cloneNode(true));

            this.addEventListener("command", this.grippyTriggered);
            this.addEventListener("click", this.grippyTriggered);
        }
        
        returnNode(aNodeA, aNodeB) {
            var node = this.parentNode;

            while (node && node.localName != "window" &&
                (node.localName != aNodeA && (node.localName != aNodeB))) {
                node = node.parentNode;
            }

            return node;
        }

        collapseToolbar(toolbar)
        {
            try
            {
                this.createCollapsedGrippy(toolbar);
                toolbar.setAttribute("collabra_collapsed", "true");
                this.writeGrippyState(toolbar, true);
            }
            catch (e) {
                throw e
            }
        }

        expandToolbar(aGrippyID)
        {
            var idString = aGrippyID.substring("moz_tb_collapsed_".length, aGrippyID.length);
            var toolbar = document.getElementById(idString);

            toolbar.setAttribute("collabra_collapsed", "false");

            try {
                this.writeGrippyState(toolbar, false);
            }
            catch (e) {
                // We handle this as non-fatal so the GUI can clean up even when
                // writing the grippy state to preferences fails. That way, the
                // collapsed grippy elements don't stick around and accumulate.
                console.error("Error when writing toolbar grippy state:", e);
            }

            var collapsedTray = document.querySelector(".collapsed-tray-holder .collapsed-tray");
            var collapsedToolbar = document.getElementById("moz_tb_collapsed_" + toolbar.id);

            collapsedTray.removeChild(collapsedToolbar);

            if (!collapsedTray.hasChildNodes()) 
                document.querySelector(".collapsed-tray-holder").setAttribute("collapsed", "true");
        }

        createCollapsedGrippy(aToolbar)
        {
            var toolbarGrippy = aToolbar.querySelector("toolbargrippy");
            var collapsedGrippy = document.createXULElement("toolbargrippy");

            if (collapsedGrippy) {
                collapsedGrippy.className = toolbarGrippy.className;

                collapsedGrippy.setAttribute("id", "moz_tb_collapsed_" + aToolbar.id);
                collapsedGrippy.setAttribute("moz_grippy_collapsed", "true"); 
                collapsedGrippy.setAttribute("tbgrippy-collapsed", "true");
                collapsedGrippy.setAttribute("tooltiptext", aToolbar.getAttribute("toolbarname"));

                var collapsedTrayHolder = document.querySelector(".collapsed-tray-holder");
                if (collapsedTrayHolder.getAttribute("collapsed"))
                    collapsedTrayHolder.removeAttribute("collapsed");

                document.querySelector(".collapsed-tray-holder .collapsed-tray").appendChild(collapsedGrippy);

                var temp;
                if (collapsedGrippy != (temp = document.getElementById("moz_tb_collapsed_" + aToolbar.id))) {
                    console.error("Collapsed grippy element mismatch.", collapsedGrippy, temp);
                }
            }
        }

        grippyTriggered(event) {
            var toolbar = this.returnNode("toolbar", "menubar");

            if (this.collapsed) {
                this.expandToolbar(this.id);
            }
            else {
                this.collapseToolbar(toolbar);
            }
        }
    }
    customElements.define("toolbargrippy", ToolbarGrippyElement);

    class CollabraLayoutManager {
        static alreadyRan = false;
        
        get internalToolbarFragment()
        {
            return `
                <vbox flex="1" class="toolbar-internal-box">

                </vbox>
                <hbox class="collapsed-tray-holder" collapsed="true">
                    <hbox class="collapsed-tray">
                    
                    </hbox>
                    <spacer class="collapsed-tray-spacer" />
                </hbox>
			`;
        }

        async init()
        {
            await new Promise(resolve => {
                let delayedStartupObserver = (aSubject, aTopic, aData) => {
                    Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
                    resolve();
                };
                Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
            });

            this._createLocationToolbar();
            this.appendTabBarCloseButton();

            let navigatorToolbox = gNavToolbox;
            let fragment = this.internalToolbarFragment;
            
            navigatorToolbox.appendChild(window.MozXULElement.parseXULToFragment(fragment));

            let internalBox = navigatorToolbox.querySelector(".toolbar-internal-box");
            let toolbars = navigatorToolbox.querySelectorAll("toolbar");

            toolbars.forEach(toolbar => {
                if (toolbar.id !== "TabsToolbar" && toolbar.id !== "toolbar-menubar" && toolbar.id !== "notifications-toolbar") {
                    let toolbargrippy = document.createXULElement("toolbargrippy");

                    if (toolbar.id == "nav-bar") {
                        toolbargrippy.setAttribute("class", "toolbar-primary-grippy");
                    }
                    
                    toolbar.insertBefore(toolbargrippy, toolbar.firstChild);

                    internalBox.appendChild(toolbar);
                }

                if (toolbar.id == "TabsToolbar") {
                    document.querySelector("#tabbrowser-tabbox").insertBefore(toolbar, document.querySelector("#tabbrowser-tabbox").firstChild);
                    toolbar.removeAttribute("flex");
                }
            });

            window.addEventListener(
                "customizationstarting",
                this.customizeModeManager
            );
            window.addEventListener(
                "aftercustomization",
                this.customizeModeManager
            );
        }

        customizeModeManager = new (class {
            handleEvent(event)
            {
                switch (event.type)
                {
                    case "customizationstarting":
                        document.querySelector("#browser").removeAttribute("flex");
                        break;
                    case "aftercustomization":
                        document.querySelector("#browser").setAttribute("flex", "1");
                        break;
                }
            }
        });
        
        _createLocationToolbar() {
            if (this.alreadyRan)
            {
                return;
            }

            let navigatorToolbox = gNavToolbox;
            let toolbarElement = document.createXULElement("toolbar");

            let toolbarElementAttrs = {
                "id": "LocationToolbar",
                "class": "toolbar-primary chromeclass-toolbar browser-toolbar customization-target",
                //"toolbarname": LocaleUtils.str(toolboxBundle, "toolbox_address_toolbar.label"),
                //"accesskey": LocaleUtils.str(toolboxBundle, "toolbox_address_toolbar.accesskey"),
                "customizable": "true",
                "context": "toolbar-context-menu",
                "mode": "icons",
                "iconsize": "small",
                "toolboxid": "navigator-toolbox",
            }

            setAttributes.set(toolbarElement, toolbarElementAttrs);

            document.getElementById("urlbar-container").setAttribute("removable", "true");

            CustomizableUI.registerArea("LocationToolbar", {
                type: CustomizableUI.TYPE_TOOLBAR,
                legacy: true,
                defaultPlacements: [
                    "bookmarks-menu-button",
                    "urlbar-container",
                    "whats-related-button"
                ],
            });

            navigatorToolbox.insertBefore(toolbarElement, navigatorToolbox.querySelector("#PersonalToolbar"));

            CustomizableUI.registerToolbarNode(toolbarElement);

            this.alreadyRan = true;
        }

        appendTabBarCloseButton()
        {
            let tabsToolbar = document.querySelector("#TabsToolbar");

            let closeButton = window.MozXULElement.parseXULToFragment(`
                <hbox class="tabs-closebutton-box" align="center" pack="end">
                    <toolbarbutton id="tabs-closebutton" class="tabs-closebutton close-icon">
                    </toolbarbutton>
                </hbox>
            `);

            tabsToolbar.querySelector("#TabsToolbar-customization-target").appendChild(closeButton);

            let closeButtonElem = document.getElementById("tabs-closebutton");

            closeButtonElem.addEventListener("click", (e) => {
                if (e.button !== 0)
                    return

                gBrowser.removeCurrentTab();
            });
        }
    }

    g_CollabraLayout = new CollabraLayoutManager;
    g_CollabraLayout.init();
}
