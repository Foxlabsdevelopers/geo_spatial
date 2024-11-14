defmodule GeoSpatialWeb.ChatChannel do
  use GeoSpatialWeb, :channel

  @impl true
  def join("chat:global", payload, socket) do
    if authorized?(payload) do
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_in("movement", payload, socket) do
    payload = Map.put_new(payload, "from", socket.assigns.user_id)

    broadcast_from!(socket, "movement", payload)

    {:noreply, socket}
  end

  def handle_in("message", payload, socket) do
    payload = Map.put_new(payload, "from", socket.assigns.user_id)

    broadcast_from!(socket, "message", payload)
    {:noreply, socket}
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # It is also common to receive messages from the client and
  # broadcast to everyone in the current topic (chat:lobby).
  @impl true
  def handle_in("shout", payload, socket) do
    broadcast(socket, "shout", payload)
    {:noreply, socket}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end
end
