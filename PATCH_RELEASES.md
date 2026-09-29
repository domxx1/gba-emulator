# Smaragd patch releases

The emulator reads `smaragd-patches.json` from GitHub Pages. It begins empty until a verified patch is published.

1. Build the current `.gba` locally from the authoritative Smaragd branch.
2. Use the exact clean base `.gba` that the player will store locally:
   `python3 tools/make_ips32.py clean.gba Pokemon_Smaragd_Plus_Test_<commit>.gba Pokemon_Smaragd_Plus_Test_<commit>.ips32 --name "Smaragd Plus <commit>" --commit <commit> --url https://github.com/domxx1/gba-emulator/releases/download/<tag>/Pokemon_Smaragd_Plus_Test_<commit>.ips32`
3. Upload only the `.ips32` to a public GitHub release, not either ROM. Add the generated metadata JSON object to the array in `smaragd-patches.json`. Its exact base, patch, and result SHA-256 values are checked in the browser.
4. In `mobile.html`, store the matching base once, choose **GitHub-Patches anzeigen**, then **Laden und spielen**. The browser downloads the patch, reconstructs the build locally, verifies it, and retains prior builds in IndexedDB.

An in-game save is shared under the Smaragd project key and copied before installing a new patch. Save states have build fingerprints and display a warning across versions. Test a major save-format change before relying on an older in-game save. GitHub Pages cannot read releases from a private game repository without authentication; use a public patch release URL that permits browser CORS, and test that URL on Android and desktop before adding it to the catalog.
