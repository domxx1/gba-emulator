#!/usr/bin/env python3
"""Create an IPS32 patch and checked metadata from a GBA base and build."""
import argparse
import hashlib
import json
from pathlib import Path

def digest(data):
    return hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", type=Path)
    parser.add_argument("build", type=Path)
    parser.add_argument("patch", type=Path)
    parser.add_argument("--name", required=True, help="Display name in mobile.html")
    parser.add_argument("--commit", default="")
    parser.add_argument("--url", default="", help="HTTPS URL to the published .ips32")
    args = parser.parse_args()
    base, build = args.base.read_bytes(), args.build.read_bytes()
    if len(base) > len(build):
        parser.error("The base ROM cannot be larger than the build.")
    if len(build) > 32 * 1024 * 1024:
        parser.error("GBA ROM exceeds 32 MiB.")
    padded_base = base + b"\xff" * (len(build) - len(base))
    patch = bytearray(b"IPS32")
    pos = 0
    while pos < len(build):
        if padded_base[pos] == build[pos]:
            pos += 1
            continue
        start = pos
        while pos < len(build) and padded_base[pos] != build[pos] and pos - start < 65535:
            pos += 1
        patch.extend(start.to_bytes(4, "big"))
        patch.extend((pos - start).to_bytes(2, "big"))
        patch.extend(build[start:pos])
    patch.extend(b"EEOF")
    args.patch.write_bytes(patch)
    meta = dict(name=args.name, commit=args.commit, url=args.url,
                baseSha256=digest(base), patchSha256=digest(patch),
                resultSha256=digest(build), resultSize=len(build))
    args.patch.with_suffix(".json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(f"{args.patch}: {len(patch):,} bytes; metadata: {args.patch.with_suffix('.json')}")

if __name__ == "__main__":
    main()
