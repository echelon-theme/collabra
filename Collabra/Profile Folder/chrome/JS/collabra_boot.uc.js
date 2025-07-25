// ==UserScript==
// @name			Collabra :: Boot
// @description 	Initializes Collabra modules for different pages.
// @author			aubymori
// @include			(.*)
// @loadOrder       0
// ==/UserScript==

let COLLABRA_BOOT_CONFIG = {
	/* Main browser window */
	"chrome://browser/content/browser.xhtml": {
		prefs: [
			"collabra.unified-extensions.disabled",
			"collabra.appearance.mozilla",
			"collabra.tabbrowser.hideononetab"
		],
		nativeControls: true
	},
};

{
	function bootCollabra(context, config)
	{
		if (config?.prefs)
		{
			let { PrefManager } = ChromeUtils.importESModule("chrome://modules/content/PrefManager.sys.mjs");
			context.g_prefManager = new PrefManager(
				context.document.documentElement,
				config.prefs
			);
		}

		if (config?.nativeControls)
		{
			let { NativeControls } = ChromeUtils.importESModule("chrome://modules/content/NativeControls.sys.mjs");
			context.g_nativeControls = new NativeControls(
				context.document.documentElement,
				context.MutationObserver
			);
		}
	}

	(function(context)
	{
		function isCurrentURL(url)
		{
			return context.document.documentURI.split("#")[0].split("?")[0] == url;
		}

		for (const url in COLLABRA_BOOT_CONFIG)
		{
			if (isCurrentURL(url))
			{
				context.addEventListener("load", function()
				{
					bootCollabra(context, COLLABRA_BOOT_CONFIG[url]);
				});
				return;
			}
		}
	})(window);
}