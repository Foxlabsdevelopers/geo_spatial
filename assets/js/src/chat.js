import * as mapLoader from "./map";
import socket from "../communication_socket";

let map;

mapLoader.init((loadedMap) => {
  map = loadedMap;
});

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
