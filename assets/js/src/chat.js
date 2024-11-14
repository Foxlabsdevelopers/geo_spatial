import * as mapLoader from "./map";
import socket from "../communication_socket";

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

  console.log(`[${from}] moved to: ${position.lat}, ${position.lng}`);
});

mapLoader.init((loadedMap) => {
  map = loadedMap;

  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [70, 70],
  });

  const marker = L.marker([20.683972, -87.064007], { icon: icon }).addTo(map);

  trackMarkerMovement(marker, map);
});

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
