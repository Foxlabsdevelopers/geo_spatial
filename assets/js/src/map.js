import { first, second } from "./polygons";

const polygons = new Map();

const loadCss = (url, callback = () => {}) => {
  const link = document.createElement("link");
  link.href = url;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.onload = () => {
    callback();
  };

  document.head.appendChild(link);
};

const loadScript = (url, callback = () => {}) => {
  const script = document.createElement("script");
  script.src = url;
  script.type = "text/javascript";
  script.async = true;
  script.onload = () => {
    callback();
  };

  document.head.appendChild(script);
};

const loadMap = () => {
  const map = L.map("map").setView([20.683972, -87.064007], 18);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  return map;
};

const init = (callback = () => {}) => {
  loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", () => {
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", () => {
      const map = loadMap();
      const firstPolygon = L.polygon(first).addTo(map);
      const secondPolygon = L.polygon(second).addTo(map);

      polygons.set(firstPolygon._leaflet_id, {
        polygon: firstPolygon,
        joined: false,
        channel: null,
      });

      polygons.set(secondPolygon._leaflet_id, {
        polygon: secondPolygon,
        joined: false,
        channel: null,
      });

      callback(map);
    });
  });
};

function trackMarkerMovement(marker, map, callback = () => {}) {
  document.addEventListener("keydown", (event) => {
    const { lat, lng } = marker.getLatLng();

    const distanceToMove = event.shiftKey ? 0.0001 : 0.00005;

    switch (event.key) {
      case "ArrowUp":
        marker.setLatLng([lat + distanceToMove, lng]);
        callback({ lat: lat + distanceToMove, lng });
        break;
      case "ArrowDown":
        marker.setLatLng({ lat: lat - distanceToMove, lng });
        callback({ lat: lat - distanceToMove, lng });
        break;
      case "ArrowLeft":
        marker.setLatLng([lat, lng - distanceToMove]);
        callback({ lat, lng: lng - distanceToMove });
        break;
      case "ArrowRight":
        marker.setLatLng([lat, lng + distanceToMove]);
        callback({ lat, lng: lng + distanceToMove });
        break;
    }

    map.panTo([lat, lng]);
  });
}

function addMarker(map, position) {
  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [100, 100],
  });

  const marker = L.marker([position.lat, position.lng], { icon: icon }).addTo(
    map
  );

  return marker;
}

export { init, trackMarkerMovement, addMarker, polygons };
