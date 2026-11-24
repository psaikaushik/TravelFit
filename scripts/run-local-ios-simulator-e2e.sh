#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Run this on a Mac with Xcode 26 and an iOS 26 simulator runtime.' >&2
  exit 1
fi

repository=$(cd "$(dirname "$0")/.." && pwd -P)
for tool in xcodebuild xcrun node npm bundle python3 java; do
  command -v "$tool" >/dev/null || { echo "Missing $tool on this Mac." >&2; exit 1; }
done
if ! xcodebuild -version | awk '$1 == "Xcode" {ok = ($2 + 0 >= 26)} END {exit !ok}'; then
  echo 'Select Xcode 26 or later before running the simulator check.' >&2
  exit 1
fi

runtime=$(xcrun simctl list runtimes --json | python3 -c '
import json, sys

runtimes = [runtime for runtime in json.load(sys.stdin)["runtimes"]
            if runtime["isAvailable"] and ".iOS-" in runtime["identifier"]
            and runtime["version"].split(".")[0] == "26"]
if not runtimes:
    sys.exit("Install an iOS 26 simulator runtime in Xcode.")
print(max(runtimes, key=lambda runtime: tuple(map(int, runtime["version"].split("."))))["identifier"])
')

revision=$(git -C "$repository" rev-parse HEAD)
results=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-simulator-results.XXXXXX")
work=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-simulator-work.XXXXXX")
simulator=''
cleanup() {
  if [[ -n "$simulator" ]]; then
    xcrun simctl shutdown "$simulator" >/dev/null 2>&1 || true
    xcrun simctl delete "$simulator" >/dev/null 2>&1 || true
  fi
  rm -rf "$work"
}
trap cleanup EXIT

echo "TravelFit source commit: $revision"
echo "XCTest logs and results: $results"
mkdir "$work/checkout"
git -C "$repository" archive "$revision" | tar -x -C "$work/checkout"
cd "$work/checkout"
export BUNDLE_PATH="${BUNDLE_PATH:-$work/bundle}"
export RUNNER_TEMP="$results"
export TRAVELFIT_SIMULATOR_DERIVED_DATA="$work/derived"
export RCT_NO_LAUNCH_PACKAGER=1 FUNCTIONS_DISCOVERY_TIMEOUT=60
export TRAVELFIT_SIMULATOR_ROSETTA=0

python3 scripts/configure-ios-simulator-fixtures.py
npm ci --engine-strict
npm ci --prefix functions --engine-strict
bundle check || bundle install
(cd ios && bundle exec pod install --deployment)
bundle exec ruby scripts/configure-ios-ui-tests.rb

simulator=$(xcrun simctl create 'TravelFit QA' com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro "$runtime")
printf '%s\n' "$simulator" > "$results/travelfit-simulator"
if [[ "$(sysctl -n hw.optional.arm64 2>/dev/null || true)" = 1 ]]; then
  xcodebuild -workspace ios/TravelFit.xcworkspace -scheme TravelFitSimulatorE2E \
    -showdestinations > "$results/destinations.log" 2>&1
  if ! awk -v id="$simulator" 'index($0, id) && /arch:[ ]*x86_64/ { found = 1 } END { exit !found }' \
    "$results/destinations.log"; then
    echo 'Xcode must list an x86_64 Rosetta destination for the iOS 26 simulator.' >&2
    exit 1
  fi
  export TRAVELFIT_SIMULATOR_ROSETTA=1
fi

bash scripts/run-ios-simulator-e2e.sh build 2>&1 | tee "$results/build.log"
bash scripts/run-ios-simulator-e2e.sh boot 2>&1 | tee "$results/boot.log"
status=0
npx --yes firebase-tools@15.37.0 emulators:exec \
  --project demo-travelfit-audit --only auth,database,functions \
  'bash scripts/run-ios-simulator-e2e.sh test' 2>&1 | tee "$results/test.log" || status=$?
if [[ -d "$results/travelfit-ios.xcresult" ]]; then
  xcrun xcresulttool get test-results summary --path "$results/travelfit-ios.xcresult" || true
  xcrun xcresulttool export attachments --path "$results/travelfit-ios.xcresult" \
    --output-path "$results/attachments" || true
fi
exit "$status"
