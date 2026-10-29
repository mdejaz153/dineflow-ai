import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import markerIcon2x from
  "leaflet/dist/images/marker-icon-2x.png";

import markerIcon from
  "leaflet/dist/images/marker-icon.png";

import markerShadow from
  "leaflet/dist/images/marker-shadow.png";

// ========================================
// LEAFLET MARKER FIX FOR VITE
// ========================================

delete L.Icon.Default.prototype
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ========================================
// RESTAURANT LOCATION
//
// Demo restaurant coordinates.
// Replace these later with the final
// restaurant location if required.
// ========================================

const RESTAURANT = {
  name: "DineFlow Restaurant",

  latitude: 30.3165,
  longitude: 78.0322,

  address:
    "Dehradun, Uttarakhand, India",
};

function RestaurantLocation() {
  const position = [
    RESTAURANT.latitude,
    RESTAURANT.longitude,
  ];

  // ========================================
  // OPEN DIRECTIONS
  // ========================================

  const handleDirections = () => {
    const destination =
      `${RESTAURANT.latitude},${RESTAURANT.longitude}`;

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destination
      )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section>
      <hr />

      <h2>Visit DineFlow</h2>

      <p>
        Find our restaurant and get
        directions.
      </p>

      <p>
        <strong>
          {RESTAURANT.name}
        </strong>
      </p>

      <p>
        {RESTAURANT.address}
      </p>

      {/* =====================================
          INTERACTIVE MAP
      ====================================== */}

      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          height: "400px",
          margin: "20px auto",
        }}
      >
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position}>
            <Popup>
              <strong>
                DineFlow Restaurant
              </strong>

              <br />

              Dehradun, Uttarakhand
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={handleDirections}
      >
        Get Directions
      </button>

      <p>
        <small>
          Map data © OpenStreetMap
          contributors.
        </small>
      </p>
    </section>
  );
}

export default RestaurantLocation;