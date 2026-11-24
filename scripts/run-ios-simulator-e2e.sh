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
build_settings=(
  -workspace ios/TravelFit.xcworkspace
  -scheme TravelFitSimulatorE2E
  -configuration Release
  -destination "platform=iOS Simulator,id=$simulator"
  -derivedDataPath "$RUNNER_TEMP/travelfit-derived-data"
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
      node scripts/verify-firebase.cjs simulator-report || true
    fi
    exit "$status"
    ;;
  *)
    echo "Usage: bash scripts/run-ios-simulator-e2e.sh build|boot|test" >&2
    exit 2
    ;;
esac
