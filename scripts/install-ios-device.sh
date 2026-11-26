#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "$(uname -s)" != Darwin ]]; then
  echo "Run this from the TravelFit checkout on the Mac connected to the test iPhone." >&2
  exit 1
fi

if [[ "$#" != 1 ]]; then
  echo "Usage: bash scripts/install-ios-device.sh DEVICE_UDID" >&2
  xcodebuild -workspace ios/TravelFit.xcworkspace -scheme TravelFit -showdestinations
  exit 1
fi

if [[ ! -f ios/GoogleService-Info.local.plist ]]; then
  echo "Save the separate Firebase staging iOS config as ios/GoogleService-Info.local.plist." >&2
  exit 1
fi

device="$1"
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-device.XXXXXX")
echo "Release build output: $build_dir"

npm ci
bundle check || bundle install
(cd ios && bundle exec pod install --deployment)

xcodebuild build \
  -workspace ios/TravelFit.xcworkspace \
  -scheme TravelFit \
  -configuration Release \
  -destination "platform=iOS,id=$device" \
  -derivedDataPath "$build_dir"

app="$build_dir/Build/Products/Release-iphoneos/TravelFit.app"
test -d "$app"
xcrun devicectl device install app --device "$device" "$app"
xcrun devicectl device process launch --device "$device" com.travelfit.app
