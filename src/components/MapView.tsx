import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Event, Series } from "../types";
import { magToRadius } from "../utils";
import { ISTL_TRACE, PEAKS } from "../geo";

export type MapFocus = { id: string; fly: boolean } | null;

type Props = {
  series: Series[];
  pulseKey?: "A" | "B";
  focus?: MapFocus;
};

const ISTL_COLOR = "#6366f1";
const PEAK_MIN_ZOOM = 8.4;

const TILE_PRESETS = {
  base: {
    label: "ライト",
    tiles: [
      "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    ],
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
  },
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
        "line-color": ISTL_COLOR,
        "line-width": 14,
        "line-opacity": 0.18,
        "line-blur": 6,
      },
    },
    {
      id: "istl-line",
      type: "line",
      source: "istl",
      paint: {
        "line-color": ISTL_COLOR,
        "line-width": 2.4,
        "line-dasharray": [3, 2],
        "line-opacity": 0.9,
      },
    },
  );
  return { version: 8, sources, layers };
}

/** デスクトップではヒーロー（左）とレール（右）を避けて震源域を中央に置く */
function cameraPadding(): maplibregl.PaddingOptions {
  const desktop = window.matchMedia("(min-width: 1080px)").matches;
  if (!desktop) return { top: 40, bottom: 40, left: 20, right: 20 };
  return { top: 90, bottom: 60, left: 410, right: 480 };
}

function popupHtml(s: Series, e: Event): string {
  const depth = e.depth != null ? `${e.depth}km` : "不明";
  return (
    `<div class="eq-pop">` +
    `<div class="eq-pop__series" style="color:${s.color}">● ${s.label}</div>` +
    `<div class="eq-pop__time">${e.time}</div>` +
    `<div class="eq-pop__stats">` +
    `<span>M<b>${e.magnitude.toFixed(1)}</b></span>` +
    `<span>震度<b>${e.intensity}</b></span>` +
    `<span>深さ<b>${depth}</b></span>` +
    `</div></div>`
  );
}

type MarkerEntry = {
  el: HTMLDivElement;
  lngLat: [number, number];
  html: string;
};

export function MapView({ series, pulseKey, focus }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const entriesRef = useRef<Map<string, MarkerEntry>>(new Map());
  const peakElsRef = useRef<HTMLDivElement[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [tileKey, setTileKey] = useState<TileKey>("base");
  const [faultOverlay, setFaultOverlay] = useState<boolean>(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const desktop = window.matchMedia("(min-width: 1080px)").matches;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildStyle(tileKey, faultOverlay),
      center: [137.9, 36.55],
      zoom: desktop ? 9.6 : 8.8,
      cooperativeGestures: !desktop,
    });
    map.addControl(new maplibregl.NavigationControl({}), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({}), "bottom-left");
    map.jumpTo({ center: [137.9, 36.55], padding: cameraPadding() });
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 14,
      maxWidth: "260px",
    });
    const onZoom = () => {
      const visible = map.getZoom() >= PEAK_MIN_ZOOM;
      for (const el of peakElsRef.current) el.style.display = visible ? "" : "none";
    };
    map.on("zoom", onZoom);
    mapRef.current = map;
    return () => {
      map.off("zoom", onZoom);
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
      entriesRef.current = new Map();
      peakElsRef.current = [];
      const peaksVisible = map.getZoom() >= PEAK_MIN_ZOOM;
      for (const p of PEAKS) {
        const el = document.createElement("div");
        el.className = "peak-marker";
        el.innerHTML =
          `<span class="tri">▲</span>` +
          `<span class="nm">${p.name}</span>` +
          `<span class="el">${p.elev.toLocaleString()}m</span>`;
        el.setAttribute("aria-hidden", "true");
        el.style.display = peaksVisible ? "" : "none";
        const m = new maplibregl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        markersRef.current.push(m);
        peakElsRef.current.push(el);
      }
      for (const s of series) {
        for (const e of s.events) {
          const r = magToRadius(e.magnitude);
          const isMainshock = e.time === s.mainshock.time;
          const el = document.createElement("div");
          el.className = `eq-marker eq-marker--${s.key}${isMainshock && pulseKey === s.key ? " pulse" : ""}`;
          el.style.width = `${r * 2}px`;
          el.style.height = `${r * 2}px`;
          el.style.borderRadius = "50%";
          el.style.boxSizing = "border-box";
          // 色覚多様性対応: 色相に加えて「形」でも区別する
          //   2025(A) = 中空リング / 2026(B) = 塗りつぶし
          if (s.key === "A") {
            el.style.background = "transparent";
            el.style.border = `2px solid ${s.color}`;
          } else {
            el.style.background = `${s.color}73`;
            el.style.border = `1.5px solid ${s.color}`;
          }
          const lngLat: [number, number] = [e.lon, e.lat];
          const html = popupHtml(s, e);
          const depthLabel = e.depth != null ? `深さ${e.depth}キロ` : "深さ不明";
          el.setAttribute("role", "button");
          el.setAttribute("tabindex", "0");
          el.setAttribute(
            "aria-label",
            `${s.label} ${e.time} マグニチュード${e.magnitude.toFixed(1)} 震度${e.intensity} ${depthLabel}`,
          );
          const open = () => popupRef.current?.setLngLat(lngLat).setHTML(html).addTo(map);
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            open();
          });
          el.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              open();
            }
          });
          const m = new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map);
          markersRef.current.push(m);
          entriesRef.current.set(e.id, { el, lngLat, html });
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

  // チャート・リストからのフォーカス連動
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const entry of entriesRef.current.values()) entry.el.classList.remove("focused");
    if (!focus) return;
    const entry = entriesRef.current.get(focus.id);
    if (!entry) return;
    entry.el.classList.add("focused");
    if (focus.fly) {
      map.flyTo({
        center: entry.lngLat,
        zoom: Math.max(map.getZoom(), 10.4),
        padding: cameraPadding(),
        duration: 900,
      });
      popupRef.current?.setLngLat(entry.lngLat).setHTML(entry.html).addTo(map);
    }
  }, [focus]);

  return (
    <div className="map-wrap">
      <div ref={containerRef} className="map-view" />
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
          <span className="legend-dot legend-dot--ring" style={{ borderColor: series[0]?.color }} /> 2025
          <span className="legend-dot" style={{ background: series[1]?.color }} /> 2026
          <span className="legend-line" /> ISTL
        </span>
      </div>
      {faultOverlay && (
        <p className="map-note">
          活断層図はズーム12以上で表示されます（市街地周辺）。出典: 国土地理院 都市圏活断層図。
        </p>
      )}
    </div>
  );
}
