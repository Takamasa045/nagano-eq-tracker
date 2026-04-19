import type { Series } from "../types";
import { intensityLabel } from "../utils";

interface MainShockObsPointsProps {
  series: Series[];
}

const HIGH_THRESHOLD = 30;

export function MainShockObsPoints({ series }: MainShockObsPointsProps) {
  return (
    <section className="obs-section">
      <h2 className="section-title">
        <span className="kanji">震</span>
        本震の震度観測点 <small>長野県内・気象庁発表値</small>
      </h2>
      <div className="obs-grid">
        {series.map((s) => {
          const points = s.mainshock.points ?? [];
          const high = points.filter((p) => p.scale >= HIGH_THRESHOLD);
          const lowCount = points.length - high.length;
          const byScale = new Map<number, number>();
          for (const p of points) byScale.set(p.scale, (byScale.get(p.scale) ?? 0) + 1);
          const distribution = [...byScale.entries()].sort((a, b) => b[0] - a[0]);
          return (
            <article key={s.key} className="obs-card" data-key={s.key}>
              <header className="obs-card__head">
                <span className="obs-card__label">{s.label}</span>
                <span className="obs-card__time">{s.mainshock.time.replace(/\//g, "・")}</span>
                <span className="obs-card__total">長野県内 {points.length} 点観測</span>
              </header>

              <div className="obs-dist">
                {distribution.map(([scale, count]) => (
                  <span key={scale} className={`chip chip--s${scale}`}>
                    震度{intensityLabel(scale)}
                    <em>{count}</em>
                  </span>
                ))}
              </div>

              <ol className="obs-list">
                {high.map((p) => (
                  <li key={p.addr}>
                    <span className={`obs-badge obs-badge--s${p.scale}`}>
                      {intensityLabel(p.scale)}
                    </span>
                    <span className="obs-addr">{p.addr}</span>
                  </li>
                ))}
              </ol>
              {lowCount > 0 && (
                <p className="obs-foot">
                  ほか震度2以下 <strong>{lowCount}</strong> 点
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
