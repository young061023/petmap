# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Android native builds (Windows) — read this before running `expo run:android`

The project lives at `C:\Users\charm\OneDrive\바탕 화면\petmap` — the `바탕 화면` (Korean
for "Desktop") segment breaks native Android builds on Windows. CMake/Ninja/clang
use the ANSI code page for file paths, and non-ASCII characters get mangled to
`????`, so the C++ build (react-native-screens, react-native-worklets, MapLibre,
etc.) fails with errors like `ninja: error: FindFirstFileExA(...): unspecified
system_category error`. A JVM-level fix (`-Dfile.encoding=UTF-8
-Dsun.jnu.encoding=UTF-8` in `android/gradle.properties`) fixes the Gradle/Kotlin
side but not the NDK/clang/ninja side.

**Do not bother with an NTFS junction/symlink** (`mklink /J`) to an ASCII path —
already tried, doesn't work. Windows resolves reparse points transparently at the
filesystem level, so CMake/ninja still land on the real Korean path underneath.

**What works**: mirror the project to a real (non-linked) ASCII-path copy and
build from there. Editing still happens at the OneDrive path; only the native
build runs from the mirror.

```powershell
# One-time: mirror source to an ASCII path (excludes node_modules/caches —
# reinstall + rebuild those fresh at the destination)
robocopy "C:\Users\charm\OneDrive\바탕 화면\petmap" "C:\dev\petmap" /MIR `
  /XD node_modules ".git" ".gradle" ".cxx" "build" ".expo" `
  /XF "*.log"

# Re-run this robocopy line any time you've edited source files at the OneDrive
# path and need those changes reflected in the build mirror. NOTE: /XD "build"
# and ".cxx" match those directory names ANYWHERE in the tree (bare names, not
# paths) — this is intentional and required, since native build caches live in
# several places (android/build, android/app/build, android/app/.cxx,
# node_modules/<pkg>/android/.cxx, node_modules/<pkg>/android/build). Getting
# this wrong once already deleted a freshly-built android/app/.cxx via /MIR's
# purge behavior, forcing a slower rebuild next time — don't narrow these
# patterns back down to literal paths.
#
# For a pure JS/TSX-only change, this sync is all you need — Metro (already
# running from the C:\dev\petmap build) picks it up and fast-refreshes the
# app with no native rebuild required.
```

```bash
cd /c/dev/petmap && npm install   # first time only, or after package.json changes
```

Then build/run from the mirror, never from the OneDrive path:

```bash
cd /c/dev/petmap
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"   # adb isn't on PATH by default
npx expo run:android
```

**Gotcha that cost an hour of debugging**: if a build ever ran with a stale/wrong
project root (e.g. during an earlier junction-based attempt), Expo's autolinking
step bakes the *wrong absolute path* into
`android/build/generated/autolinking/autolinking.json` and
`android/app/build/generated/autolinking/...`. Once that file exists, subsequent
builds reuse it as-is and keep failing against the old path even after fixing
everything else. If native builds fail referencing a path that doesn't match
where you're building from, nuke and retry:

```bash
rm -rf /c/dev/petmap/android/build /c/dev/petmap/android/app/build /c/dev/petmap/android/.gradle
rm -rf "$USERPROFILE/.gradle/caches/build-cache-1"   # global Gradle build cache, same failure mode
```

A clean native build (all native modules compiling C++ fresh) normally takes
5–15 minutes, not longer — if it's taking much longer, a cache is almost
certainly stale; don't just wait it out, clear the caches above and retry.

Long-term real fixes (not yet done, would remove the need for the mirror step):
move the project permanently off the Korean-path OneDrive folder, or enable
Windows' "Beta: Use Unicode UTF-8 for worldwide language support" system locale
(Settings → Language & region → Administrative language settings) and reboot.
