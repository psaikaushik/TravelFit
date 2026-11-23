#!/usr/bin/env bash
set -euo pipefail

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

xcodebuild test \
  -workspace ios/TravelFit.xcworkspace \
  -scheme TravelFitSimulatorE2E \
  -configuration Release \
  -destination "platform=iOS Simulator,id=$simulator" \
  -derivedDataPath "$RUNNER_TEMP/travelfit-derived-data" \
  -resultBundlePath "$RUNNER_TEMP/travelfit-ios.xcresult" \
  -only-testing:TravelFitUITests/TravelFitUITests/testEmulatedWalkerLifecycle \
  -parallel-testing-enabled NO \
  -testLanguage en -testRegion US \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO
