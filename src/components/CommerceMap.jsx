import { useEffect, useRef, useState } from "react";

function parseCoord(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function CommerceMap({ lat, lng, onPointSelected }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onPointSelectedRef = useRef(onPointSelected);
  const [mapReady, setMapReady] = useState(true);
  const [status, setStatus] = useState("Aun no seleccionaste ubicacion en el mapa.");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onPointSelectedRef.current = onPointSelected;
  }, [onPointSelected]);

  useEffect(() => {
    let mounted = true;

    async function loadMap() {
      try {
        const L = await import("leaflet");

        if (!mounted || !mapRef.current) {
          return;
        }

        const map = L.map(mapRef.current, {
          scrollWheelZoom: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          dragging: true,
          zoomControl: true
        }).setView([-34.6037345, -58.3815704], 11);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors"
        }).addTo(map);

        map.on("click", (event) => {
          const latValue = Number(event.latlng.lat);
          const lngValue = Number(event.latlng.lng);
          if (!markerRef.current) {
            markerRef.current = L.circleMarker([latValue, lngValue], {
              radius: 9,
              color: "#ffffff",
              weight: 2,
              fillColor: "#007aff",
              fillOpacity: 0.95
            }).addTo(map);
          } else {
            markerRef.current.setLatLng([latValue, lngValue]);
          }
          setStatus(`Ubicacion seleccionada: lat ${latValue.toFixed(7)}, lng ${lngValue.toFixed(7)}.`);
          onPointSelectedRef.current?.(latValue, lngValue);
        });

        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 120);
      } catch {
        if (mounted) {
          setMapReady(false);
          setStatus(
            "No pudimos cargar el mapa. Completa un link de Google Maps y el equipo validara la ubicacion."
          );
        }
      }
    }

    loadMap();
    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // Avoid runtime crashes if the map instance is already disposed.
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function syncMarker() {
      const map = mapInstanceRef.current;
      const latValue = parseCoord(lat);
      const lngValue = parseCoord(lng);
      if (!map || latValue === null || lngValue === null) {
        return;
      }
      const L = await import("leaflet");
      const point = [latValue, lngValue];
      if (!markerRef.current) {
        markerRef.current = L.circleMarker(point, {
          radius: 9,
          color: "#ffffff",
          weight: 2,
          fillColor: "#007aff",
          fillOpacity: 0.95
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(point);
      }
      map.setView(point, 15);
      setStatus(`Ubicacion seleccionada: lat ${latValue.toFixed(7)}, lng ${lngValue.toFixed(7)}.`);
    }
    syncMarker();
  }, [lat, lng]);

  const onLocate = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      setStatus("No se pudo acceder a geolocalizacion. Selecciona el punto manualmente.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latValue = position.coords.latitude;
        const lngValue = position.coords.longitude;
        mapInstanceRef.current.flyTo([latValue, lngValue], 15);
        onPointSelectedRef.current?.(latValue, lngValue);
        setLocating(false);
      },
      () => {
        setStatus("No pudimos obtener tu ubicacion actual. Selecciona el punto manualmente.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <section className="map-block" aria-labelledby="map-title">
      <h3 id="map-title">Ubicacion en mapa</h3>
      <p className="muted">
        Toca o haz clic en el punto exacto de tu comercio para cargar latitud y longitud
        automaticamente.
      </p>
      {mapReady && (
        <div
          id="commerce-map"
          ref={mapRef}
          role="application"
          aria-label="Mapa para seleccionar ubicacion"
        />
      )}
      <div className="map-actions">
        <button type="button" className="button secondary" onClick={onLocate} disabled={locating}>
          {locating ? "Buscando ubicacion..." : "Usar mi ubicacion actual"}
        </button>
      </div>
      <p className="map-status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}

export default CommerceMap;


