defmodule GeoSpatial.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      GeoSpatialWeb.Telemetry,
      GeoSpatial.Repo,
      {DNSCluster, query: Application.get_env(:geo_spatial, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: GeoSpatial.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: GeoSpatial.Finch},
      # Start a worker by calling: GeoSpatial.Worker.start_link(arg)
      # {GeoSpatial.Worker, arg},
      # Start to serve requests, typically the last entry
      GeoSpatialWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: GeoSpatial.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    GeoSpatialWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
