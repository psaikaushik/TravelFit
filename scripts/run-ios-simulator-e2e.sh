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
derived_data="${TRAVELFIT_SIMULATOR_DERIVED_DATA:-$RUNNER_TEMP/travelfit-derived-data}"
app="$derived_data/Build/Products/Release-iphonesimulator/TravelFit.app"
build_settings=(
  -workspace ios/TravelFit.xcworkspace
  -scheme TravelFitSimulatorE2E
  -configuration Release
  -destination "$destination"
  -derivedDataPath "$derived_data"
  ARCHS=x86_64 ONLY_ACTIVE_ARCH=YES
)

run_simulator_test() {
  xcodebuild -quiet test-without-building "${build_settings[@]}" \
    -resultBundlePath "$1" \
    -only-testing:TravelFitUITests/TravelFitUITests/testEmulatedWalkerLifecycle \
    -parallel-testing-enabled NO -testLanguage en -testRegion US 2>&1 | tee "$2"
}

only_accessibility_startup_failed() {
  python3 - "$1" "$2" <<'PY'
import json
import subprocess
import sys

try:
    output = subprocess.check_output(
        ['xcrun', 'xcresulttool', 'get', 'test-results', 'summary', '--path', sys.argv[1]],
        stderr=subprocess.DEVNULL, timeout=30,
    )
    summary = json.loads(output)
except (OSError, subprocess.SubprocessError, ValueError):
    sys.exit(1)

failures = summary.get('testFailures', [])
sys.exit(0 if summary.get('passedTests') == 0 and len(failures) == 1
         and failures[0].get('failureText') == sys.argv[2]
         and failures[0].get('testIdentifierString', '').startswith('TravelFitUITests-Runner ')
         else 1)
PY
}

case "${1:-}" in
  build)
    xcodebuild -quiet build-for-testing "${build_settings[@]}" \
      -resultBundlePath "$RUNNER_TEMP/travelfit-ios-build.xcresult"
    python3 - "$app" "$derived_data/Build/Intermediates.noindex" <<'PY'
from pathlib import Path
import plistlib
import sys

app = Path(sys.argv[1])
with (app / 'Info.plist').open('rb') as source:
    info = plistlib.load(source)
with (app / 'GoogleService-Info.plist').open('rb') as source:
    firebase = plistlib.load(source)
if (info.get('CFBundleSupportedPlatforms') != ['iPhoneSimulator']
        or info.get('CFBundleIdentifier') != 'com.travelfit.app'
        or firebase.get('PROJECT_ID') != 'demo-travelfit-audit'
        or firebase.get('API_KEY') != 'AIza' + '0' * 35):
    sys.exit('The simulator build must be an isolated TravelFit demo app.')

identifier = 'TRAVELFIT0.com.travelfit.app'
for path in Path(sys.argv[2]).rglob('TravelFit.app-Simulated.xcent'):
    with path.open('rb') as file:
        entitlements = plistlib.load(file)
    if (entitlements.get('application-identifier') == identifier
            and identifier in entitlements.get('keychain-access-groups', [])):
        break
else:
    sys.exit('Xcode did not build the demo keychain identity into the simulator app.')
PY
    /usr/bin/codesign --verify --strict "$app"
    xcrun otool -l "$app/TravelFit" | grep -F 'sectname __entitlements' >/dev/null
    ;;
  boot)
    xcrun simctl bootstatus "$simulator" -b
    ;;
  test)
    node scripts/verify-firebase.cjs simulator-ready
    result="$RUNNER_TEMP/travelfit-ios.xcresult"
    first_result="$RUNNER_TEMP/travelfit-ios-first-attempt.xcresult"
    first_log="$RUNNER_TEMP/travelfit-ios-first-attempt.log"
    startup_failure='The test runner failed to initialize for UI testing. (Underlying Error: Timed out waiting for AX loaded notification)'
    status=0
    run_simulator_test "$result" "$first_log" || status=$?
    if (( status != 0 )) && [[ -d "$result" && ! -e "$first_result" ]] &&
      grep -Fq "$startup_failure" "$first_log" && only_accessibility_startup_failed "$result" "$startup_failure"; then
      echo 'XCTest could not initialize accessibility. Restarting the selected simulator for one retry.'
      if xcrun simctl shutdown "$simulator" && xcrun simctl bootstatus "$simulator" -b &&
        mv "$result" "$first_result"; then
        status=0
        run_simulator_test "$result" "$RUNNER_TEMP/travelfit-ios-retry.log" || status=$?
      fi
    fi
    if (( status != 0 )); then
      python3 - "$simulator" <<'PY' || true
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

try:
    data = subprocess.check_output(
        ['xcrun', 'simctl', 'get_app_container', sys.argv[1], 'com.travelfit.app', 'data'],
        stderr=subprocess.DEVNULL, text=True, timeout=10,
    ).strip()
    directory = Path(data) / 'Library/Application Support/com.travelfit.app/RCTAsyncLocalStorage_V1'
    manifest = json.loads((directory / 'manifest.json').read_text())
    settings_count = route_count = 0
    for key, value in manifest.items():
        if not key.startswith('travelfit:account:') or not key.endswith(':user_settings'):
            continue
        if value is None:
            filename = hashlib.md5(key.encode(), usedforsecurity=False).hexdigest()
            value = (directory / filename).read_text()
        settings = json.loads(value)
        settings_count += 1
        route_count += bool(settings.get('curatedRouteId') and settings.get('tripId'))
    print(f'Simulator saved settings for {settings_count} accounts and {route_count} active routes.')
except (OSError, subprocess.SubprocessError, ValueError, TypeError, AttributeError):
    print('Simulator saved route counts unavailable.')

counts = dict.fromkeys(('-1022', '-1001', '-1004', '-1009', '-1200'), 0)
keychain_errors = 0
error_code = re.compile(r'\bNSURLErrorDomain\b\s*(?:Code\s*=\s*|[:(,]\s*)?(-\d+)\b')
try:
    result = subprocess.run(
        ['xcrun', 'simctl', 'spawn', sys.argv[1], 'log', 'show', '--last', '15m',
         '--style', 'ndjson', '--predicate',
         'process == "TravelFit" AND (eventMessage CONTAINS "NSURLErrorDomain" OR eventMessage CONTAINS "-34018")'],
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
    message = event['eventMessage']
    if 'SecItem' in message and '-34018' in message:
        keychain_errors += 1
    for code in set(error_code.findall(message)) & counts.keys():
        counts[code] += 1

print('Native TravelFit URL error counts (last 15 minutes): ' +
      ', '.join(f'{code}={count}' for code, count in counts.items()))
print(f'Native TravelFit keychain entitlement errors: {keychain_errors}')
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
