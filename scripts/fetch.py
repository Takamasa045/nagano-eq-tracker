#!/usr/bin/env python3
"""P2P地震情報APIから長野県北部のデータを期間取得して正規化JSONを出力"""
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

SINCE = "20250417"
UNTIL = "20260419"
MIN_MAG = 2.0
BBOX = (36.4, 36.7, 137.7, 138.1)
DEPTH_MAX = 30
NAME = "長野県北部"

API = "https://api.p2pquake.net/v2/jma/quake"


def fetch_page(offset: int, limit: int = 100):
    params = {
        "since_date": SINCE,
        "until_date": UNTIL,
        "min_magnitude": MIN_MAG,
        "limit": limit,
        "offset": offset,
    }
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "nagano-eq-tracker/0.1 (+https://github.com/) research"
    })
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def main():
    all_records = []
    offset = 0
    while True:
        page = fetch_page(offset)
        if not page:
            break
        all_records.extend(page)
        print(f"offset={offset} got={len(page)} total={len(all_records)}")
        if len(page) < 100:
            break
        offset += 100
        time.sleep(0.6)  # rate limit対策 (10 req/min)

    # 重複除外と震源域フィルタ
    by_id = {}
    for r in all_records:
        eq = r.get("earthquake", {})
        h = eq.get("hypocenter", {})
        if h.get("name") != NAME:
            continue
        lat, lon, depth, mag = h.get("latitude"), h.get("longitude"), h.get("depth"), h.get("magnitude")
        if lat is None or lon is None or mag is None:
            continue
        if not (BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]):
            continue
        if depth is not None and depth > DEPTH_MAX:
            continue
        # 同一timeで複数報があれば DetailScale > Destination の優先
        t = eq.get("time")
        key = t
        rec = {
            "time": t,
            "magnitude": mag,
            "depth": depth,
            "lat": lat,
            "lon": lon,
            "maxScale": eq.get("maxScale"),
            "type": r.get("issue", {}).get("type"),
            "id": r.get("id"),
        }
        if key not in by_id or rec["type"] == "DetailScale":
            by_id[key] = rec

    events = sorted(by_id.values(), key=lambda x: x["time"])
    out = {
        "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "source": "P2P地震情報 API v2 (https://www.p2pquake.net/)",
        "filter": {
            "name": NAME,
            "bbox": {"latMin": BBOX[0], "latMax": BBOX[1], "lonMin": BBOX[2], "lonMax": BBOX[3]},
            "depth_max_km": DEPTH_MAX,
            "min_magnitude": MIN_MAG,
            "since": SINCE,
            "until": UNTIL,
        },
        "count": len(events),
        "events": events,
    }
    out_path = Path(__file__).resolve().parent.parent / "public" / "data" / "events.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2))

    # サマリー
    m_buckets = {"M2": 0, "M3": 0, "M4": 0, "M5+": 0}
    for e in events:
        m = e["magnitude"]
        if m < 3:
            m_buckets["M2"] += 1
        elif m < 4:
            m_buckets["M3"] += 1
        elif m < 5:
            m_buckets["M4"] += 1
        else:
            m_buckets["M5+"] += 1
    print(f"\n=== 結果 ===")
    print(f"震源域内イベント: {len(events)} 件")
    print(f"M別: {m_buckets}")
    print(f"期間: {events[0]['time']} 〜 {events[-1]['time']}" if events else "(空)")
    print(f"出力: {out_path}")


if __name__ == "__main__":
    main()
