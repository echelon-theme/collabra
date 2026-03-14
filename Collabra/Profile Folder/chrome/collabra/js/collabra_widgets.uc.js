// ==UserScript==
// @name			Collabra :: Widget Manager
// @description 	Manages the installation of custom CustomizableUI widgets.
// @author			ephemeralViolette
// @github          https://github.com/ephemeralViolette
// @include         main
// ==/UserScript==

{

let { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
let { PrefCalls, LocaleUtils } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
let widgetsBundle = "chrome://collabra/locale/properties/custom-widgets.properties";

function shellExecute(filePath, commandLineArgs) {
    const HWND = ctypes.voidptr_t;
    const LPCWSTR = ctypes.jschar.ptr;
    const HINSTANCE = ctypes.voidptr_t;
    const UINT = ctypes.uint32_t;
    const SW = { SHOWNORMAL: 1 };

    const shell32 = ctypes.open("shell32.dll");

    const ShellExecuteW = shell32.declare(
        "ShellExecuteW",
        ctypes.winapi_abi,
        HINSTANCE,
        HWND, LPCWSTR, LPCWSTR, LPCWSTR, LPCWSTR, UINT
    );

    const filePathWide = ctypes.jschar.array()(filePath);
    const commandLineArgsWide = ctypes.jschar.array()(commandLineArgs);

    const hInstance = ShellExecuteW(
        null,
        "open",
        filePathWide,
        commandLineArgsWide,
        null,
        SW.SHOWNORMAL
    );

    if (hInstance <= 32) 
        console.error("Error starting "+ filePath +". "+ hInstance.toString())

    shell32.close();
}

function openInstantMsgPref() {
    let instantMsgPath = PrefCalls.getPref("collabra.toolbarbutton.instant-message.command");

    let msgClientPath = "";
    let msgClientArgs = "";

    if (instantMsgPath.startsWith('"')) {
        let endQuote = instantMsgPath.indexOf('"', 1);
        msgClientPath = instantMsgPath.substring(1, endQuote);
        msgClientArgs = instantMsgPath.substring(endQuote + 1).trim();
    } else {
        let firstSpace = instantMsgPath.indexOf(" ");
        if (firstSpace === -1) {
            msgClientPath = instantMsgPath;
        } else {
            msgClientPath = instantMsgPath.substring(0, firstSpace);
            msgClientArgs = instantMsgPath.substring(firstSpace + 1);
        }
    }

    shellExecute(msgClientPath, msgClientArgs);
}

class CollabraWidgetManager
{
    static alreadyRan = false;

    static async queueCustomWidgetInstallation()
    {
        if (this.alreadyRan)
        {
            return;
        }

        await new Promise(resolve => {
            let delayedStartupObserver = (aSubject, aTopic, aData) => {
                Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
                resolve();
            };
            Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
        });

        this.createWidget({
            id: "navigator-throbber",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "navigator_throbber.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "navigator_throbber.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                if (e.button == 0) {
                    return openTrustedLinkIn(getHelpLinkURL("firefox-help"), "tab");
                }
            },
            
            onCreated: function(toolbarbutton) {
                toolbarbutton.classList.remove("toolbarbutton-1"); 
                NavigatorThrobber.init();
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "search-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "search_button.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "search_button.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                return; // TODO
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "netscape-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "netscape_button.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "netscape_button.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                return; // TODO
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "security-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "security_button.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "security_button.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                if (e.button == 0) {
                    return displaySecurityInfo();
                }
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "shop-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "shop_button.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "shop_button.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                return; // TODO
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "whats-related-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "whats_related.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "whats_related.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                return; // TODO
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "instant-message-button",
            type: "button",
            removable: true,

            label: LocaleUtils.str(widgetsBundle, "instant_message_button.label"),
            tooltiptext: LocaleUtils.str(widgetsBundle, "instant_message_button.tooltiptext"),
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onClick: function(e) {
                return openInstantMsgPref();
            },
            
            onCreated: function(toolbarbutton) {
                return toolbarbutton;
            },
        });

        this.createWidget({
            id: "link-button",
            type: "custom",
            removable: true,
            defaultArea: CustomizableUI.AREA_NAVBAR,

            onBuild: function(aDocument) {
                let toolbaritem = aDocument.createXULElement("toolbaritem");
                let attributes = {
                    id: "link-button",
                    class: "chromeclass-toolbar-additional",
                    overflows: "true",
                }

                for (let attr in attributes) {
                    toolbaritem.setAttribute(attr, attributes[attr]);
                }

                let toolbaritemfragment = aDocument.defaultView.MozXULElement.parseXULToFragment(`
                    <box class="link-draggable-icon-container">
                        <image class="link-drag-icon" />
                    </box>

                    <label class="urlbar-label" value="Location:" />
                `);

                toolbaritem.appendChild(toolbaritemfragment);

                let urlbarLinkLabel = toolbaritem.querySelector(".urlbar-label");

                let urlbar = aDocument.getElementById("urlbar");
                if (urlbar) {
                    let observer = new aDocument.defaultView.MutationObserver((mut) => {
                        if (urlbar.hasAttribute("usertyping")) {
                            urlbarLinkLabel.setAttribute("value", "Go to:");
                        } 
                        else {
                            urlbarLinkLabel.setAttribute("value", "Location:");
                        }
                    });

                    observer.observe(urlbar, {
                        attributes: true,
                        attributeFilter: ["usertyping"]
                    });
                }

                let urlbarLinkLabelTemp = aDocument.createXULElement("label");
                urlbarLinkLabelTemp.setAttribute("value", "Location:");
                urlbarLinkLabelTemp.style.position = "absolute";
                urlbarLinkLabelTemp.style.top = "0px";
                urlbarLinkLabelTemp.style.left = "0px";
                urlbarLinkLabelTemp.style.visibility = "hidden";

                aDocument.body.appendChild(urlbarLinkLabelTemp);

                let urlbarLinkLabelWidth = urlbarLinkLabelTemp.getBoundingClientRect().width;

                aDocument.body.removeChild(urlbarLinkLabelTemp);

                urlbarLinkLabel.style.width = urlbarLinkLabelWidth + "px";;

                return toolbaritem;
            },
        });
        
        this.renameWidget("bookmarks-menu-button", LocaleUtils.str(widgetsBundle, "bookmarks_button.label"))

        window.addEventListener(
            "customizationstarting",
            this.addSeparatorPalette
        );

        this.alreadyRan = true;
    }

    static async renameWidget(aId, newName) {
        let toolbarbutton = document.getElementById(aId);
        
        toolbarbutton.removeAttribute("data-l10n-id");
        toolbarbutton.setAttribute("label", newName);
    }

    static async addSeparatorPalette() {
        let visiblePalette = gCustomizeMode.visiblePalette;

        let separator = CustomizableUI.createSpecialWidget(
            "separator",
            document
        );

        visiblePalette.appendChild(gCustomizeMode.wrapToolbarItem(separator, "palette"), visiblePalette);
    }

    static async createWidget(def)
    {
        // I added this while I was chasing down a bug (kept just in case), but it
        // turns out that that bug was actually just Firefox itself and not anything
        // to do with Spyglass:
        while (!CustomizableUI.getWidget)
            await new Promise(r => requestAnimationFrame(r));

        if (!CustomizableUI.getWidget(def.id)?.hasOwnProperty("source"))
        {
            CustomizableUI.createWidget(def);
        }
    }
}

CollabraWidgetManager.queueCustomWidgetInstallation();

}