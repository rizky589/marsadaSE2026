"use client";

import "leaflet/dist/leaflet.css";
import type { LatLngTuple } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

const points: { name: string; position: LatLngTuple; progress: string }[] = [
  { name: "Kualuh Hulu", position: [2.554, 99.641], progress: "66%" },
  { name: "Aek Kanopan", position: [2.562, 99.642], progress: "75%" },
  { name: "Marbau", position: [2.37, 99.82], progress: "65%" }
];

export function LaburaMap() {
  return (
    <MapContainer center={[2.48, 99.72]} zoom={10} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((point) => (
        <Marker key={point.name} position={point.position}>
          <Popup>
            <strong>{point.name}</strong>
            <br />
            Progres: {point.progress}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
