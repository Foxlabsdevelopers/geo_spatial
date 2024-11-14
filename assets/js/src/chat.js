import * as map from "./map";
import socket from "../communication_socket";

const identifier = document.querySelector("meta[name='csrf-token']").content;
const markers = new Map();

let mapInstance;

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
    const newMarker = map.addMarker(mapInstance, {
      lat: position.lat,
      lng: position.lng,
    });

    markers.set(from, newMarker);
  }
});

map.init((loadedMap) => {
  mapInstance = loadedMap;

  const marker = map.addMarker(mapInstance, {
    lat: 20.683972,
    lng: -87.064007,
  });

  markers.set(identifier, marker);

  map.trackMarkerMovement(marker, mapInstance, sendPosition);
});

function sendPosition(position) {
  channel.push("movement", { position });
}
