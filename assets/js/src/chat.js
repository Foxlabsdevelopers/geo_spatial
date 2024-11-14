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

// send ping to server
channel
  .push("ping", { hello: "I am the client!" })
  .receive("ok", (response) => {
    console.log("ping", response);
  });

mapLoader.init((loadedMap) => {
  map = loadedMap;

  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [70, 70],
  });

  const marker = L.marker([20.683972, -87.064007], { icon: icon }).addTo(map);

  trackMarkerMovement(marker);
});

function trackMarkerMovement(marker) {
  document.addEventListener("keydown", (event) => {
    const { lat, lng } = marker.getLatLng();

    const distanceToMove = event.shiftKey ? 0.0001 : 0.00005;

    switch (event.key) {
      case "ArrowUp":
        marker.setLatLng([lat + distanceToMove, lng]);
        break;
      case "ArrowDown":
        marker.setLatLng([lat - distanceToMove, lng]);
        break;
      case "ArrowLeft":
        marker.setLatLng([lat, lng - distanceToMove]);
        break;
      case "ArrowRight":
        marker.setLatLng([lat, lng + distanceToMove]);
        break;
    }

    map.panTo([lat, lng]);
  });
}
