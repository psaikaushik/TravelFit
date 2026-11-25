#!/usr/bin/env bash
set -euo pipefail

simulator_file="$RUNNER_TEMP/travelfit-simulator"
if [[ -s "$simulator_file" ]]; then
  read -r simulator < "$simulator_file"
else
  simulator=$(xcrun simctl list devices available --json | python3 -c '
import json, sys

runtimes = json.load(sys.stdin)["devices"]
candidates = [key for key in runtimes if ".iOS-26-" in key or key.endswith(".iOS-26")]
for runtime in sorted(candidates, key=lambda key: tuple(map(int, key.split("iOS-")[1].split("-"))), reverse=True):
    for device in runtimes[runtime]:
        if device["name"].startswith("iPhone"):
            print(device["udid"])
            sys.exit()
sys.exit("No available iPhone simulator with an iOS 26 runtime")
')
  printf '%s\n' "$simulator" > "$simulator_file"
fi

# Match the Intel simulator host and the architecture of the installed pods.
destination="platform=iOS Simulator,id=$simulator"
if [[ "${TRAVELFIT_SIMULATOR_ROSETTA:-0}" = 1 ]]; then
  destination="$destination,arch=x86_64"
fi
build_settings=(
  -workspace ios/TravelFit.xcworkspace
  -scheme TravelFitSimulatorE2E
  -configuration Release
  -destination "$destination"
  -derivedDataPath "${TRAVELFIT_SIMULATOR_DERIVED_DATA:-$RUNNER_TEMP/travelfit-derived-data}"
  ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
)

case "${1:-}" in
  build)
    xcodebuild -quiet build-for-testing "${build_settings[@]}" \
      -resultBundlePath "$RUNNER_TEMP/travelfit-ios-build.xcresult"
    ;;
  boot)
    xcrun simctl bootstatus "$simulator" -b
    ;;
  test)
    node scripts/verify-firebase.cjs simulator-ready
    status=0
    xcodebuild -quiet test-without-building "${build_settings[@]}" \
      -resultBundlePath "$RUNNER_TEMP/travelfit-ios.xcresult" \
      -only-testing:TravelFitUITests/TravelFitUITests/testEmulatedWalkerLifecycle \
      -parallel-testing-enabled NO -testLanguage en -testRegion US || status=$?
    if (( status != 0 )); then
      python3 - "$simulator" <<'PY' || true
import json
import re
import subprocess
import sys

counts = dict.fromkeys(('-1022', '-1001', '-1004', '-1009', '-1200'), 0)
error_code = re.compile(r'\bNSURLErrorDomain\b\s*(?:Code\s*=\s*|[:(,]\s*)?(-\d+)\b')
try:
    result = subprocess.run(
        ['xcrun', 'simctl', 'spawn', sys.argv[1], 'log', 'show', '--last', '15m',
         '--style', 'ndjson', '--predicate',
         'process == "TravelFit" AND eventMessage CONTAINS "NSURLErrorDomain"'],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        text=True, errors='replace', timeout=20, check=True,
    )
except (OSError, subprocess.SubprocessError):
    print('Native TravelFit URL error counts unavailable.')
    sys.exit(0)

for line in result.stdout.splitlines():
    try:
        event = json.loads(line)
    except json.JSONDecodeError:
        continue
    if not isinstance(event, dict) or not isinstance(event.get('eventMessage'), str):
        continue
    for code in set(error_code.findall(event['eventMessage'])) & counts.keys():
        counts[code] += 1

print('Native TravelFit URL error counts (last 15 minutes): ' +
      ', '.join(f'{code}={count}' for code, count in counts.items()))
PY
      node scripts/verify-firebase.cjs simulator-report || true
    fi
    exit "$status"
    ;;
  *)
    echo "Usage: bash scripts/run-ios-simulator-e2e.sh build|boot|test" >&2
    exit 2
    ;;
esac
