"""Check data/sites.geojson against the catalogue's rules. Exits non-zero on errors.

Usage: python scripts/validate.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = ["id", "name", "country", "coordinate_precision", "summary", "analogue_for_primary",
            "analogue_type_primary", "science_relevance", "environment_type_primary",
            "access_level", "hazard_rating", "review_status"]
SINGLE = {"analogue_for_primary": "analogue_for", "analogue_type_primary": "analogue_type",
          "environment_type_primary": "environment_type", "geological_setting": "geological_setting",
          "land_status": "land_status", "coordinate_precision": "coordinate_precision",
          "review_status": "review_status"}
MULTI = {"analogue_for_other": "analogue_for", "analogue_type_other": "analogue_type",
         "environment_type_other": "environment_type", "hazards": "hazards"}


def main():
    data = json.loads((ROOT / "data" / "sites.geojson").read_text(encoding="utf-8"))
    vocab = json.loads((ROOT / "data" / "vocab.json").read_text(encoding="utf-8"))
    errors, warnings, ids = [], [], set()
    for f in data["features"]:
        p = f["properties"]
        sid = p.get("id", "?")
        if sid in ids:
            errors.append(f"{sid}: duplicate id")
        ids.add(sid)
        lon, lat = f["geometry"]["coordinates"]
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            errors.append(f"{sid}: coordinates out of range")
        for k in REQUIRED:
            if p.get(k) in (None, "", []):
                warnings.append(f"{sid}: missing {k}")
        for k, v in SINGLE.items():
            if p.get(k) is not None and p[k] not in vocab[v]:
                errors.append(f"{sid}: {k} '{p[k]}' is not in the {v} list")
        for k, v in MULTI.items():
            for item in p.get(k, []):
                if item not in vocab[v]:
                    errors.append(f"{sid}: {k} item '{item}' is not in the {v} list")
        for k in ("access_level", "hazard_rating"):
            if p.get(k) is not None and p[k] not in range(1, 6):
                errors.append(f"{sid}: {k} must be 1 to 5")
        if not p.get("references"):
            warnings.append(f"{sid}: no references")
        if len(p.get("summary") or "") > 300:
            warnings.append(f"{sid}: summary over 300 characters")
    for w in warnings:
        print("warning:", w)
    for e in errors:
        print("ERROR:", e)
    print(f"{len(data['features'])} sites checked: {len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
