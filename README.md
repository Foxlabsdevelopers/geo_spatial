# Indexación y Chat Geoespacial en Realtime con Phoenix Channels y JS

Al finalizar esta guía, habremos desarrollado una página que muestra un mapa interactivo donde los usuarios que accedan verán su ubicación y la de otros usuarios como marcadores personalizados. Los usuarios podrán desplazarse, y estos movimientos se actualizarán automáticamente en las pantallas de todos los participantes, gracias al uso de sockets y canales de Phoenix.

Una vez implementada la funcionalidad de localización en tiempo real, agregaremos una caja de texto y un botón para enviar mensajes. Configuraremos un canal de comunicación global, permitiendo que cualquier usuario en el mapa envíe y reciba mensajes en tiempo real.

También exploraremos una característica avanzada: dibujar polígonos en el mapa utilizando coordenadas personalizadas. Para esta funcionalidad, utilizaremos la siguiente herramienta: [Map Polygon/Polyline Tool](https://www.keene.edu/campus/maps/tool/)

Nuestros objetivos son:

- Crear una aplicación web en tiempo real con Phoenix Channels
- Implementar un mapa interactivo con marcadores personalizados
- Permitir que los usuarios envíen mensajes en tiempo real
- Dibujar polígonos en el mapa
- Simular cuartos de chat privados utilizando las areas delimitedas por los polígonos

## Demo


[![Vista previa del video](https://github.com/user-attachments/assets/18df5953-ae42-4878-b46f-bd2ffdcf47a5)](https://drive.google.com/file/d/10BvZGPKz-ILVyh412tL5IC8dgPxr3l2l/view)



## Guia de instalación de Elixir, Erlang y Phoenix

https://hexdocs.pm/phoenix/installation.html

## Creación del proyecto

https://hexdocs.pm/phoenix/up_and_running.html

```bash
 mix phx.new geo_spatial # Crea un nuevo proyecto Phoenix

 cd geo_spatial # Cambia al directorio del proyecto

  mix deps.get # Instala las dependencias
  mix ecto.create # Crea la base de datos
  mix phx.server # Inicia el servidor
```

Ahora puedes visitar [`localhost:4000`](http://localhost:4000) desde tu navegador.

# Plan de trabajo

## Inicializar el Mapa

Ahora cargaremos el mapa con LeafLet JS, es la librería que utilizaremos para los mapas y dibujar los polígonos.

```jsx
1. Abrir la pagina inicial
2. Generar vista con liveview (opcional)

3. Abrir archivo /controllers/page_html/home.html.heex
4. Editar el contenido
5. Hacer un contenedor usando Tailwind CSS
	<div class="flex w-full bg-gray-400 min-h-screen">
	</div>
```

Escribir el archivo `map.js` dentro de `src/map.js` e importarlo en `app.js`

para ello utilizaremos la guia de https://leafletjs.com/examples/quick-start/

```jsx
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
```

En el app.js solo tendremos que importar el mapa e inicializarlo

```jsx
import * as map from "./src/map";

// Initialize map
map.init();
```

## Crear Socket y configuración en el Endpoint y el router

Durante este proyecto estaremos utilizando `mix phx`, es el comando que nos incluye phoenix para ejecutar tareas, dentro de estas tareas hay un modulo de Generadores, estos generados nos facilitan el desarrollo porque se encargan de hacer una base sobre la que nosotros estaremos trabajando funcionalidades. Para ver las tareas disponibles podemos ejecutarlo en la terminal, en nuestro caso necesitaremos utilizar el de `mix phx.gen.socket` y `mix phx.gen.channel`

Primero los clientes se conectan al servidor utilizando un WebSocket, un protocolo de transmisión de datos que mantiene una conexión esperando o enviando eventos, es comunicación bidireccional, no es un polling o intervalo que se esté ejecutando cada cierto tiempo, en cuanto se recibe un evento a través de un canal, este lo distribuye a los subscriptores mediante los canales. Ideal para alto tráfico pues no compromete recursos del servidor como un polling o un intervalo.

Ahora bien, para generarlos utilizaremos los comandos de la siguiente manera:

```jsx
mix phx.gen.socket Communication
```

Esto crea dos archivos: el primero es el socket y el segundo un archivo con codigo de JavaScript que se conecta a él, pero antes de eso necesitamos configurarlo en nuestro archivo Endpoint, que es el lugar donde todas las solicitudes a nuestra aplicación son configuradas, es nuestro punto de entrada y se encarga de gestionar la configuración global de la aplicación para cada solicitud. Como lo que habilitaremos es un WebSocket, entonces debemos de hacerlo desde aquí.

No es un Router el router solo se encarga de decidir hacia donde redirigir las peticiones, gestiona que lógica específica se utilizará para cada solicitud utilizando los controladores y acciones adecuadas al Método HTTP en uso.

Ahora bien, para habilitar nuestro socket iremos al archivo endpoint.ex ubicado en `lib/geo_spatial_web/endpoint.ex`

y agregaremos las siguientes lineas

```jsx
socket "/socket", GeoSpatialWeb.CommunicationSocket,
      websocket: true,
      longpoll: false
```

En este caso hacemos referencia al socket que acabamos de generar utilizando el módulo donde se encuentra definido, habilitamos la conexión por websockets y la opción `longpoll`, lo que significa que si la red o el navegador no soporta WebSockets, no utilizará métodos HTTP para mantener la conexión, esto reduce la carga en el servidor y simplifica el flujo de la conexión.

## Crear Channel y definir Topics

Los canales permiten habilitar la comunicación tiempo real entre todos los nodos conectados, pueden ser millones y millones. Tiene más casos de uso, como lectura de sensores, eventos en juegos, notificaciones, tracking de vehículos por gps, y hasta simples cambios en los datos de alguien.

para generarlo es simple utilizamos el Task `mix phx.gen.channel` de la siguiente manera

```jsx
mix phx.gen.channel Chat
```

Esto nos va a crear 3 archivos, de momento no los utilizaremos, podemos eliminar las carpetas de tests. Pero Phoenix nos provee de herramientas para probarlo y garantizar el comportamiento del código a través del ciclo de desarrollo y mantenimiento de un proyecto.

Nos pedirá crear un socket otra vez, pero como ya tenemos el nuestro le diremos que no, ahora solamente debemos ir a nuestro socket de Communication y agregar el canal que acabamos de crear para que pueda delegarle la responsabilidad de los eventos recibidos en el socket.

Una vez abierto el archivo vamos a agregar lo siguiente:

```jsx
channel "chat:*", GeoSpatialWeb.ChatChannel

def connect(params, socket, _connect_info) do
    {:ok, assign(socket, :user_id, params["token"])}
end
```

Esto es un channel route, el texto del principio es un Topic, el asterisco en este caso significa que podrá recibir cualquier evento por ejemplo `chat:lobby` o `chat:123xyz` por ejemplo.

Topics: Los utilizaremos para saber a donde distribuir mensajes cuando estemos conectados con los canales.

Teniendo esto, estamos listos para continuar. Que sigue?

Hasta ahora tenemos nuestro Mapa, el Socket que es el medio de comunicación y el Canal, que es quien estará haciéndose cargo de los eventos que recibamos y del comportamiento para estos.

## Conectar el cliente al socket y los canales

Hacemos commit de lo que hicimos hasta ahora con Git.

Haremos algo dado que no tenemos sesiones en esta ocasión pero si tenemos la posibilidad de tener tokens dinámicos, para ello utilizaremos el CSRF token como identificador único para cada usuario conectado.

Una vez hagamos esto, podemos agregar nuestro archivo donde estaremos trabajando, lo nombraremos chat, desde él vamos a acceder a la instancia del mapa para poder trabajarlo.

Eliminaremos la llamada directa al mapa y importaremos el script del chat, para esto hacemos lo siguiente:

`import "./src/chat";`

y eliminamos las referencias al mapa

en nuestro archivo chat.js agregaremos lo que teníamos anteriormente en app.js:

```jsx
import * as map from "./map";

let mapInstance;

map.init((loadedMap) => {
  mapInstance = loadedMap;
});
```

Ahora haremos los siguientes ajustes al `communication_socket.js`

```jsx
import { Socket } from "phoenix";

let csrfToken = document
  .querySelector("meta[name='csrf-token']")
  .getAttribute("content");

let socket = new Socket("/socket", { params: { token: csrfToken } });

socket.connect();

export default socket;
```

Vamos a asegurarnos de que funciona importándolo en el archivo `chat.js` que creamos, primero moveremos la asignación del userToken hacia arriba para que la tengamos disponible al llamar todo.

lo importaremos de la siguiente manera `import "../communication_socket";`

Vamos a ver la consola y veamos que sucede. Notaremos errores, eso es debido a que no tenemos una función que se encargue de el chat global. Recargamos y debería funcionar correctamente.

Hagamos una prueba, enviaremos un mensaje al servidor utilizando el evento “ping” que tenemos por default.

Haremos los siguientes ajustes, vamos a mover el canal al archivo chat, y a cambiar la forma de importar el socket, nuestro codigo debería de quedar de la siguiente manera:

```jsx
import socket from "../communication_socket";

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
```

El servidor nos deberá responder con el mensaje de ping, podemos verlo en la conexión del websocket en el tab de network. Bien ahora que llegamos aquí podemos comenzar las funcionalidades porque ya tenemos conexión con el socket y el canal, nos queda desarrollar las funcionalidades.

## Mostrar un marcador custom en el Mapa

Para mostrar el marcador en el mapa debemos de asegurarnos de que el mapa ya se encuentra cargado correctamente, entonces haremos esto dentro del map loader. Moveremos abajo también el codigo para que no empujemos tanto los canales.

```jsx
mapLoader.init((loadedMap) => {
  mapInstance = loadedMap;

  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [70, 70],
  });

  L.marker([20.683972, -87.064007], { icon: icon }).addTo(map);
});
```

Ahora ya tenemos nuestro marcador custom en el mapa, nada fuera de lo ordinario. Vamos a darle movimiento con el teclado para poder desplazarnos a través del mapa.

Haremos un commit de lo que tenemos hasta ahora, vamos a ir por partes.

## Añadir eventos de teclado para poder mover el marcador

Para esto tendremos que agregar un event listener de teclado, vamos a ver que teclas nos imprime cuando presionamos las de navegación.

```jsx
const marker = L.marker([20.683972, -87.064007], { icon: icon }).addTo(map);

map.trackMarkerMovement(marker);

// Agregaremos esta funcion en el archivo map.js
function trackMarkerMovement(marker) {
  document.addEventListener("keydown", (event) => {
    console.log(event.key);
  });
}
```

Bien ahora que hemos identificado las teclas, vamos a darle las funcionalidades para desplazarnos, primero tenemos que saber las coordenadas actuales del marcador.

```jsx
const { lat, lng } = marker.getLatLng();

const distanceToMove = 0.00005;

switch (event.key) {
  case "ArrowUp":
    marker.setLatLng([lat + distanceToMove, lng]);

    // keep the marker in the focus
    map.panTo([lat + distanceToMove, lng]);
    break;
}
```

Agreguemos el resto de eventos:

```jsx
function trackMarkerMovement(marker, map) {
  document.addEventListener("keydown", (event) => {
    const { lat, lng } = marker.getLatLng();

    const distanceToMove = 0.00005;

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
```

Metámosle nitro con Shift como en los juegos.

```jsx
const distanceToMove = event.shiftKey ? 0.0001 : 0.00005;
```

## Añadir marcadores de sesiones conectadas

Ahora tenemos que hacer que se puedan ver los que estén conectados a nuestra app. Para ello tendremos que enviar eventos y recibir eventos de movimientos del resto de usuarios.

Lo lograremos suscribiéndonos a eventos de movimiento del resto de usuarios y enviando eventos de movimiento nuestros.

Primero definamos este tipo de evento en el canal, abrimos nuestro archivo del channel y agregamos la siguiente función

```jsx
  def handle_in("movement", payload, socket) do
    payload = Map.put_new(payload, "from", socket.assigns.user_id)

    broadcast_from!(socket, "movement", payload)

    {:noreply, socket}
  end
```

Ahora podemos enviar y recibir esto desde el cliente de la siguiente manera

```jsx
// Nos suscribimos al canal
channel.on("movement", (payload) => {
  const { from, position } = payload;

  console.log(`[${from}] moved to: ${position.lat}, ${position.lng}`);
});

// definimos la funcion de envio de posición

function sendPosition(position) {
  channel.push("movement", { position });
}

// hacemos que se envie la ubicacion en cada movimiento
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

// tenemos que actualizar init para enviar la posicion *
// lo hacemos en la linea 471 de este archivo README.md

map.trackMarkerMovement(marker, mapInstance, sendPosition);
```

Teniendo la información de nuestro lado, podemos abrir dos o más ventanas en el navegador para simular otras sesiones, y solo nos queda mostrar los nuevos integrantes. En este punto ya tendremos comunicación en tiempo real entre todos nuestros nodos conectados.

A continuación se muestra la lógica para lograrlo.

```jsx
// obtenemos el csrf token para usarlo como identificador
const identifier = document.querySelector("meta[name='csrf-token']").content;

// creamos una estructura Map de JS para almacenarlos
// y poder tener control sobre ellos
const markers = new Map();

// al iniciar nuestro marcador vamos a almacenarlo del siguiente manera
markers.set(identifier, marker);

// ahora cada vez que se una un nuevo elemento
// y se mueva vamos a mostrarlo en el mapa

channel.on("movement", (payload) => {
  const { from, position } = payload;

  const marker = markers.get(from);

  if (marker) {
    marker.setLatLng([position.lat, position.lng]);
  } else {
    const newMarker = map.addMarker(
      map,
      { lat: position.lat, lng: position.lng },
      from
    );
    markers.set(from, newMarker);
  }
});

// Definimos nuestra funcion de agregar marcador basado
// en lo que hicimos antes en el archivo map.js
const addMarker = (map, position) => {
  const icon = L.icon({
    iconUrl:
      "https://www.freeiconspng.com/thumbs/person-icon/individual-person-icon-filled-individual-to-serve-0.png",
    iconSize: [100, 100],
  });

  const marker = L.marker([position.lat, position.lng], { icon: icon }).addTo(
    map
  );

  return marker;
};

// Reutilizamos codigo en el maploader
mapLoader.init((loadedMap) => {
  mapInstance = loadedMap;

  const marker = map.addMarker(mapInstance, {
    lat: 20.683972,
    lng: -87.064007,
  });

  markers.set(identifier, marker);

  map.trackMarkerMovement(marker, mapInstance, sendPosition);
});
```

Ya deberíamos tener comunicación y ver los movimientos, probamos con dos tabs abiertas.

## Chat global

Hagamos la UI para nuestro chat Global o Publico

```html
<h1 class="text-2xl font-bold">
  Indexación y Chat Geoespacial en Realtime con Phoenix y JS
</h1>

<h1>Chat</h1>
<div class="flex flex-col">
  <input
    id="message"
    class="px-4 py-2 border border-red-300 rounded-lg my-4"
    placeholder="Introduce you message here"
  />
  <button
    id="send"
    class="px-4 py-2 border border-blue-600 bg-blue-200 rounded-lg"
  >
    Send
  </button>
</div>

<h1 class="mt-10">Public Chat</h1>
<div class="mt-2 border border-gray-300 rounded-lg h-48 p-2 overflow-y-auto">
  <ul id="messages"></ul>
</div>

<h1 class="mt-10">Private Room Chat</h1>
<div class="mt-2 border border-gray-300 rounded-lg h-48 p-2 overflow-y-auto">
  <ul id="private-messages"></ul>
</div>
```

Ahora haremos lo siguiente, definiremos un evento nuevo para los mensajes en el canal:

Abriremos el archivo del canal y haremos lo siguiente:

```elixir
  def handle_in("message", payload, socket) do
    payload = Map.put_new(payload, "from", socket.assigns.user_id)

    broadcast_from!(socket, "message", payload)
    {:noreply, socket}
  end
```

Ahora en el chat.js agregaremos el listener para el boton que creamos:

```jsx
document.getElementById("send").addEventListener("click", () => {
  const message = document.getElementById("message").value;

  if (!message) return;

  channel.push("message", { from: identifier, body: message });

  const messages = document.getElementById("messages");

  // añadiremos una funcion que nos permita mostrar los mensajes que enviamos
  messages.innerHTML += buildMessage(identifier, message);

  // Resetearemos el valor del campo de texto
  document.getElementById("message").value = "";
});

// añadiremos una funcion que nos permita mostrar los mensajes que enviamos
const buildMessage = (from, message) => {
  const avatar = from.charAt(0).toUpperCase();

  const avatarClasses =
    "text-white flex items-center justify-center rounded-full w-8 h-8";

  return `
    <p class="p-4 flex flex-row items-center">
        <span class="${avatarClasses}" style="background: #646621">${avatar}</span>
        <span class="ml-4">${message}</span>
    </p>
    `;
};

// Nos suscribiremos a los eventos de mensajes y mostraremos los recibidos
channel.on("message", (payload) => {
  const { from, body } = payload;

  const messages = document.getElementById("messages");

  messages.innerHTML += buildMessage(from, body);
});
```

Y listo, tenemos el chat global funcionando

## Polígonos

Ahora haremos los polígonos, estas coordenadas preparadas estám cerca de la universidad donde este taller fue impartido, son estos:

```jsx
// crearemos el archivo polygons.js con el siguiente contenido
const first = [
  [20.6852893, -87.0670422],
  [20.6847473, -87.0663126],
  [20.6854298, -87.0655187],
  [20.6859919, -87.0663341],
  [20.6852893, -87.0670422],
];

const second = [
  [20.6821836, -87.0626737],
  [20.6826854, -87.0619656],
  [20.6832074, -87.0628668],
  [20.6826252, -87.0633818],
  [20.6821836, -87.0626737],
];

export { first, second };

// Ahora en el archivo map.js importaremos
// estas coordenadas que conforman a los polygonos para definirlos
import { first, second } from "./polygons";

// Crearemos un mapa para almacenarlos y poder accederlos desde fuera
const polygons = new Map();

// en la función init los montaremos
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

// finalmente los exportaremos y ya deberían ser visibles
```

## Indexación Geo-espacial y Chat Privado

Ya tenemos nuestros polígonos en el mapa, ahora necesitamos crear la lógica para suscribirnos y des-suscribirnos de los canales privados que asociaremos a estos. De esta manera podremos saber quienes reciben y quienes no los mensajes de esos canales cuando estén dentro de los polígonos.

Primero agregaremos el topic al que se podrán unir nuestros usuarios en el Channel

```jsx
  def join("chat:" <> _private_room_id, _params, socket) do
    {:ok, socket}
  end
```

Ahora más JavaScript para la lógica

Necesitamos comprobar cuando un usuario se mueva si se encuentra dentro de nuestros polígonos, para eso haremos lo siguiente, definiremos una nueva función y la usaremos dentro de sendPosition:

```jsx
function sendPosition(position) {
  channel.push("movement", { position });

  // los polígonos los tenemos en una estructura map de JS,
  // lo iteraremos para comprobar

  map.polygons.entries().forEach(([_key, value]) => {
    // Check if the user is inside the polygon
    handlePolygonChannel(value.polygon, position);
  });
}

// Esta función es la principal, se encargará de
// comprobar si la posición actual está
// dentro del polígono - indexación Geo-espacial

const handlePolygonChannel = (polygon, position) => {
  // obteneos el dato del poligono
  const polygonData = map.polygons.get(polygon._leaflet_id);

  // Comprobamos si contiene las coordenadas que recibimos
  const isInside = polygon.getBounds().contains([position.lat, position.lng]);

  // extraemos su status y el canal privado si es que tiene uno
  const joined = polygonData.joined;

  // Definimos una variable que será la responsable de tratar con el canal
  let privChannel = polygonData.channel;

  // Si las coordenadas están dentro del polígono
  // y no está unido al canal, entonces
  // inicializaremos el canal y nos suscribiremos
  if (isInside && !joined) {
    // inicializamos el canal con el identificador unico del poligono
    // enviamos nuestro identificador
    privChannel = socket.channel("chat:" + polygon._leaflet_id, { identifier });

    privChannel?.join().receive("ok", () => {
      // Nos unimos y al completarse actualizamos el estatus
      // de nuestro usuario en los polígonos
      map.polygons.set(polygon._leaflet_id, {
        polygon,
        joined: true,
        channel: privChannel,
      });
    });

    // Ahora nos suscribiremos a mensajes provenientes de este
    // canal
    privChannel?.on("message", (payload) => {
      const { from, body } = payload;

      // obtenemos el contenedor de mensajes
      const messages = document.getElementById("private-messages");

      // actualizamos con los mensajes que recibimos en casi de que haya alguno
      messages.innerHTML += buildMessage(from, body);
    });
  } else if (!isInside && joined) {
    // Ahora, en caso contrario, si no está dentro pero está unido
    // abandonaremos y reinstanciaremos el canal

    // Leave the current room
    privChannel?.leave().receive("ok", () => {
      // Reinstantiate the channel for the next time the user enters the room and joins
      privChannel = socket.channel("chat:" + polygon._leaflet_id, {
        identifier,
      });
    });

    // Actualizaremos el status al finalizar también
    map.polygons.set(polygon._leaflet_id, {
      polygon,
      joined: false,
      channel: privChannel,
    });
  }
};
```

Ahora actualizaremos la lógica del botón y estaremos completos

```jsx
document.getElementById("send").addEventListener("click", () => {
  const message = document.getElementById("message").value;

  // buscaremos si está conectado a algún canal privado
  const joined = Array.from(map.polygons.values()).find(
    (polygon) => polygon.joined
  );

  if (joined) {
    // si lo está mandaremos el mensaje a su canal
    joined.channel.push("message", { from: identifier, body: message });

    // y actualizaremos la lista de mensajes
    const messages = document.getElementById("private-messages");

    messages.innerHTML += buildMessage(identifier, message);
  } else {
    // Si no, entonces lo enviamos al canal publico

    channel.push("message", { from: identifier, body: message });
    const messages = document.getElementById("messages");

    messages.innerHTML += buildMessage(identifier, message);
  }

  document.getElementById("message").value = "";
});
```

## Bonus - Cambiar colores dinámicamente

```jsx
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
```

Mover el chat en automático

```jsx
messages.innerHTML += buildMessage(from, body);
messages.parentElement.scrollTop = messages.scrollHeight;
```

Para habilitar el acceso desde otras computadoras en la misma red vease
`config/dev.exs:22` en este proyecto.

## Conclusiones

Hemos logrado crear una aplicación en tiempo real con Phoenix Channels, implementar un mapa interactivo con marcadores personalizados, permitir que los usuarios envíen mensajes en tiempo real, dibujar polígonos en el mapa y simular cuartos de chat privados utilizando las áreas delimitadas por los polígonos.

## Recursos

- [Leaflet JS](https://leafletjs.com/)
- [Phoenix Framework](https://www.phoenixframework.org/)
- [Map Polygon/Polyline Tool](https://www.keene.edu/campus/maps/tool/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Phoenix Channels](https://hexdocs.pm/phoenix/channels.html)
- [Phoenix Gen](https://hexdocs.pm/phoenix/Mix.Tasks.Phx.Gen.html)
- [Phoenix Endpoint](https://hexdocs.pm/phoenix/Phoenix.Endpoint.html)
- [Phoenix Router](https://hexdocs.pm/phoenix/Phoenix.Router.html)

## Autor

- [Cresencio Vázquez Flores](https://github.com/cresenciof)
