"""PDF export requires Chromium in every build/test workflow."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class BuildPrerequisiteTests(unittest.TestCase):
    def test_chromium_is_installed_before_pdf_generating_commands(self):
        for name in ("quality.yml", "pages.yml", "app-bundles.yml", "bundle-checks.yml"):
            with self.subTest(workflow=name):
                lines = (ROOT / ".github/workflows" / name).read_text().splitlines()
                installs = [i for i, line in enumerate(lines) if "run: npx playwright install --with-deps chromium" in line]
                consumers = [i for i, line in enumerate(lines) if line.strip() in ("- run: npm test", "- run: npm run build")]
                self.assertEqual(len(installs), 1)
                self.assertTrue(consumers)
                self.assertTrue(all(installs[0] < index for index in consumers))

if __name__ == "__main__":
    unittest.main()
