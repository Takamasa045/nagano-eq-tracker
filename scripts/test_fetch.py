#!/usr/bin/env python3
"""scripts/fetch.py のリトライ・未変化スキップ・増分マージの単体テスト"""
from __future__ import annotations

import importlib.util
import io
import json
import tempfile
import unittest
import urllib.error
from http.client import IncompleteRead
from pathlib import Path
from unittest.mock import MagicMock

SPEC = importlib.util.spec_from_file_location("fetch_mod", Path(__file__).resolve().parent / "fetch.py")
fetch = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(fetch)


def _raw(
    *,
    time: str,
    mag: float = 2.5,
    name: str = "長野県北部",
    lat: float = 36.5,
    lon: float = 137.9,
    depth: int = 10,
    issue_type: str = "DetailScale",
    eid: str = "id-1",
) -> dict:
    return {
        "id": eid,
        "issue": {"type": issue_type},
        "earthquake": {
            "time": time,
            "maxScale": 10,
            "domesticTsunami": "None",
            "hypocenter": {
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "depth": depth,
                "magnitude": mag,
            },
        },
        "points": [{"pref": "長野県", "addr": "大町市役所", "scale": 10}],
        "comments": {"freeFormComment": ""},
    }


class FakeResponse:
    def __init__(self, payload):
        if isinstance(payload, (bytes, IncompleteRead, Exception)):
            self._payload = payload
        else:
            self._payload = json.dumps(payload).encode()

    def read(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FetchRetryTests(unittest.TestCase):
    def test_retries_incomplete_read_then_succeeds(self):
        pages = [
            FakeResponse(IncompleteRead(b"{")),
            FakeResponse([_raw(time="2026/10/01 00:00:00")]),
        ]
        urlopen = MagicMock(side_effect=pages)
        sleeps: list[float] = []
        got = fetch.fetch_page(
            0,
            since_date="20261001",
            until="20261002",
            sleep=sleeps.append,
            urlopen=urlopen,
            rng=fetch.random.Random(0),
        )
        self.assertEqual(len(got), 1)
        self.assertEqual(urlopen.call_count, 2)
        self.assertEqual(len(sleeps), 1)
        self.assertGreater(sleeps[0], 0)

    def test_gives_up_after_attempts(self):
        urlopen = MagicMock(side_effect=IncompleteRead(b"x"))
        with self.assertRaises(IncompleteRead):
            fetch.fetch_page(
                0,
                since_date="20261001",
                until="20261002",
                attempts=3,
                sleep=lambda _d: None,
                urlopen=urlopen,
                rng=fetch.random.Random(0),
            )
        self.assertEqual(urlopen.call_count, 3)

    def test_does_not_retry_http_404(self):
        err = urllib.error.HTTPError("http://x", 404, "no", hdrs=None, fp=io.BytesIO())
        urlopen = MagicMock(side_effect=err)
        with self.assertRaises(urllib.error.HTTPError):
            fetch.fetch_page(
                0,
                since_date="20261001",
                until="20261002",
                attempts=5,
                sleep=lambda _d: None,
                urlopen=urlopen,
            )
        self.assertEqual(urlopen.call_count, 1)

    def test_retries_http_503(self):
        err = urllib.error.HTTPError("http://x", 503, "unavailable", hdrs=None, fp=io.BytesIO())
        urlopen = MagicMock(side_effect=[err, FakeResponse([])])
        got = fetch.fetch_page(
            0,
            since_date="20261001",
            until="20261002",
            sleep=lambda _d: None,
            urlopen=urlopen,
            rng=fetch.random.Random(1),
        )
        self.assertEqual(got, [])
        self.assertEqual(urlopen.call_count, 2)


class CatalogLogicTests(unittest.TestCase):
    def test_fingerprint_ignores_fetched_at_and_until(self):
        a = fetch.build_output([{"time": "t", "magnitude": 2}], "20261001", "2026-10-01T00:00:00+0900")
        b = fetch.build_output([{"time": "t", "magnitude": 2}], "20261002", "2026-10-02T00:00:00+0900")
        self.assertEqual(fetch.catalog_fingerprint(a), fetch.catalog_fingerprint(b))

    def test_fingerprint_changes_with_events(self):
        a = fetch.build_output([{"time": "t1"}], "20261001", "x")
        b = fetch.build_output([{"time": "t2"}], "20261001", "x")
        self.assertNotEqual(fetch.catalog_fingerprint(a), fetch.catalog_fingerprint(b))

    def test_write_if_changed_skips_identical_catalog(self):
        events = [{"time": "2026/06/18 13:06:00", "magnitude": 2.1}]
        prev = fetch.build_output(events, "20261016", "old")
        new = fetch.build_output(events, "20261018", "new")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.json"
            path.write_text(json.dumps(prev))
            before = path.read_text()
            changed = fetch.write_if_changed(path, new, prev)
            self.assertFalse(changed)
            self.assertEqual(path.read_text(), before)

    def test_write_if_changed_writes_when_events_differ(self):
        prev = fetch.build_output([{"time": "t1"}], "20261016", "old")
        new = fetch.build_output([{"time": "t1"}, {"time": "t2"}], "20261016", "new")
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.json"
            changed = fetch.write_if_changed(path, new, prev)
            self.assertTrue(changed)
            written = json.loads(path.read_text())
            self.assertEqual(written["count"], 2)

    def test_merge_keeps_events_before_window(self):
        previous = [
            {"time": "2026/06/18 13:06:00", "type": "DetailScale", "magnitude": 2.1},
            {"time": "2026/10/05 01:00:00", "type": "Destination", "magnitude": 2.0},
        ]
        window = [
            {"time": "2026/10/05 01:00:00", "type": "DetailScale", "magnitude": 2.2},
            {"time": "2026/10/16 08:00:00", "type": "DetailScale", "magnitude": 2.3},
        ]
        merged = fetch.merge_incremental(previous, window, "20261004")
        times = [e["time"] for e in merged]
        self.assertEqual(
            times,
            ["2026/06/18 13:06:00", "2026/10/05 01:00:00", "2026/10/16 08:00:00"],
        )
        oct5 = next(e for e in merged if e["time"].startswith("2026/10/05"))
        self.assertEqual(oct5["type"], "DetailScale")
        self.assertEqual(oct5["magnitude"], 2.2)

    def test_normalize_drops_out_of_bbox(self):
        rec = fetch.normalize_record(_raw(time="2026/10/01 00:00:00", lat=35.0, lon=135.0, name="紀伊水道"))
        self.assertIsNone(rec)

    def test_guard_shrink_exits(self):
        prev = {"count": 10}
        with self.assertRaises(SystemExit):
            fetch.guard_shrink(prev, [{"time": "t"}] * 7)

    def test_guard_shrink_allows_small_drop(self):
        prev = {"count": 10}
        fetch.guard_shrink(prev, [{"time": "t"}] * 8)


class MainFlowTests(unittest.TestCase):
    def test_main_skips_write_when_incremental_result_matches(self):
        now = fetch.datetime(2026, 10, 17, 12, 0, tzinfo=fetch.JST)
        existing_event = fetch.normalize_record(_raw(time="2026/06/18 13:06:00", eid="old"))
        assert existing_event is not None
        prev = fetch.build_output([existing_event], "20261016", "old-fetched")
        # 増分窓の全国データとして、対象外の震源だけ返す
        urlopen = MagicMock(return_value=FakeResponse([_raw(time="2026/10/16 00:00:00", name="紀伊水道", lat=34.1, lon=135.1)]))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.json"
            path.write_text(json.dumps(prev, ensure_ascii=False, indent=2))
            before = path.read_text()
            fetch.main(now=now, sleep=lambda _d: None, urlopen=urlopen, path=path)
            self.assertEqual(path.read_text(), before)

    def test_main_writes_when_new_event_arrives(self):
        now = fetch.datetime(2026, 10, 17, 12, 0, tzinfo=fetch.JST)
        existing_event = fetch.normalize_record(_raw(time="2026/06/18 13:06:00", eid="old"))
        assert existing_event is not None
        prev = fetch.build_output([existing_event], "20261016", "old-fetched")
        urlopen = MagicMock(return_value=FakeResponse([_raw(time="2026/10/16 09:00:00", eid="new")]))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.json"
            path.write_text(json.dumps(prev, ensure_ascii=False, indent=2))
            fetch.main(now=now, sleep=lambda _d: None, urlopen=urlopen, path=path)
            written = json.loads(path.read_text())
            self.assertEqual(written["count"], 2)
            self.assertEqual(written["events"][-1]["id"], "new")


if __name__ == "__main__":
    unittest.main()
