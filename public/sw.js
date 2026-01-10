console.log("sw....");
self.addEventListener("push",e=>{
    const data=e.data.json();
    self.registration.showNotification(data.title,{
        body:"notify by dev ...",
        icon: 'http://localhost:5000/image/logo.png',
        badge: 'http://localhost:5000/image/salad%20plate.png',
    })
    console.log("push event received", data);
    console.log("title", data.title);
    
})
self.addEventListener('notificationclick', function(event) {
    // const data = event.data.json()
    console.log(event.notification.data.json());
    
    let url="/"
    event.notification.close(); // Android needs explicit close.
    event.waitUntil(
        clients.matchAll({type: 'window'}).then( windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

  
