import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Series } from "../types";
import { magToRadius } from "../utils";
import { ISTL_TRACE } from "../geo";

type Props = { series: Series[]; pulseKey?: "A" | "B" };

const TILE_PRESETS = {
  topo: {
    label: "地形",
    tiles: [
      "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
      "https://c.tile.opentopomap.org/{z}/{x}/{y}.png",
    ],
    attribution:
      'タイル: © <a href="https://opentopomap.org/">OpenTopoMap</a> (CC-BY-SA) / © OSM',
  },
  std: {
    label: "標準",
    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
} as const;

type TileKey = keyof typeof TILE_PRESETS;

const GSI_FAULT_TILES = ["https://cyberjapandata.gsi.go.jp/xyz/afm/{z}/{x}/{y}.png"];
const GSI_FAULT_ATTRIBUTION =
  '活断層図: <a href="https://maps.gsi.go.jp/" target="_blank" rel="noreferrer">国土地理院</a> 都市圏活断層図';

function buildStyle(tileKey: TileKey, faultOverlay: boolean): maplibregl.StyleSpecification {
  const preset = TILE_PRESETS[tileKey];
  const sources: maplibregl.StyleSpecification["sources"] = {
    base: {
      type: "raster",
      tiles: preset.tiles as unknown as string[],
      tileSize: 256,
      attribution: preset.attribution,
    },
    istl: {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: ISTL_TRACE.map((p) => [p.lng, p.lat]),
        },
        properties: { name: "糸魚川-静岡構造線（概略）" },
      },
    },
  };
  const layers: maplibregl.LayerSpecification[] = [
    { id: "base", type: "raster", source: "base" },
  ];
  if (faultOverlay) {
    sources.fault = {
      type: "raster",
      tiles: GSI_FAULT_TILES,
      tileSize: 256,
      minzoom: 12,
      maxzoom: 16,
      attribution: GSI_FAULT_ATTRIBUTION,
    };
    layers.push({
      id: "fault",
      type: "raster",
      source: "fault",
      paint: { "raster-opacity": 0.85 },
    });
  }
  layers.push(
    {
      id: "istl-glow",
      type: "line",
      source: "istl",
      paint: {
        "line-color": "#3b6a8a",
        "line-width": 14,
        "line-opacity": 0.22,
        "line-blur": 6,
      },
    },
    {
      id: "istl-line",
      type: "line",
      source: "istl",
      paint: {
        "line-color": "#3b6a8a",
        "line-width": 3.2,
        "line-dasharray": [3, 2],
        "line-opacity": 1,
      },
    },
  );
  return { version: 8, sources, layers };
}

export function MapView({ series, pulseKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [tileKey, setTileKey] = useState<TileKey>("std");
  const [faultOverlay, setFaultOverlay] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(tileKey, faultOverlay),
      center: [137.9, 36.55],
      zoom: 9,
    });
    map.addControl(new maplibregl.NavigationControl({}), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(buildStyle(tileKey, faultOverlay));
  }, [tileKey, faultOverlay]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const render = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      for (const s of series) {
        for (const e of s.events) {
          const r = magToRadius(e.magnitude);
          const isMainshock = e.time === s.mainshock.time;
          const el = document.createElement("div");
          el.className = `eq-marker${isMainshock && pulseKey === s.key ? " pulse" : ""}`;
          el.style.width = `${r * 2}px`;
          el.style.height = `${r * 2}px`;
          el.style.borderRadius = "50%";
          el.style.background = `${s.color}55`;
          el.style.border = `2px solid ${s.color}`;
          el.style.boxSizing = "border-box";
          el.title = `${s.label}\n${e.time}\nM${e.magnitude} 震度${e.intensity} 深さ${e.depth}km`;
          const m = new maplibregl.Marker({ element: el })
            .setLngLat([e.lon, e.lat])
            .addTo(map);
          markersRef.current.push(m);
        }
      }
    };
    const onStyle = () => render();
    if (map.isStyleLoaded()) render();
    map.on("styledata", onStyle);
    return () => {
      map.off("styledata", onStyle);
    };
  }, [series, pulseKey, tileKey, faultOverlay]);

  return (
    <div className="map-wrap">
      <div className="map-controls">
        {(Object.keys(TILE_PRESETS) as TileKey[]).map((k) => (
          <button
            key={k}
            className={k === tileKey ? "active" : ""}
            onClick={() => setTileKey(k)}
          >
            {TILE_PRESETS[k].label}
          </button>
        ))}
        <button
          className={`overlay ${faultOverlay ? "active" : ""}`}
          onClick={() => setFaultOverlay((v) => !v)}
          title="国土地理院 都市圏活断層図（拡大時に表示）"
        >
          活断層図 {faultOverlay ? "ON" : "OFF"}
        </button>
        <span className="legend">
          <span className="legend-line" /> 糸魚川-静岡構造線（概略位置）
        </span>
      </div>
      <div ref={containerRef} className="map-view" />
      {faultOverlay && (
        <p className="map-note">
          活断層図はズーム12以上で表示されます（市街地周辺）。出典: 国土地理院 都市圏活断層図。
        </p>
      )}
    </div>
  );
}
