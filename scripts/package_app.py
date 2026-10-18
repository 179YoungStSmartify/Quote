#!/usr/bin/env python3
"""Build and verify the immutable root-hosted app bundle."""
import argparse
import gzip
import hashlib
import json
import re
import tarfile
from pathlib import Path, PurePosixPath

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
SAFE_PART = re.compile(r"^[A-Za-z0-9._-]+$")


def _safe_name(name):
    if not isinstance(name, str) or not name or name.startswith("./") or "//" in name:
        raise ValueError(f"noncanonical path: {name}")
    path = PurePosixPath(name)
    if path.as_posix() != name:
        raise ValueError(f"noncanonical path: {name}")
    if path.is_absolute() or not path.parts or any(
        part in (".", "..") or not SAFE_PART.fullmatch(part) for part in path.parts
    ):
        raise ValueError(f"unsafe path: {name}")
    return path


def _validate_tree(dist):
    if not dist.is_dir():
        raise ValueError("dist directory is missing")
    files = {}
    for path in sorted(dist.rglob("*")):
        rel = path.relative_to(dist).as_posix()
        _safe_name(rel)
        if path.is_symlink():
            raise ValueError(f"symlink is not allowed: {rel}")
        if path.is_dir():
            continue
        if not path.is_file():
            raise ValueError(f"unsupported filesystem entry: {rel}")
        files[rel] = path
    for required in ("index.html", "quote.pdf"):
        if required not in files:
            raise ValueError(f"missing required file: {required}")
    if not files["quote.pdf"].read_bytes().startswith(b"%PDF-"):
        raise ValueError("quote.pdf is not a PDF")
    if not any(name.startswith("assets/") and len(PurePosixPath(name).parts) > 1 for name in files):
        raise ValueError("missing required assets/ content")
    html = files["index.html"].read_text(encoding="utf-8")
    if re.search(r"(?:/Quote/|\./Quote/|\bbase=\"/Quote/)", html, re.IGNORECASE):
        raise ValueError("index.html contains a non-root base path")
    # Check local absolute/relative asset references in HTML resolve within dist.
    for ref in re.findall(r'''(?:src|href)=["']([^"']+)["']''', html, re.IGNORECASE):
        if ref.startswith(("#", "data:", "http:", "https:", "mailto:", "//")):
            continue
        clean = ref.split("?", 1)[0].split("#", 1)[0]
        target = _safe_name(clean.lstrip("/"))
        if target.as_posix() not in files:
            raise ValueError(f"index.html references missing asset: {ref}")
    return files


def package(dist, output_dir, commit):
    if not SHA_RE.fullmatch(commit):
        raise ValueError("commit must be a full lowercase 40-character SHA")
    files = _validate_tree(Path(dist))
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    archive = output_dir / "app.tar.gz"
    with archive.open("wb") as raw:
        with gzip.GzipFile(fileobj=raw, mode="wb", filename="", mtime=0) as compressed:
            with tarfile.open(fileobj=compressed, mode="w", format=tarfile.PAX_FORMAT) as tar:
                for name, path in files.items():
                    info = tarfile.TarInfo(name)
                    info.size = path.stat().st_size
                    info.mode = 0o644
                    info.mtime = 0
                    with path.open("rb") as stream:
                        tar.addfile(info, stream)
    manifest_data = {
        "schema": 1,
        "commit": commit,
        "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "bundle": "app.tar.gz",
        "base_path": "/",
    }
    manifest = output_dir / "app-manifest.json"
    manifest.write_text(json.dumps(manifest_data, separators=(",", ":")) + "\n", encoding="utf-8")
    return archive, manifest


def verify(archive, manifest):
    archive, manifest = Path(archive), Path(manifest)
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate manifest key: {key}")
            result[key] = value
        return result
    data = json.loads(manifest.read_text(encoding="utf-8"), object_pairs_hook=unique_object)
    if set(data) != {"schema", "commit", "sha256", "bundle", "base_path"}:
        raise ValueError("manifest fields do not match schema 1")
    if type(data["schema"]) is not int or data["schema"] != 1 or type(data["bundle"]) is not str or data["bundle"] != "app.tar.gz" or type(data["base_path"]) is not str or data["base_path"] != "/":
        raise ValueError("manifest protocol values are invalid")
    if not isinstance(data["commit"], str) or not SHA_RE.fullmatch(data["commit"]):
        raise ValueError("manifest commit is invalid")
    if not isinstance(data["sha256"], str) or not re.fullmatch(r"[0-9a-f]{64}", data["sha256"]):
        raise ValueError("manifest sha256 is invalid")
    if hashlib.sha256(archive.read_bytes()).hexdigest() != data["sha256"]:
        raise ValueError("sha256 does not match app.tar.gz")
    names = set()
    with tarfile.open(archive, "r:gz") as tar:
        for member in tar:
            canonical = _safe_name(member.name).as_posix()
            if not member.isfile():
                raise ValueError(f"unsafe archive entry type: {member.name}")
            if canonical in names:
                raise ValueError(f"duplicate archive entry: {member.name}")
            names.add(canonical)
        if not {"index.html", "quote.pdf"}.issubset(names):
            raise ValueError("archive missing index.html or quote.pdf")
        if not any(name.startswith("assets/") for name in names):
            raise ValueError("archive missing required assets/ content")
    return data


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("package")
    build.add_argument("--dist", default="dist")
    build.add_argument("--output", default="bundle")
    build.add_argument("--commit", required=True)
    check = sub.add_parser("verify")
    check.add_argument("--archive", default="bundle/app.tar.gz")
    check.add_argument("--manifest", default="bundle/app-manifest.json")
    args = parser.parse_args()
    if args.command == "package":
        archive, manifest = package(args.dist, args.output, args.commit)
        print(f"created {archive} and {manifest}")
    else:
        verify(args.archive, args.manifest)
        print("bundle and manifest verified")


if __name__ == "__main__":
    main()
