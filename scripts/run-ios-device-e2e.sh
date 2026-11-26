#!/usr/bin/env bash
set -euo pipefail

repository=$(cd "$(dirname "$0")/.." && pwd -P)

if [[ $# != 1 ]]; then
  echo "Usage: TRAVELFIT_STAGING_PROJECT_ID=<authorized-project-id> bash scripts/run-ios-device-e2e.sh DEVICE_UDID" >&2
  exit 2
fi
if [[ "$(uname -s)" != Darwin ]]; then
  echo "Run this on the Mac paired with the dedicated test iPhone." >&2
  exit 1
fi

device="$1"
if [[ ! "$device" =~ ^([[:xdigit:]]{8}-[[:xdigit:]]{16}|[[:xdigit:]]{40})$ ]]; then
  echo "Use the physical iPhone UDID reported by Xcode." >&2
  exit 2
fi

: "${TRAVELFIT_STAGING_PROJECT_ID:?Set the authorized Firebase staging project ID.}"
config="$repository/ios/GoogleService-Info.local.plist"
if [[ ! -f "$config" ]]; then
  echo "Save the staging iOS configuration as ios/GoogleService-Info.local.plist." >&2
  exit 1
fi

revision=$(git -C "$repository" rev-parse HEAD)
results=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-device-results.XXXXXX")
work=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-device-work.XXXXXX")
trap 'rm -rf "$work"' EXIT
build_source="$work/checkout"
mkdir "$build_source"
git -C "$repository" archive "$revision" | tar -x -C "$build_source"
if grep -q 'ios-simulator-fixture' "$build_source/index.js"; then
  echo "The committed build must use the normal signed-app entry point." >&2
  exit 1
fi
build_config="$build_source/ios/GoogleService-Info.local.plist"
cp "$config" "$build_config"

python3 "$build_source/scripts/verify-ios-release.py" \
  --staging-project "$TRAVELFIT_STAGING_PROJECT_ID" --firebase-config "$build_config"

echo "TravelFit source commit: $revision"
echo "XCTest logs and result: $results"
cd "$build_source"
export BUNDLE_PATH="${BUNDLE_PATH:-$repository/vendor/bundle}"
export RCT_NO_LAUNCH_PACKAGER=1
npm ci
bundle check || bundle install
(cd ios && bundle exec pod install --deployment)
bundle exec ruby scripts/configure-ios-ui-tests.rb

build_arguments=(
  -workspace ios/TravelFit.xcworkspace
  -scheme TravelFitDeviceE2E
  -configuration Release
  -destination "platform=iOS,id=$device"
  -derivedDataPath "$work/derived"
)

xcodebuild build-for-testing "${build_arguments[@]}" | tee "$results/build.log"

app="$work/derived/Build/Products/Release-iphoneos/TravelFit.app"
if ! cmp -s "$build_config" "$app/GoogleService-Info.plist"; then
  echo "The built application does not contain the verified staging configuration." >&2
  exit 1
fi
python3 scripts/verify-ios-release.py --staging-project "$TRAVELFIT_STAGING_PROJECT_ID" "$app"

xcodebuild test-without-building "${build_arguments[@]}" \
  -only-testing:TravelFitUITests/TravelFitUITests/testSignedDeviceWalkerLifecycle \
  -parallel-testing-enabled NO \
  -testLanguage en -testRegion US \
  -resultBundlePath "$results/TravelFitDeviceE2E.xcresult" \
  | tee "$results/test.log"
