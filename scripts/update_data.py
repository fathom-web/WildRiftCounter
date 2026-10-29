#!/usr/bin/env python3
"""Refresh public community Wild Rift data; preserve last good data on failure."""
import json, pathlib, urllib.request, datetime, sys
root = pathlib.Path(__file__).resolve().parents[1] / "data"
root.mkdir(exist_ok=True)
sources = {
    "champions.json": "https://ry2x.github.io/WildRift-Merged-Champion-Data/data_en_US.json",
    "stats.json": "https://ry2x.github.io/WildRift-Merged-Stats-Data/heroStats.json",
}
success = []
errors = []
for file, url in sources.items():
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "WildRiftCounter/1.0"})
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read(12_000_000)
        obj = json.loads(body)
        if not isinstance(obj, (list, dict)) or len(str(obj)) < 1000:
            raise ValueError("Unexpected or empty dataset")
        dest = root / file
        content = json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
        if not dest.exists() or dest.read_text(encoding="utf-8") != content:
            dest.write_text(content, encoding="utf-8")
        success.append(file)
    except Exception as exc:
        errors.append(f"{file}: {exc}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
status_file = root / "status.json"
previous = json.loads(status_file.read_text()) if status_file.exists() else {}
if success:
    previous.update(updated_at=now, sources_updated=success, errors=errors)
    status_file.write_text(json.dumps(previous, indent=2), encoding="utf-8")
print(json.dumps({"updated": success, "errors": errors}))
if errors:
    sys.exit(1)
