defmodule GeoSpatial.Repo do
  use Ecto.Repo,
    otp_app: :geo_spatial,
    adapter: Ecto.Adapters.Postgres
end
