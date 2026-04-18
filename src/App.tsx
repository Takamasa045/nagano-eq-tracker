import { useEffect, useMemo, useState } from "react";
import type { Dataset, Event, Series } from "./types";
import { enrich, MAINSHOCK_A_TIME, MAINSHOCK_B_TIME, intensityLabel } from "./utils";
import { MapView } from "./components/MapView";
import { CumulativeChart } from "./components/CumulativeChart";
import { MTChart } from "./components/MTChart";
import { RateChart } from "./components/RateChart";
import { DepthChart } from "./components/DepthChart";
import { MountainSilhouette } from "./components/MountainSilhouette";
import { PEAKS, RELATED_QUAKES, GEO_COPY } from "./geo";
import "./App.css";

const HORIZON_PRESETS = [
  { label: "六時間", hours: 6, bin: 0.25 },
  { label: "一日",   hours: 24, bin: 1 },
  { label: "三日",   hours: 72, bin: 3 },
  { label: "七日",   hours: 168, bin: 6 },
  { label: "三十日", hours: 720, bin: 24 },
  { label: "一年",   hours: 8760, bin: 168 },
];

const PALETTE = {
  A: "#a98a52", // 鈍金
  B: "#c8412c", // 朱
  alps: "#3b6a8a", // 蒼（アルプス）
};

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [horizonIdx, setHorizonIdx] = useState(2);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/events.json`)
      .then((r) => r.json())
      .then((d: Dataset) => setDataset(d))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const series: Series[] | null = useMemo(() => {
    if (!dataset) return null;
    const all: Event[] = enrich(dataset.events);
    const A = all.find((e) => e.time === MAINSHOCK_A_TIME);
    const B = all.find((e) => e.time === MAINSHOCK_B_TIME);
    if (!A || !B) return null;
    const eventsA = all.filter((e) => e.date >= A.date && e.date < B.date);
    const eventsB = all.filter((e) => e.date >= B.date);
    return [
      { key: "A", label: "2025年4月18日 系列", color: PALETTE.A, mainshock: A, events: eventsA },
      { key: "B", label: "2026年4月18日 系列", color: PALETTE.B, mainshock: B, events: eventsB },
    ];
  }, [dataset]);

  if (error) return <div className="app"><p className="error">読み込みエラー: {error}</p></div>;
  if (!dataset || !series) return <div className="app"><p className="muted">読み込み中…</p></div>;

  const preset = HORIZON_PRESETS[horizonIdx];

  return (
    <div className="app">
      <div className="alps-bg">
        <MountainSilhouette />
      </div>

      <header className="hero">
        <span className="tag">NAGANO ／ NORTHERN ALPS ／ AFTERSHOCK</span>
        <h1>
          <span className="ruby">長野県北部</span>
          余震、<em style={{fontStyle:"normal", color:"var(--shu)"}}>また同じ日に。</em>
        </h1>
        <p className="lead">
          <em>2025年4月18日 20:19 M5.1 震度5弱</em> ──
          ちょうど一年後の <em>2026年4月18日 13:20 M5.0 震度5強</em>。
          舞台は北アルプスの東、<em>糸魚川-静岡構造線</em>の通り道。
          本震の時刻を 0 に揃え、余震の収まり方を重ねて眺めます。
        </p>
        <Wave />
        <div className="meta">
          <span>更新: {dataset.fetched_at}</span>
          <span>登録 {dataset.count} 件</span>
          <span>出典: P2P地震情報 API v2</span>
        </div>
      </header>

      <section className="summary">
        {series.map((s) => {
          const maxM = Math.max(...s.events.map((e) => e.magnitude));
          const maxScale = Math.max(...s.events.map((e) => e.maxScale ?? -1));
          return (
            <div
              key={s.key}
              className="card"
              data-key={s.key}
              data-stamp={s.key === "A" ? "鎮静" : "進行中"}
            >
              <h3>{s.label}</h3>
              <div className="big">本震 {s.mainshock.time.replace(/\//g, "・")}</div>
              <div className="stats">
                <div>件数<strong>{s.events.length}</strong></div>
                <div>最大M<strong>{maxM.toFixed(1)}</strong></div>
                <div>最大震度<strong>{intensityLabel(maxScale)}</strong></div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="controls">
        <span className="label">表示期間</span>
        {HORIZON_PRESETS.map((p, i) => (
          <button
            key={p.label}
            className={i === horizonIdx ? "active" : ""}
            onClick={() => setHorizonIdx(i)}
          >
            {p.label}
          </button>
        ))}
      </section>

      <section className="grid">
        <div className="panel">
          <h2>累積件数 <small>本震時刻を 0 に揃えた重ね描き</small></h2>
          <CumulativeChart series={series} horizonHours={preset.hours} />
          <p className="muted">線が立てば活発、寝れば落ち着いた合図。</p>
        </div>
        <div className="panel">
          <h2>M-T 散布 <small>時間 × マグニチュード</small></h2>
          <MTChart series={series} horizonHours={preset.hours} />
          <p className="muted">点の大きさは規模に比例。</p>
        </div>
        <div className="panel wide">
          <h2>発生頻度 <small>大森-宇津則 n(t)=K/(t+c)^p のフィットを重ねる</small></h2>
          <RateChart series={series} horizonHours={preset.hours} binHours={preset.bin} />
        </div>
        <div className="panel wide">
          <h2>震央マップ <small>朱が今、鈍金が去年。蒼の点線が ISTL</small></h2>
          <MapView series={series} pulseKey="B" />
          <p className="muted">震源域フィルタ：北緯 36.4–36.7／東経 137.7–138.1／深さ 30km 以下</p>
        </div>
        <div className="panel wide">
          <h2>東西断面 <small>経度 × 深さ ── 浅部に集中する内陸地殻内地震</small></h2>
          <DepthChart series={series} />
          <p className="muted">
            縦軸は深さ（地表が上）。震源は地殻浅部（10km 前後）に集中しています。点線は ISTL の概略経度。
          </p>
        </div>
      </section>

      <section className="geo">
        <h2 className="section-title">
          <span className="kanji">山</span>
          地学的背景 ── 北アルプスとフォッサマグナ西縁
        </h2>
        <div className="geo-grid">
          {[GEO_COPY.istl, GEO_COPY.fault, GEO_COPY.alps, GEO_COPY.geology].map((c) => (
            <article className="geo-card" key={c.title}>
              <h3>{c.title}</h3>
              <p className="lead-line">{c.lead}</p>
              <p>{c.body}</p>
            </article>
          ))}

          <article className="geo-card wide">
            <h3>後立山連峰の主峰と震源</h3>
            <ul className="peaks">
              {PEAKS.map((p) => (
                <li key={p.name}>
                  <span className="peak-name">{p.name}</span>
                  <span className="peak-elev">{p.elev.toLocaleString()}m</span>
                  <span className="peak-dist">{p.distance}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="geo-card wide">
            <h3>震源域・近隣の歴史地震</h3>
            <ul className="quake-list">
              {RELATED_QUAKES.map((q) => (
                <li key={q.date}>
                  <span className="date">{q.date}</span>
                  <span className="qname">{q.name}</span>
                  <span className="qm">M{q.magnitude}{q.maxScale !== "—" ? `・震度${q.maxScale}` : ""}</span>
                  <span className="qnote">{q.note}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <footer className="footer">
        <p>
          データ出典: <a href="https://www.p2pquake.net/" target="_blank" rel="noreferrer">P2P地震情報 API v2</a>。
          地形タイル: <a href="https://opentopomap.org/" target="_blank" rel="noreferrer">OpenTopoMap</a> (CC-BY-SA)。
          ISTL の経路は装飾用の概略で、厳密な活断層位置は <a href="https://www.gsi.go.jp/" target="_blank" rel="noreferrer">国土地理院</a> や 地震本部の評価をご参照ください。
        </p>
        <p className="credit">© OpenStreetMap contributors ／ © OpenTopoMap (CC-BY-SA) ／ © P2P地震情報 ／ 気象庁</p>
      </footer>
    </div>
  );
}

function Wave() {
  return (
    <svg className="wave" viewBox="0 0 600 24" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M0 12 Q 25 2, 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12 T 450 12 T 500 12 T 550 12 T 600 12" />
    </svg>
  );
}
