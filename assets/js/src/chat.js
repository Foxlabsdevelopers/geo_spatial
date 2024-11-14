import * as mapLoader from "./map";
import socket from "../communication_socket";

const identifier = document.querySelector("meta[name='csrf-token']").content;
const markers = new Map();

let map;

let channel = socket.channel("chat:global", {});

channel
  .join()
  .receive("ok", (resp) => {
    console.log("Joined successfully", resp);
  })
  .receive("error", (resp) => {
    console.log("Unable to join", resp);
  });

channel.on("movement", (payload) => {
  const { from, position } = payload;

  const marker = markers.get(from);

  if (marker) {
    marker.setLatLng([position.lat, position.lng]);
  } else {
    addMarker(map, { lat: position.lat, lng: position.lng }, from);
  }
});

mapLoader.init((loadedMap) => {
  map = loadedMap;

  const marker = addMarker(
    map,
    { lat: 20.683972, lng: -87.064007 },
    identifier
  );

  trackMarkerMovement(marker, map);
});

const addMarker = (map, position, identifier) => {
  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [100, 100],
  });

  const marker = L.marker([position.lat, position.lng], { icon: icon }).addTo(
    map
  );

  markers.set(identifier, marker);

  return marker;
};

function sendPosition(position) {
  channel.push("movement", { position });
}

function trackMarkerMovement(marker, map) {
  document.addEventListener("keydown", (event) => {
    const { lat, lng } = marker.getLatLng();

    const distanceToMove = event.shiftKey ? 0.0001 : 0.00005;

    switch (event.key) {
      case "ArrowUp":
        marker.setLatLng([lat + distanceToMove, lng]);
        sendPosition({ lat: lat + distanceToMove, lng });
        break;
      case "ArrowDown":
        marker.setLatLng({ lat: lat - distanceToMove, lng });
        sendPosition({ lat: lat - distanceToMove, lng });
        break;
      case "ArrowLeft":
        marker.setLatLng([lat, lng - distanceToMove]);
        sendPosition({ lat, lng: lng - distanceToMove });
        break;
      case "ArrowRight":
        marker.setLatLng([lat, lng + distanceToMove]);
        sendPosition({ lat, lng: lng + distanceToMove });
        break;
    }

    map.panTo([lat, lng]);
  });
}
