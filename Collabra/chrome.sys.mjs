{
    let {
        classes: Cc,
        interfaces: Ci,
        manager: Cm,
        utils: Cu
    } = Components;

    let ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    let registry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIChromeRegistry);
    let brandingPath = `chrome://collabra/content/branding/communicator/chrome.manifest`;
    let brandingFileURI = registry.convertChromeURL(ios.newURI(brandingPath)).QueryInterface(Ci.nsIFileURL);
    let brandingManifest = brandingFileURI.file;
    if (brandingManifest.exists())
    {
        Cm.QueryInterface(Ci.nsIComponentRegistrar).autoRegister(brandingManifest);
    }
}