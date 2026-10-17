#!/usr/bin/env python3
"""P2P地震情報APIから長野県北部のデータを期間取得して正規化JSONを出力"""
from __future__ import annotations

import json
import os
import random
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from http.client import IncompleteRead, RemoteDisconnected
from pathlib import Path

JST = timezone(timedelta(hours=9))

SINCE = "20250417"
MIN_MAG = 2.0
BBOX = (36.4, 36.7, 137.7, 138.1)
DEPTH_MAX = 30
NAME = "長野県北部"

API = "https://api.p2pquake.net/v2/jma/quake"
USER_AGENT = "nagano-eq-tracker/0.1 (+https://github.com/Takamasa045/nagano-eq-tracker) research"

PAGE_LIMIT = 100
PAGE_SLEEP_SEC = 0.6  # rate limit対策 (10 req/min 付近を超えないよう余裕)
REQUEST_TIMEOUT_SEC = 30
MAX_ATTEMPTS = 5
BACKOFF_BASE_SEC = 1.0
RETRYABLE_HTTP = {408, 425, 429, 500, 502, 503, 504}
# 既存カタログがあるときは直近だけ再取得してマージする（全期間ページングがジョブの大半を占めるため）
INCREMENTAL_DAYS = 14
SHRINK_TOLERANCE = 2

RETRYABLE_EXC = (
    IncompleteRead,
    RemoteDisconnected,
    TimeoutError,
    ConnectionError,
    socket.timeout,
    urllib.error.URLError,
    json.JSONDecodeError,
)


def until_date(now: datetime | None = None) -> str:
    """実行時点の翌日（JST）まで。固定値だと以降の余震が取得されず系列が途切れる"""
    now = now or datetime.now(JST)
    return (now + timedelta(days=1)).strftime("%Y%m%d")


def out_path() -> Path:
    return Path(__file__).resolve().parent.parent / "public" / "data" / "events.json"


def event_time_jst(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%Y/%m/%d %H:%M:%S").replace(tzinfo=JST)


def catalog_fingerprint(data: dict) -> dict:
    """fetched_at / until は毎回変わるので、実データの同一性判定から除外する"""
    filt = dict(data.get("filter") or {})
    filt.pop("until", None)
    return {
        "source": data.get("source"),
        "filter": filt,
        "count": data.get("count"),
        "events": data.get("events"),
    }


def filter_compatible(prev: dict | None) -> bool:
    if not prev:
        return False
    filt = prev.get("filter") or {}
    bbox = filt.get("bbox") or {}
    return (
        filt.get("name") == NAME
        and filt.get("depth_max_km") == DEPTH_MAX
        and filt.get("min_magnitude") == MIN_MAG
        and filt.get("since") == SINCE
        and bbox.get("latMin") == BBOX[0]
        and bbox.get("latMax") == BBOX[1]
        and bbox.get("lonMin") == BBOX[2]
        and bbox.get("lonMax") == BBOX[3]
        and isinstance(prev.get("events"), list)
        and len(prev["events"]) > 0
    )


def incremental_since(now: datetime | None = None) -> str:
    now = now or datetime.now(JST)
    return (now - timedelta(days=INCREMENTAL_DAYS)).strftime("%Y%m%d")


def want_full_fetch(prev: dict | None) -> bool:
    if os.environ.get("FULL_FETCH", "").strip() in {"1", "true", "yes"}:
        return True
    return not filter_compatible(prev)


def is_retryable(exc: BaseException) -> bool:
    if isinstance(exc, urllib.error.HTTPError):
        return exc.code in RETRYABLE_HTTP
    if isinstance(exc, RETRYABLE_EXC):
        return True
    cause = getattr(exc, "__cause__", None) or getattr(exc, "__context__", None)
    if cause is not None and cause is not exc:
        return is_retryable(cause)
    return False


def backoff_seconds(attempt: int, *, rng: random.Random | None = None) -> float:
    """attempt は 1-origin。1s, 2s, 4s, ... に少量のジッター。"""
    rng = rng or random
    base = BACKOFF_BASE_SEC * (2 ** (attempt - 1))
    jitter = 0.8 + 0.4 * rng.random()
    return base * jitter


def fetch_page(
    offset: int,
    limit: int = PAGE_LIMIT,
    *,
    since_date: str,
    until: str,
    attempts: int = MAX_ATTEMPTS,
    sleep=time.sleep,
    urlopen=urllib.request.urlopen,
    rng: random.Random | None = None,
) -> list:
    params = {
        "since_date": since_date,
        "until_date": until,
        "min_magnitude": MIN_MAG,
        "limit": limit,
        "offset": offset,
    }
    url = f"{API}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_err: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            with urlopen(req, timeout=REQUEST_TIMEOUT_SEC) as resp:
                payload = json.loads(resp.read())
            if not isinstance(payload, list):
                raise TypeError(f"APIが配列以外を返した: {type(payload).__name__}")
            return payload
        except Exception as exc:  # noqa: BLE001 — リトライ判定してから再送/再送不可なら投げる
            last_err = exc
            if attempt >= attempts or not is_retryable(exc):
                break
            delay = backoff_seconds(attempt, rng=rng)
            print(
                f"fetch retry {attempt}/{attempts} offset={offset} "
                f"{type(exc).__name__}: {exc}; sleep {delay:.1f}s",
                file=sys.stderr,
            )
            sleep(delay)
    assert last_err is not None
    raise last_err


def normalize_record(raw: dict) -> dict | None:
    eq = raw.get("earthquake") or {}
    hypocenter = eq.get("hypocenter") or {}
    if hypocenter.get("name") != NAME:
        return None
    lat, lon, depth, mag = (
        hypocenter.get("latitude"),
        hypocenter.get("longitude"),
        hypocenter.get("depth"),
        hypocenter.get("magnitude"),
    )
    if lat is None or lon is None or mag is None:
        return None
    if not (BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]):
        return None
    if depth is not None and depth > DEPTH_MAX:
        return None
    points_nagano = [
        {"addr": p.get("addr"), "scale": p.get("scale")}
        for p in raw.get("points", []) or []
        if p.get("pref") == "長野県" and p.get("scale") is not None
    ]
    points_nagano.sort(key=lambda p: p["scale"], reverse=True)
    free_comment = (raw.get("comments") or {}).get("freeFormComment") or ""
    rec = {
        "time": eq.get("time"),
        "magnitude": mag,
        "depth": depth,
        "lat": lat,
        "lon": lon,
        "maxScale": eq.get("maxScale"),
        "type": (raw.get("issue") or {}).get("type"),
        "id": raw.get("id"),
        "domesticTsunami": eq.get("domesticTsunami"),
        "points": points_nagano,
    }
    if free_comment.strip():
        rec["freeFormComment"] = free_comment
    return rec


def prefer_detail(existing: dict | None, incoming: dict) -> dict:
    if existing is None or incoming.get("type") == "DetailScale":
        return incoming
    return existing


def records_to_events(records: list[dict]) -> list[dict]:
    by_time: dict[str, dict] = {}
    for raw in records:
        rec = normalize_record(raw)
        if rec is None or not rec.get("time"):
            continue
        key = rec["time"]
        by_time[key] = prefer_detail(by_time.get(key), rec)
    return sorted(by_time.values(), key=lambda x: x["time"])


def merge_incremental(previous_events: list[dict], window_events: list[dict], since_date: str) -> list[dict]:
    cutoff = datetime.strptime(since_date, "%Y%m%d").replace(tzinfo=JST)
    kept = [e for e in previous_events if event_time_jst(e["time"]) < cutoff]
    by_time = {e["time"]: e for e in kept}
    for rec in window_events:
        key = rec["time"]
        by_time[key] = prefer_detail(by_time.get(key), rec)
    return sorted(by_time.values(), key=lambda x: x["time"])


def load_existing(path: Path) -> dict | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text())
    except (json.JSONDecodeError, OSError):
        return None
    return data if isinstance(data, dict) else None


def build_output(events: list[dict], until: str, fetched_at: str) -> dict:
    return {
        "fetched_at": fetched_at,
        "source": "P2P地震情報 API v2 (https://www.p2pquake.net/)",
        "filter": {
            "name": NAME,
            "bbox": {"latMin": BBOX[0], "latMax": BBOX[1], "lonMin": BBOX[2], "lonMax": BBOX[3]},
            "depth_max_km": DEPTH_MAX,
            "min_magnitude": MIN_MAG,
            "since": SINCE,
            "until": until,
        },
        "count": len(events),
        "events": events,
    }


def fetch_all_pages(
    since_date: str,
    until: str,
    *,
    sleep=time.sleep,
    urlopen=urllib.request.urlopen,
) -> list[dict]:
    all_records: list[dict] = []
    offset = 0
    while True:
        page = fetch_page(offset, since_date=since_date, until=until, sleep=sleep, urlopen=urlopen)
        if not page:
            break
        all_records.extend(page)
        print(f"offset={offset} got={len(page)} total={len(all_records)}")
        if len(page) < PAGE_LIMIT:
            break
        offset += PAGE_LIMIT
        sleep(PAGE_SLEEP_SEC)
    return all_records


def write_if_changed(path: Path, out: dict, prev: dict | None) -> bool:
    if prev is not None and catalog_fingerprint(prev) == catalog_fingerprint(out):
        print("catalog unchanged; skip write")
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n")
    print("catalog changed; wrote", path)
    return True


def guard_shrink(prev: dict | None, events: list[dict]) -> None:
    if not prev:
        return
    prev_count = prev.get("count")
    if isinstance(prev_count, int) and len(events) < prev_count - SHRINK_TOLERANCE:
        raise SystemExit(
            f"異常検知: イベント数が {prev_count} → {len(events)} に減少。"
            "取得期間・フィルタ・APIの退行の可能性があるため書き込みを中断"
        )


def print_summary(events: list[dict], path: Path) -> None:
    buckets = {"M2": 0, "M3": 0, "M4": 0, "M5+": 0}
    for event in events:
        mag = event["magnitude"]
        if mag < 3:
            buckets["M2"] += 1
        elif mag < 4:
            buckets["M3"] += 1
        elif mag < 5:
            buckets["M4"] += 1
        else:
            buckets["M5+"] += 1
    print("\n=== 結果 ===")
    print(f"震源域内イベント: {len(events)} 件")
    print(f"M別: {buckets}")
    print(f"期間: {events[0]['time']} 〜 {events[-1]['time']}" if events else "(空)")
    print(f"出力: {path}")


def main(
    *,
    now: datetime | None = None,
    sleep=time.sleep,
    urlopen=urllib.request.urlopen,
    path: Path | None = None,
) -> int:
    now = now or datetime.now(JST)
    until = until_date(now)
    dest = path or out_path()
    prev = load_existing(dest)
    full = want_full_fetch(prev)
    since_date = SINCE if full else max(SINCE, incremental_since(now))
    print(f"fetch mode={'full' if full else 'incremental'} since={since_date} until={until}")

    records = fetch_all_pages(since_date, until, sleep=sleep, urlopen=urlopen)
    window_events = records_to_events(records)
    if full or prev is None:
        events = window_events
    else:
        events = merge_incremental(prev.get("events") or [], window_events, since_date)

    guard_shrink(prev, events)
    fetched_at = now.strftime("%Y-%m-%dT%H:%M:%S%z")
    out = build_output(events, until, fetched_at)
    write_if_changed(dest, out, prev)
    print_summary(events, dest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
