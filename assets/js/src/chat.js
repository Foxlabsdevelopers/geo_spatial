import * as mapLoader from "./map";

let map;

mapLoader.init((loadedMap) => {
  map = loadedMap;
});
