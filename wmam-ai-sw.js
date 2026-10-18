// WMAMinc AI phone alerts. This file only shows alerts and opens the right chat when you tap one.
// It does not store or change any pages of the site (no offline caching).
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function(e){
  var d = {}; try{ d = e.data ? e.data.json() : {}; }catch(x){ d = { title:'WMAMinc AI', body:e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'WMAMinc AI', { body:d.body || '', icon:'/wmam-icon-192.png', badge:'/wmam-icon-192.png', tag:d.tag || 'wmam-ai', renotify:true, data:{ url:d.url || '/' } }));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close(); var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    for(var i = 0; i < list.length; i++){ var c = list[i]; if(c.url.indexOf(self.location.origin) === 0 && 'focus' in c){ c.postMessage({ wmamOpen:url }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
