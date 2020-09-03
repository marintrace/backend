importScripts('workbox.js');

const assetRoute = new workbox.routing.RegExpRoute({
    regExp: new RegExp('^^https://[^/]+(/(?!rest/|rest$).*)?$'),
    handler: new workbox.runtimeCaching.CacheFirst()
});

const router = new workbox.routing.Router();
//router.addFetchListener();
router.registerRoutes({routes: [assetRoute]});
router.setDefaultHandler({
    handler: new workbox.runtimeCaching.CacheFirst()
});
