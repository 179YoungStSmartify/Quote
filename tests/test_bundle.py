import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import package_app  # noqa: E402


class BundleTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.dist = self.root / "dist"
        (self.dist / "assets").mkdir(parents=True)
        (self.dist / "index.html").write_text(
            '<html><script type="module" src="/assets/app.js"></script></html>'
        )
        (self.dist / "assets/app.js").write_text("app")
        (self.dist / "quote.pdf").write_bytes(b"%PDF-1.7\n")

    def tearDown(self):
        self.tmp.cleanup()

    def test_packages_root_app_and_manifest_integrity(self):
        sha = "a" * 40
        archive, manifest = package_app.package(self.dist, self.root / "out", sha)
        data = json.loads(manifest.read_text())
        self.assertEqual(data, {
            "schema": 1, "commit": sha,
            "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
            "bundle": "app.tar.gz", "base_path": "/",
        })
        self.assertEqual(package_app.verify(archive, manifest), data)

    def test_identical_dist_produces_identical_archive(self):
        first, _ = package_app.package(self.dist, self.root / "first", "a" * 40)
        second, _ = package_app.package(self.dist, self.root / "second", "a" * 40)
        self.assertEqual(first.read_bytes(), second.read_bytes())

    def test_rejects_bad_manifest_sha(self):
        archive, manifest = package_app.package(self.dist, self.root / "out", "b" * 40)
        data = json.loads(manifest.read_text())
        data["sha256"] = "0" * 64
        manifest.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "sha256"):
            package_app.verify(archive, manifest)

    def test_rejects_missing_required_files(self):
        (self.dist / "quote.pdf").unlink()
        with self.assertRaisesRegex(ValueError, "quote.pdf"):
            package_app.package(self.dist, self.root / "out", "a" * 40)
        (self.dist / "quote.pdf").write_bytes(b"%PDF")
        (self.dist / "index.html").unlink()
        with self.assertRaisesRegex(ValueError, "index.html"):
            package_app.package(self.dist, self.root / "out", "a" * 40)

    def test_rejects_nonroot_asset_links(self):
        (self.dist / "index.html").write_text('<script src="/Quote/assets/app.js"></script>')
        with self.assertRaisesRegex(ValueError, "root"):
            package_app.package(self.dist, self.root / "out", "a" * 40)

    def test_rejects_symlinks_and_unsafe_paths(self):
        (self.dist / "bad name").write_text("x")
        with self.assertRaisesRegex(ValueError, "unsafe"):
            package_app.package(self.dist, self.root / "out", "a" * 40)
        (self.dist / "bad name").unlink()
        (self.dist / "link").symlink_to(self.dist / "quote.pdf")
        with self.assertRaisesRegex(ValueError, "symlink"):
            package_app.package(self.dist, self.root / "out", "a" * 40)

    def test_rejects_unsafe_archive_entries_during_verification(self):
        archive, manifest = package_app.package(self.dist, self.root / "out", "a" * 40)
        import tarfile
        with tarfile.open(archive, "w:gz") as tar:
            info = tarfile.TarInfo("../escape")
            info.size = 1
            import io
            tar.addfile(info, io.BytesIO(b"x"))
        data = json.loads(manifest.read_text())
        data["sha256"] = hashlib.sha256(archive.read_bytes()).hexdigest()
        manifest.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "unsafe"):
            package_app.verify(archive, manifest)


if __name__ == "__main__":
    unittest.main()
