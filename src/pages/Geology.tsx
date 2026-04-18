import { navigate } from "../router";
import { GEO_COPY, PEAKS } from "../geo";

export function Geology() {
  return (
    <>
      <nav className="crumbs">
        <button onClick={() => navigate("home")}>← 余震トラッカーへ戻る</button>
      </nav>

      <header className="detail-hero detail-hero--geo">
        <span className="detail-hero__eyebrow">山と地質のおはなし</span>
        <h1>
          <span className="detail-hero__ruby">きたあるぷす</span>
          北アルプスと縫い目
        </h1>
        <p className="detail-hero__sub">
          震源のすぐ西に、三千メートル級の峰が連なる。ISTL の逆断層運動がいまも山を持ち上げ続けています。
        </p>
      </header>

      <section className="zine">
        <article className="zine__panel">
          <span className="zine__num">壱</span>
          <h2>{GEO_COPY.alps.title}</h2>
          <p className="seg-intro">{GEO_COPY.alps.lead}</p>
          <p>{GEO_COPY.alps.body}</p>
        </article>

        <article className="zine__panel zine__panel--tint">
          <span className="zine__num">弐</span>
          <h2>後立山連峰の主峰</h2>
          <p>震源の西〜北に連なる三千メートル級の峰々。距離感は下の一覧のとおり。</p>
          <ul className="peaks peaks--big">
            {PEAKS.map((p) => (
              <li key={p.name}>
                <span className="peak-name">{p.name}</span>
                <span className="peak-elev">{p.elev.toLocaleString()}m</span>
                <span className="peak-dist">{p.distance}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="zine__panel">
          <span className="zine__num">参</span>
          <h2>{GEO_COPY.geology.title}</h2>
          <p className="seg-intro">{GEO_COPY.geology.lead}</p>
          <p>{GEO_COPY.geology.body}</p>
        </article>
      </section>

      <nav className="pager">
        <button className="pager__next" onClick={() => navigate("istl")}>
          次の読みもの → 糸魚川-静岡構造線
        </button>
        <button className="pager__home" onClick={() => navigate("home")}>
          ↑ 余震トラッカーへ
        </button>
      </nav>

      <footer className="footer">
        <p className="credit">© OpenStreetMap contributors ／ © P2P地震情報 ／ 気象庁</p>
      </footer>
    </>
  );
}
