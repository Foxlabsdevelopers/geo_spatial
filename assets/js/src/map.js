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
      callback(loadMap());
    });
  });
};

export { init };
