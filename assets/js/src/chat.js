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

channel.on("message", (payload) => {
  const { from, body } = payload;

  const messages = document.getElementById("messages");

  messages.innerHTML += buildMessage(from, body);
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

// HELPERS
function stringToColorSeed(str) {
  let seed = 0;
  for (let i = 0; i < str.length; i++) {
    // We use charCodeAt to get the ASCII value of the character
    // to calculate the seed
    seed += str.charCodeAt(i);
  }
  return seed;
}

// The seed guarantees that the same name will always have the same color
function generateRandomColor(seed) {
  const random = (Math.sin(seed++) * 10000) % 1;

  const onlyPositive = random < 0 ? random * -1 : random;

  const color = Math.floor(onlyPositive * 16777215);
  return `#${color.toString(16).padStart(6, "0")}`;
}

// END HELPERS

// DOM events
const buildMessage = (from, message) => {
  const avatar = from.charAt(0).toUpperCase();

  const seed = stringToColorSeed(from);
  const randomColor = generateRandomColor(seed);

  const avatarClasses =
    "text-white flex items-center justify-center rounded-full w-8 h-8";

  return `
    <p class="p-4 flex flex-row items-center">
        <span class="${avatarClasses}" style="background: ${randomColor}">${avatar}</span>
        <span class="ml-4">${message}</span>
    </p>
    `;
};

document.getElementById("send").addEventListener("click", () => {
  const message = document.getElementById("message").value;

  if (!message) return;

  channel.push("message", { from: identifier, body: message });
  const messages = document.getElementById("messages");

  messages.innerHTML += buildMessage(identifier, message);

  document.getElementById("message").value = "";
});
