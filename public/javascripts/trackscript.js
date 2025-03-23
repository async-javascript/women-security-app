const socket = io();  // This will initialize the socket connection to the server

if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('send-location', { latitude, longitude }); // Send location to the server
    }, (error) => {
        console.error(error);  // Handle any geolocation errors
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

// Initialize Leaflet Map
const map = L.map("map").setView([0, 0], 16);  // Set initial map view to a default position

L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

// Store markers
const markers = {};

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;
    map.setView([latitude, longitude]);

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]); // Update the marker location
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map); // Add new marker if it's a new user
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]); // Remove marker when user disconnects
        delete markers[id];
    }
});
