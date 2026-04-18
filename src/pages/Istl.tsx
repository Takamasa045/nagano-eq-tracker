import { navigate } from "../router";
import { ISTL_FACTS, ISTL_SEGMENTS, RELATED_QUAKES, GEO_COPY } from "../geo";

export function Istl() {
  return (
    <>
      <nav className="crumbs">
        <button onClick={() => navigate("home")}>← 余震トラッカーへ戻る</button>
      </nav>

      <header className="detail-hero detail-hero--istl">
        <span className="detail-hero__eyebrow">活断層のおはなし</span>
        <h1>
          <span className="detail-hero__ruby">いといがわ＝しずおか</span>
          糸魚川-静岡構造線
        </h1>
        <p className="detail-hero__sub">
          日本列島を縦にスッと切り分ける、全長 <strong>{ISTL_FACTS.length}</strong> の大断層。
          東日本と西日本、地質のかたちがここを境にガラリと変わります。
        </p>
      </header>

      <section className="zine">
        <article className="zine__panel">
          <span className="zine__num">壱</span>
          <h2>日本を二つに分ける縫い目</h2>
          <p>
            ISTLは新潟・糸魚川から静岡まで、日本列島を縦断する長大な活断層帯です。
            西側には飛騨変成岩や花崗岩の「硬い地盤」、東側には新第三紀以降の「厚い堆積物」。
            中新世（約1600万年前）にフォッサマグナが開いたときの<em>縫い目</em>が、今も地震のたびに動いています。
          </p>
          <ul className="facts-strip">
            <li><span>総延長</span><strong>{ISTL_FACTS.length}</strong></li>
            <li><span>幅と運動</span><strong>{ISTL_FACTS.width}</strong></li>
            <li><span>起源</span><strong>{ISTL_FACTS.origin}</strong></li>
          </ul>
        </article>

        <article className="zine__panel zine__panel--tint">
          <span className="zine__num">弐</span>
          <h2>性格の違う4つの区間</h2>
          <p>
            ISTLは一枚岩ではなく、北から南へ4つの区間に分かれています。
            北は純粋な逆断層（東が上に乗り上げる）、南へ下がるほど左横ずれ成分が強まります。
          </p>
          <div className="seg-cards">
            {ISTL_SEGMENTS.map((s, i) => (
              <div key={s.name} className="seg-card" data-idx={i}>
                <div className="seg-card__head">
                  <span className="seg-card__marker">{["北", "中北", "中南", "南"][i]}</span>
                  <div>
                    <h3>{s.name}</h3>
                    <p className="seg-card__range">{s.range}</p>
                  </div>
                </div>
                <dl>
                  <div><dt>運動</dt><dd>{s.sense}</dd></div>
                  <div><dt>変位速度</dt><dd>{s.slip}</dd></div>
                  <div><dt>活動間隔</dt><dd>{s.recurrence}</dd></div>
                  <div><dt>最新活動</dt><dd>{s.last}</dd></div>
                  <div><dt>30年確率</dt><dd className="prob">{s.probability}</dd></div>
                </dl>
              </div>
            ))}
          </div>
          <p className="muted">
            出典：
            <a href="https://www.jishin.go.jp/regional_seismicity/rs_katsudanso/f041_042_044_itoshizu/" target="_blank" rel="noreferrer">地震調査研究推進本部「糸魚川-静岡構造線断層帯」評価ページ</a>
            ／
            <a href="https://www.jishin.go.jp/main/chousa/katsudansou_pdf/41_42_44_itoigawa-shizuoka_2.pdf" target="_blank" rel="noreferrer">長期評価第二版PDF</a>
            。確率は基準日により変動します。
          </p>
        </article>

        <article className="zine__panel">
          <span className="zine__num">参</span>
          <h2>神城断層と、今回の震源</h2>
          <p className="seg-intro">{GEO_COPY.fault.lead}</p>
          <p>{GEO_COPY.fault.body}</p>
        </article>

        <article className="zine__panel">
          <span className="zine__num">四</span>
          <h2>2014・2025・2026 を並べて見る</h2>
          <p>
            北アルプス東縁で発生した3つの地震を、公式評価ベースで横並びにしました。
            2014年は長期評価で神城断層との対応が明示されていますが、2025年・2026年については
            「震源周辺に断層帯が存在する」までが公式に確認できる範囲です。
          </p>
          <div className="compare-grid">
            <div className="compare-card">
              <h3>2014年11月22日</h3>
              <p className="compare-card__sub">長野県神城断層地震</p>
              <dl>
                <div><dt>規模</dt><dd>M6.7</dd></div>
                <div><dt>深さ</dt><dd>約5km</dd></div>
                <div><dt>最大震度</dt><dd>6弱</dd></div>
                <div><dt>地震活動の特徴</dt><dd>本震-余震型。前震なし</dd></div>
                <div><dt>断層帯との関係</dt><dd className="compare-card__rel">神城断層北部 約20km 区間が破壊（地震調査委員会の公式評価）</dd></div>
                <div><dt>地殻変動</dt><dd>国土地理院 InSAR・GNSS で地表変位を確認</dd></div>
                <div><dt>出典</dt><dd className="muted">地震調査委員会 平成26年12月評価</dd></div>
              </dl>
            </div>
            <div className="compare-card">
              <h3>2025年4月18日</h3>
              <p className="compare-card__sub">長野県北部の地震</p>
              <dl>
                <div><dt>規模</dt><dd>M5.1</dd></div>
                <div><dt>深さ</dt><dd>地殻内（暫定）</dd></div>
                <div><dt>最大震度</dt><dd>5弱</dd></div>
                <div><dt>地震活動の特徴</dt><dd>4月末まで震度1以上65回（気象庁）</dd></div>
                <div><dt>断層帯との関係</dt><dd className="compare-card__rel">震源周辺に糸魚川-静岡構造線断層帯（北部区間）が存在。断層帯本体の活動と断定する公式評価はなし</dd></div>
                <div><dt>地殻変動</dt><dd>国土地理院「顕著な地殻変動は見られない」</dd></div>
                <div><dt>出典</dt><dd className="muted">気象庁 令和7年4月発表 / 国土地理院</dd></div>
              </dl>
            </div>
            <div className="compare-card compare-card--latest">
              <h3>2026年4月18日</h3>
              <p className="compare-card__sub">長野県北部の地震</p>
              <dl>
                <div><dt>規模</dt><dd>M5.0 / M5.1</dd></div>
                <div><dt>深さ</dt><dd>約8km（暫定）</dd></div>
                <div><dt>最大震度</dt><dd>5強 / 5弱</dd></div>
                <div><dt>地震活動の特徴</dt><dd>13:20 と 14:54 に連続発生</dd></div>
                <div><dt>断層帯との関係</dt><dd className="compare-card__rel">震源周辺に糸魚川-静岡構造線断層帯（北部区間）が存在。発震機構は逆断層型</dd></div>
                <div><dt>地殻変動</dt><dd>確認中（国土地理院の公式公表があれば追記）</dd></div>
                <div><dt>出典</dt><dd className="muted">気象庁 速報情報</dd></div>
              </dl>
            </div>
          </div>
          <p className="muted">
            ※ 値は速報・暫定を含みます。精査後の月報で更新される可能性があります。
          </p>
        </article>

        <article className="zine__panel zine__panel--dark">
          <span className="zine__num">五</span>
          <h2>ISTL と周辺の主な地震</h2>
          <p>古文書の記事から最新の観測まで、この断層帯の周辺で起きた地震を並べてみました。</p>
          <ol className="timeline">
            {RELATED_QUAKES.map((q) => (
              <li key={q.date} className="timeline__item">
                <span className="timeline__dot" />
                <span className="timeline__date">{q.date}</span>
                <div className="timeline__body">
                  <h4>{q.name} <span className="timeline__m">M{q.magnitude}{q.maxScale !== "—" ? ` / 震度${q.maxScale}` : ""}</span></h4>
                  <p>{q.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <article className="zine__panel">
          <span className="zine__num">六</span>
          <h2>もっと深く知るためのデータ</h2>
          <p>
            本サイトは速報レベルの紹介に留まります。波形データや地殻変動の精査結果、
            揺れやすさの地点情報は、それぞれの一次配信元で確認できます。
          </p>
          <ul className="datalinks">
            <li>
              <a href="https://www.kyoshin.bosai.go.jp/" target="_blank" rel="noreferrer">
                NIED K-NET / KiK-net 強震観測網
              </a>
              <span>最大加速度・最大速度分布、観測波形（正式DLは登録要）</span>
            </li>
            <li>
              <a href="https://www.gsi.go.jp/cais/topic.html" target="_blank" rel="noreferrer">
                国土地理院 地殻変動情報
              </a>
              <span>InSAR・GNSS による地表変位の公表資料</span>
            </li>
            <li>
              <a href="https://www.data.jma.go.jp/svd/eqdb/data/shindo/" target="_blank" rel="noreferrer">
                気象庁 震度データベース検索
              </a>
              <span>過去の地震を任意条件で検索（精査後の値）</span>
            </li>
            <li>
              <a href="https://www.data.jma.go.jp/eqev/data/bulletin/" target="_blank" rel="noreferrer">
                気象庁 地震月報
              </a>
              <span>月単位の精査済みカタログ</span>
            </li>
            <li>
              <a href="https://www.j-shis.bosai.go.jp/map/" target="_blank" rel="noreferrer">
                J-SHIS 地震ハザードステーション
              </a>
              <span>表層地盤・揺れやすさ・確率論的予測地図（地点クリック）</span>
            </li>
            <li>
              <a href="https://disaportal.gsi.go.jp/" target="_blank" rel="noreferrer">
                国土地理院 ハザードマップポータル
              </a>
              <span>急傾斜地・大規模盛土造成地・活断層図の重ね合わせ</span>
            </li>
          </ul>
          <p className="muted">
            速報・暫定データはノイズや誤検出を含むことがあります。意思決定の根拠には精査後の月報や評価書をご参照ください。
          </p>
        </article>

        <article className="zine__panel zine__panel--note">
          <span className="zine__num">七</span>
          <h2>気象庁の見解について</h2>
          <p>
            気象庁は2025年4月18日の長野県北部の地震について、
            より大きな本震の前兆と判断する根拠は得られていないとの見解を示しています。
            ただし活断層帯の周辺では今後も同程度の地震が起きうるため、
            地震本部が示す長期評価とあわせ、平常時からの備えが推奨されています。
          </p>
          <p className="muted">
            参考：気象庁「令和7年4月18日 長野県北部の地震に関する報道発表資料」。
            本サイトは活断層帯の地質的背景の解説を目的としており、地震予知を行うものではありません。
          </p>
        </article>
      </section>

      <nav className="pager">
        <button className="pager__next" onClick={() => navigate("geology")}>
          次の読みもの → 北アルプスと縫い目
        </button>
        <button className="pager__home" onClick={() => navigate("home")}>
          ↑ 余震トラッカーへ
        </button>
      </nav>

      <footer className="footer">
        <p>
          一次出典:&nbsp;
          <a href="https://www.jishin.go.jp/regional_seismicity/rs_katsudanso/f041_042_044_itoshizu/" target="_blank" rel="noreferrer">地震調査研究推進本部 ISTL評価</a>
          ／
          <a href="https://www.jishin.go.jp/main/chousa/katsudansou_pdf/41_42_44_itoigawa-shizuoka_2.pdf" target="_blank" rel="noreferrer">長期評価第二版PDF</a>
          ／ 気象庁 報道発表資料 ／『日本被害地震総覧』
        </p>
        <p className="credit">最終更新: 2026年4月18日 ／ 地形の概略経路は装飾用です。</p>
      </footer>
    </>
  );
}
