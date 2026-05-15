// ==UserScript==
// @name			Collabra :: Boot
// @description 	Initializes Colabra modules for different pages.
// @author			travy-patty
// @github          https://github.com/travy-patty
// @include			(.*)
// @loadOrder       0
// ==/UserScript==

let COLLABRA_BOOT_CONFIG = {
	/* Main browser window */
	"chrome://browser/content/browser.xhtml": {
		prefs: [

		]
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