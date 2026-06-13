import { lazy, useEffect, useMemo, useState } from "react";
import type { Dataset, Event, Series } from "../types";
import { enrich, MAINSHOCK_A_TIME, MAINSHOCK_B_TIME, intensityLabel } from "../utils";
import { buildFieldNote, hoursSince, STALE_THRESHOLD_HOURS } from "../fieldNote";
import { MapView, type MapFocus } from "../components/MapView";
import { MainShockObsPoints } from "../components/MainShockObsPoints";
import { IntensityHistogram } from "../components/IntensityHistogram";
import { ChartSlot } from "../components/ChartSlot";
import { navigate } from "../router";

// Recharts 依存のチャート群は遅延読み込みして初期バンドルから外す
const CumulativeChart = lazy(() =>
  import("../components/CumulativeChart").then((m) => ({ default: m.CumulativeChart })),
);
const MTChart = lazy(() =>
  import("../components/MTChart").then((m) => ({ default: m.MTChart })),
);
const RateChart = lazy(() =>
  import("../components/RateChart").then((m) => ({ default: m.RateChart })),
);
const DepthChart = lazy(() =>
  import("../components/DepthChart").then((m) => ({ default: m.DepthChart })),
);

const HORIZON_PRESETS = [
  { label: "六時間", hours: 6, bin: 0.25 },
  { label: "一日", hours: 24, bin: 1 },
  { label: "三日", hours: 72, bin: 3 },
  { label: "七日", hours: 168, bin: 6 },
  { label: "三十日", hours: 720, bin: 24 },
  { label: "一年", hours: 8760, bin: 168 },
];

const PALETTE = {
  A: "#f59e0b",
  B: "#f43f5e",
  alps: "#6366f1",
};

function formatFetchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d) + " JST";
}

interface PanelProps {
  no: string;
  en: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}

function Panel({ no, en, title, sub, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel__head">
        <span className="panel__no">{no}</span>
        <h2>
          {title}
          {sub && <small>{sub}</small>}
        </h2>
        <span className="panel__en">{en}</span>
      </header>
      {children}
    </section>
  );
}

export function Home() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [horizonIdx, setHorizonIdx] = useState(2);
  const [focus, setFocus] = useState<MapFocus>(null);

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

  if (error) return <p className="error">読み込みエラー: {error}</p>;
  if (!dataset || !series) return <p className="loading">地面の声に耳をすませています …</p>;

  const preset = HORIZON_PRESETS[horizonIdx];
  const note = buildFieldNote(series, dataset.fetched_at);
  const staleHours = hoursSince(dataset.fetched_at);
  const isStale = staleHours != null && staleHours > STALE_THRESHOLD_HOURS;
  const recent = [...series[1].events]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);
  const chartFocus = (id: string | null) => setFocus(id ? { id, fly: false } : null);

  return (
    <div className="obs-room">
      <header className="hud">
        <div className="hud__id">
          <span className="hud__dot" aria-hidden />
          <strong>長野県北部・余震観測室</strong>
          <span className="hud__sub">NAGANO AFTERSHOCK OBSERVATORY</span>
        </div>
        <nav className="hud__nav" aria-label="読みもの">
          <button onClick={() => navigate("istl")}>糸魚川-静岡構造線</button>
          <button onClick={() => navigate("geology")}>北アルプスと縫い目</button>
        </nav>
        {isStale && (
          <span className="hud__stale" role="alert">
            ⚠ データ更新が{Math.floor(staleHours)}時間止まっています
          </span>
        )}
        <div className="hud__meta">
          <span>UPDATED {formatFetchedAt(dataset.fetched_at)}</span>
          <span>{dataset.count} EVENTS</span>
        </div>
      </header>

      <div className="obs-map">
        <MapView series={series} pulseKey="B" focus={focus} />
      </div>

      <aside className="hero">
        <div className="hero__side" aria-hidden>
          <span className="hero__vtag">二つの四月の記録</span>
          <span className="hero__stamp">観</span>
        </div>
        <h1>また同じ日に、<em>揺れた。</em></h1>
        <p className="hero__lead">
          2025年と2026年、ちょうど一年違いの4月18日。<em>糸魚川-静岡構造線</em>の裾野で起きた
          二つの本震の余震活動を、経過時間を揃えて重ねています。
        </p>
        {series.map((s) => {
          const maxM = Math.max(...s.events.map((e) => e.magnitude));
          const maxScale = Math.max(...s.events.map((e) => e.maxScale ?? -1));
          return (
            <div key={s.key} className="hero__row" data-key={s.key}>
              <span className="hero__year">{s.mainshock.time.slice(0, 4)}</span>
              <span className="hero__when">
                {s.mainshock.time.slice(5, 16).replace(/\//g, ".").replace(" ", " ")}
                ／M{s.mainshock.magnitude.toFixed(1)}・震度{intensityLabel(s.mainshock.maxScale)}
              </span>
              <span className="hero__state">{s.key === "A" ? "鎮静" : "進行中"}</span>
              <span className="hero__nums">
                <span>観測<b>{s.events.length}件</b></span>
                <span>最大M<b>{maxM.toFixed(1)}</b></span>
                <span>最大震度<b>{intensityLabel(maxScale)}</b></span>
              </span>
            </div>
          );
        })}
      </aside>

      <div className="rail">
        <section className="panel controls-panel" aria-label="表示期間">
          <span className="label">表示期間</span>
          <div className="seg">
            {HORIZON_PRESETS.map((p, i) => (
              <button
                key={p.label}
                className={i === horizonIdx ? "active" : ""}
                onClick={() => setHorizonIdx(i)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {note && (
          <section className="panel note-panel" aria-label="いまのようす">
            <h2>
              いまのようす
              <span>{formatFetchedAt(dataset.fetched_at)}</span>
            </h2>
            <p>
              本震から <strong>{note.days}日目</strong>。この7日間の有感余震は{" "}
              <strong>{note.recentB}回</strong>。{note.mood}
            </p>
            <p>
              ちなみに去年の系列は、同じ{note.days}日目ごろの7日間で{" "}
              <strong>{note.refA}回</strong> でした。
            </p>
          </section>
        )}

        <Panel no="01" en="RECENT" title="最近の揺れ" sub="今年の系列の直近8件。タップでマップへ">
          <ol className="recent-list">
            {recent.map((e) => (
              <li key={e.id}>
                <button onClick={() => setFocus({ id: e.id, fly: true })}>
                  <span className="recent-list__time">
                    {e.time.slice(5, 16).replace("/", ".")}
                  </span>
                  <span className="recent-list__m">M{e.magnitude.toFixed(1)}</span>
                  <span className="recent-list__int">震度{e.intensity}</span>
                  <span className="recent-list__depth">
                    {e.depth != null ? `深さ${e.depth}km` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel no="02" en="CUMULATIVE" title="累積回数" sub="本震時刻を 0 に揃えて重ね描き。線が寝てくれば沈静化の合図">
          <ChartSlot>
            <CumulativeChart series={series} horizonHours={preset.hours} />
          </ChartSlot>
        </Panel>

        <Panel no="03" en="MAGNITUDE–TIME" title="M-T 散布" sub="時間 × マグニチュード。点にふれるとマップが光ります">
          <ChartSlot>
            <MTChart series={series} horizonHours={preset.hours} onFocus={chartFocus} />
          </ChartSlot>
        </Panel>

        <Panel no="04" en="DECAY RATE" title="発生頻度" sub="1時間あたりの回数と大森-宇津則フィット（参考）">
          <ChartSlot>
            <RateChart series={series} horizonHours={preset.hours} binHours={preset.bin} />
          </ChartSlot>
        </Panel>

        <Panel no="05" en="E–W SECTION" title="東西断面" sub="経度 × 深さ。震源は地殻浅部 10km 前後に集中">
          <ChartSlot>
            <DepthChart series={series} onFocus={chartFocus} />
          </ChartSlot>
        </Panel>

        <Panel no="06" en="INTENSITY" title="震度別回数" sub="各震度階級で何回観測されたか">
          <IntensityHistogram series={series} />
        </Panel>

        <Panel no="07" en="STATIONS" title="震度観測点" sub="本震の長野県内・気象庁発表値">
          <MainShockObsPoints series={series} />
        </Panel>

        <Panel no="08" en="FAULT CONTEXT" title="活断層の文脈" sub="糸魚川-静岡構造線（ISTL）長期評価">
          <ul className="istl-rows">
            <li>
              <span className="l">北部区間（小谷–明科）</span>
              <span className="v">30年以内 ほぼ0〜1%</span>
              <span className="n">2014年神城断層地震で一部解放</span>
            </li>
            <li>
              <span className="l">中北部区間（明科–諏訪湖北）</span>
              <span className="v hot">30年以内 13〜30%</span>
              <span className="n">国内最高水準（地震本部評価）</span>
            </li>
          </ul>
          <p className="istl-quote">
            気象庁は2025年4月18日の地震について、より大きな本震の前兆と判断する根拠は
            得られていないとの見解を示しています。詳しくは
            <button className="linklike" onClick={() => navigate("istl")}>解説ページ</button>へ。
          </p>
          <p className="muted">
            出典:{" "}
            <a href="https://www.jishin.go.jp/regional_seismicity/rs_katsudanso/f041_042_044_itoshizu/" target="_blank" rel="noreferrer">地震調査研究推進本部 ISTL評価</a>
            ／
            <a href="https://www.jishin.go.jp/main/chousa/katsudansou_pdf/41_42_44_itoigawa-shizuoka_2.pdf" target="_blank" rel="noreferrer">長期評価第二版PDF</a>
          </p>
        </Panel>

        <Panel no="09" en="READINGS" title="読みもの" sub="背景を知るための2本">
          <div className="readings">
            <button onClick={() => navigate("istl")}>
              <span className="t">糸魚川-静岡構造線</span>
              <span className="s">日本を東西に分ける158kmの大断層。4つの区間と過去の地震。</span>
              <span className="a">読む ↗</span>
            </button>
            <button onClick={() => navigate("geology")}>
              <span className="t">北アルプスと縫い目</span>
              <span className="s">後立山連峰はまだ隆起中。フォッサマグナ西縁という地質の継ぎ目。</span>
              <span className="a">読む ↗</span>
            </button>
          </div>
        </Panel>

        <footer className="rail-footer">
          <p className="disclaimer">
            <strong>本サイトは個人が趣味で制作したものです。</strong>
            気象庁・地震調査研究推進本部・その他公的機関とは一切関係ありません。
            防災・避難の判断は、必ず
            <a href="https://www.data.jma.go.jp/nagano/shosai/jishinkaisetsu/jishinportal260418.html" target="_blank" rel="noreferrer">公式発表（気象庁ポータル）</a>
            をご確認ください。
          </p>
          <p>
            震源域フィルタ: 北緯 36.4–36.7／東経 137.7–138.1／深さ 30km 以下／M2.0 以上。
            速報値は後の確定値で修正されることがあります。
          </p>
          <p>
            データ出典: <a href="https://www.p2pquake.net/" target="_blank" rel="noreferrer">P2P地震情報 API v2</a>
            ／地図: © OpenStreetMap contributors, © CARTO, © OpenTopoMap (CC-BY-SA)
            ／ISTL の経路は概略です（正確な位置は<a href="https://www.gsi.go.jp/" target="_blank" rel="noreferrer">国土地理院</a>・地震本部を参照）。
          </p>
        </footer>
      </div>
    </div>
  );
}
