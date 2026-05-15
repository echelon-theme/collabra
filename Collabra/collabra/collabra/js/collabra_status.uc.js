// ==UserScript==
// @name			Collabra :: Status Bar
// @description 	Restore separate Status Bar
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include         main
// ==/UserScript==

var g_ReadMail;

{
	var { ctypes } = ChromeUtils.importESModule("resource://gre/modules/ctypes.sys.mjs");
	var { Registry } = ChromeUtils.importESModule("chrome://modules/content/Registry.sys.mjs");
	var { PrefCalls, LocaleUtils, waitForElement, setAttributes } = ChromeUtils.importESModule("chrome://userscripts/content/collabra_utils.sys.mjs");
    waitForElement = waitForElement.bind(window);

	let statusBundle = "chrome://collabra/locale/properties/statusbar.properties";

	class MailClientUtils {
        runFile(filePath, commandLineArgs) {
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

        get _defaultMailClient() {
            if (Services.appinfo.OS !== "WINNT")
                return
            
            return Registry.getRegKeyValue("HKLM", "SOFTWARE\\Clients\\Mail", "", "String");
        }

        get _defaultMailPath() {
            return Registry.getRegKeyValue("HKLM", `SOFTWARE\\Clients\\Mail\\${this._defaultMailClient}\\shell\\open\\command`, "", "String");
        }

        open() {
            let mailClientPath = this._defaultMailPath.match(/"([^"]*)"/)[1];
            let mailClientArgs = this._defaultMailPath.split(" ").pop();

            this.runFile(mailClientPath, mailClientArgs);
        }
    }

	g_ReadMail = new MailClientUtils;

	gIdentityHandler.refreshIdentityBlock = function refreshIdentityBlock() {
		if (!this._identityBox) {
			return;
		}

		
		this._refreshIdentityIcons();

		// If this condition is true, the URL bar will have an "invalid"
		// pageproxystate, so we should hide the permission icons.
		if (this._hasInvalidPageProxyState()) {
			gPermissionPanel.hidePermissionIcons();
		} else {
			gPermissionPanel.refreshPermissionIcons();
		}

		let securityButtons = document.querySelectorAll("#security-button");

		securityButtons.forEach(securityButton => {
			if (this._isSecureContext) {
				securityButton.setAttribute("level", "high");
			}
			else {
				securityButton.removeAttribute("level");
			}
		});


		// Hide the shield icon if it is a chrome page.
		gProtectionsHandler._trackingProtectionIconContainer.classList.toggle(
			"chromeUI",
			this._isSecureInternalUI
		);
	}

	var CollabraStatusBarManager = {
		get fragment() {
			return `
				<vbox id="browser-bottombox">
					<statusbar id="status-bar">
						<statusbarpanel id="security-button" class="statusbarpanel-iconic" tooltiptext="${LocaleUtils.str(statusBundle, "statusbar_panel_securitybutton.tooltiptext")}" onclick="BrowserPageInfo(null, 'securityTab')">
							<image class="statusbarpanel-icon" />
						</statusbarpanel>
						<statusbarpanel id="offline-status" class="statusbarpanel-iconic" label="${LocaleUtils.str(statusBundle, "statusbar_panel_offlinestatus.label")}" onclick="BrowserOffline.toggleOfflineStatus();">
							<image class="statusbarpanel-icon" />
						</statusbarpanel>
						<statusbarpanel id="statusbar-progress">
							<vbox class="statusbarpanel-progress-container">
								<vbox class="statusbarpanel-progress-bar" />
							</vbox>
						</statusbarpanel>			
						<statusbarpanel id="statusbar-display" flex="1">
						</statusbarpanel>
						<statusbarpanel id="component-bar">
							<box class="component-bar-grippy">
								<image class="component-bar-grippy-image" />
							</box>
						</statusbarpanel>
					</statusbar>
				</vbox>
			`;
		},

		get menuFragment() {
			return `
				<menuitem oncommand="CollabraStatusBarManager.setStatusBarState(Boolean(this.getAttribute('checked')))" type="checkbox" />
			`;
		},

		get componentBar() {
			return {
				0: {
					"id": "mini-nav",
					"oncommand": "OpenBrowserWindow()",
					"tooltiptext": LocaleUtils.str(statusBundle, "component_bar.nav.tooltiptext"),
				},	
				1: {
					"id": "mini-mail",
					"oncommand": "g_ReadMail.open()",
					"tooltiptext": LocaleUtils.str(statusBundle, "component_bar.mail.tooltiptext"),
				},
				2: {
					"id": "mini-news",
					"oncommand": "alert('You aint opening shit twin....')",
					"tooltiptext": LocaleUtils.str(statusBundle, "component_bar.news.tooltiptext"),
				},
				3: {
					"id": "mini-addr",
					"oncommand": "alert('You aint opening shit twin....')",
					"tooltiptext": LocaleUtils.str(statusBundle, "component_bar.addr.tooltiptext"),
				},
				4: {
					"id": "mini-comp",
					"oncommand": "alert('You aint opening shit twin....')",
					"tooltiptext": LocaleUtils.str(statusBundle, "component_bar.comp.tooltiptext"),
				},
			};
		},

		async init() {
			await new Promise(resolve => {
				let delayedStartupObserver = (aSubject, aTopic, aData) => {
					Services.obs.removeObserver(delayedStartupObserver, "browser-delayed-startup-finished");
					resolve();
				};
				Services.obs.addObserver(delayedStartupObserver, "browser-delayed-startup-finished");
        	});

			document.body.appendChild(MozXULElement.parseXULToFragment(this.fragment));

			this.renderComponentBar();

			Services.obs.addObserver(this, "network:offline-status-changed");
			this.setOfflineStatus(Services.io.offline);

			document.addEventListener("collabra-navigation-busy", this.setProgressBarStatus);
			document.addEventListener("collabra-navigation-done", this.setProgressBarStatus);
		},

		observe(aSubject, aTopic) {
			if (aTopic != "network:offline-status-changed") {
				return;
			}

			this.setOfflineStatus(Services.io.offline);
		},

		setProgressBarStatus(event) {
			let statusbarProgress = document.getElementById("statusbar-progress");

			switch (event.type) {
				case "collabra-navigation-busy":
					statusbarProgress.setAttribute("busy", "true");

					let flipped = false;

					statusbarProgress.addEventListener("animationiteration", () => {
						flipped = !flipped;

						statusbarProgress.setAttribute("flipped", flipped);
					});
					break;
				case "collabra-navigation-done":
					statusbarProgress.removeAttribute("busy");
					statusbarProgress.removeAttribute("flipped");
					break;
			}
		},

		setOfflineStatus(state) {
			let offlineStatus = document.querySelector("#status-bar #offline-status");
			let offlineStatusTooltipText;

			if (state) {
				offlineStatusTooltipText = LocaleUtils.str(statusBundle, "statusbar_panel_offlinestatus_offline.tooltiptext");
				offlineStatus.setAttribute("offline", "true");
				offlineStatus.setAttribute("checked", "true");
			}
			else {
				offlineStatusTooltipText = LocaleUtils.str(statusBundle, "statusbar_panel_offlinestatus.tooltiptext");
				offlineStatus.removeAttribute("offline");
				offlineStatus.removeAttribute("checked");
			}

			offlineStatus.setAttribute("tooltiptext", offlineStatusTooltipText);
		},

		renderComponentBar() {
			let componentBarItems = this.componentBar;
			let componentBarElem = document.querySelector("#status-bar #component-bar");

			for (const taskbutton of Object.keys(componentBarItems)) {
				let taskbuttonElem = document.createXULElement("toolbarbutton");
				
				const taskbuttonElemAttrs = {
					"class": "taskbutton",
					"id": componentBarItems[taskbutton].id,
					"oncommand": componentBarItems[taskbutton].oncommand,
					"tooltiptext": componentBarItems[taskbutton].tooltiptext,
				};
				setAttributes.set(taskbuttonElem, taskbuttonElemAttrs);

				componentBarElem.appendChild(taskbuttonElem);
			};
		},

		_moveStatusPanel() {
			if (document.querySelector(".browserStack #statuspanel")) {
				document.querySelector("#status-bar #statusbar-display").appendChild(StatusPanel.panel);
			}
		},

		_onPopupShowing() {
			let item = document.querySelectorAll("#menu_CollabraStatusBar");
			if (item)
			{
				item.forEach(elem => {
					elem.label = LocaleUtils.str(statusBundle, "collabra_statusbar.label");
					elem.accessKey = LocaleUtils.str(statusBundle, "collabra_statusbar.accesskey");

					let pref = Services.prefs.getBoolPref("collabra.status-bar.enabled");

					if (pref == true)
					{
						elem.setAttribute("checked", "true");
					}
					else
					{
						elem.removeAttribute("checked");
					}
				});
			}
		},
	};

	document.addEventListener("DOMContentLoaded", CollabraStatusBarManager.init(), false);

	waitForElement("#statuspanel").then(e => {
		CollabraStatusBarManager._moveStatusPanel();
	});

	waitForElement("#tabbrowser-tabpanels").then(e => {	
		let browserStackObserver = new MutationObserver(CollabraStatusBarManager._moveStatusPanel);
		browserStackObserver.observe(e, { childList: true, subtree: true });
	});
}

document.addEventListener("command", function (event) {
	let el = event.target.closest("[oncommand]");
	if (!el) return;

	let attr = el.getAttribute("oncommand");
	if (!attr) return;

	// Support multiple statements: foo(); bar();
	let statements = attr.split(";").map(s => s.trim()).filter(Boolean);

	for (let stmt of statements) {

		// Match simple function calls: myFunc(...)
		let match = stmt.match(/^([a-zA-Z_$][\w$]*)\((.*)\)$/);
		if (!match) continue;

		let fnName = match[1];
		let argsRaw = match[2];

		let fn = window[fnName];
		if (typeof fn !== "function") continue;

		// Parse arguments
		let args = [];
		if (argsRaw.trim()) {
			args = argsRaw.split(",").map(arg => {
				arg = arg.trim();

				if (arg === "event") return event;
				if (arg === "this") return el;

				if (/^["'].*["']$/.test(arg))
					return arg.slice(1, -1);

				if (!isNaN(arg))
					return Number(arg);

				return window[arg];
			});
		}

		// Window-native methods must use window as context
		let context =
			fn === window.alert ||
			fn === window.confirm ||
			fn === window.prompt
				? window
				: el;

		fn.apply(context, args);
	}
});