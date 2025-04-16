import { createSignal, createEffect } from "solid-js";
import { SolidLeafletMap } from "solidjs-leaflet";
import "leaflet/dist/leaflet.css";

let mapInstance: any;

export default function Map() {
  const [selectedCountry, setSelectedCountry] = createSignal("");
  const [query, setQuery] = createSignal("");
  const [results, setResults] = createSignal<any[]>([]);

  const countries = [
    "Belgium",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "Netherlands",
    "United Kingdom",
  ];

  createEffect(() => {
    if (query().length < 3 || !selectedCountry()) return;

    const timeout = setTimeout(async () => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query() + ", " + selectedCountry()
        )}&addressdetails=1&limit=5&extratags=1`
      );
      const data = await response.json();
      setResults(data);
    }, 300);

    return () => clearTimeout(timeout);
  });

  const handleSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (mapInstance) {
      mapInstance.setView([lat, lon], 16);
      const marker = window.L.marker([lat, lon]).addTo(mapInstance);
      marker.bindPopup(result.display_name).openPopup();
    }
    setResults([]);
    setQuery(result.display_name);
  };

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="text-4xl font-semibold my-8">Restaurants.</h1>

      <div class="max-w-xl mx-auto mb-4 relative z-50">
        <select
          class="w-full border border-gray-300 rounded p-2 mb-2"
          value={selectedCountry()}
          onInput={(e) => setSelectedCountry(e.currentTarget.value)}
        >
          <option value="">-- Select a country --</option>
          {countries.map((c) => (
            <option value={c}>{c}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search for a restaurant"
          class="w-full border border-gray-300 rounded p-2"
          value={query()}
          disabled={!selectedCountry()}
          onInput={(e) => setQuery(e.currentTarget.value)}
        />

        {results().length > 0 && (
          <ul class="absolute z-50 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-y-auto shadow-lg text-left">
            {results().map((result) => (
              <li
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(result)}
              >
                {result.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="w-full h-[600px] max-w-5xl mx-auto relative z-0">
        <SolidLeafletMap
          center={[50.848, 4.361]}
          zoom={6}
          id="map"
          onMapReady={(L, map) => {
            mapInstance = map;

            const marker = L.marker([50.848, 4.361]).addTo(map);
            marker.bindPopup("Bruxelles");
          }}
        />
      </div>
    </main>
  );
}
