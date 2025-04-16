import { SolidLeafletMap } from "solidjs-leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="text-4xl font-semibold my-8">Restaurants.</h1>
      <div class="w-full h-[600px] max-w-5xl mx-auto">
        <SolidLeafletMap
          center={[50.8483744531624, 4.3613369983950125]}
          zoom={10}
          id="map"
          onMapReady={(L, map) => {
            const marker = L.marker([50.8483744531624, 4.3613369983950125]).addTo(map);
            marker.bindPopup("Bruxelles");
          }}
        />
      </div>
    </main>
  );
}
