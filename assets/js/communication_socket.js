import { Socket } from "phoenix";

let csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute("content");

let socket = new Socket("/socket", { params: { token: csrfToken } });

socket.connect();

export default socket;
