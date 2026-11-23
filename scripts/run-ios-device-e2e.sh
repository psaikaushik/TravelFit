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

python3 - "$build_config" "$TRAVELFIT_STAGING_PROJECT_ID" <<'PY'
import plistlib
import re
import sys
from urllib.parse import urlsplit

config_file, expected_project = sys.argv[1:]
with open(config_file, "rb") as source:
    config = plistlib.load(source)
if (
    not re.fullmatch(r"[a-z][a-z0-9-]{4,28}[a-z0-9]", expected_project)
    or expected_project == "travelfit-app"
    or expected_project.startswith("demo-")
    or config.get("PROJECT_ID") != expected_project
    or config.get("BUNDLE_ID") != "com.travelfit.app"
):
    sys.exit("The plist must match the authorized staging project and the TravelFit app ID.")

url = urlsplit(config.get("DATABASE_URL", ""))
default_db = re.escape(expected_project + "-default-rtdb")
host = url.hostname or ""
matches_project = host in {
    f"{expected_project}.firebaseio.com",
    f"{expected_project}-default-rtdb.firebaseio.com",
} or re.fullmatch(rf"{default_db}\.[a-z0-9-]+\.firebasedatabase\.app", host)
if (
    not matches_project
    or url.scheme != "https"
    or url.netloc != host
    or url.path not in {"", "/"}
    or url.query
    or url.fragment
):
    sys.exit("Use the HTTPS default Realtime Database URL for the authorized staging project.")
PY

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
/usr/bin/codesign --verify --strict "$app"

xcodebuild test-without-building "${build_arguments[@]}" \
  -only-testing:TravelFitUITests/TravelFitUITests/testSignedDeviceWalkerLifecycle \
  -parallel-testing-enabled NO \
  -testLanguage en -testRegion US \
  -resultBundlePath "$results/TravelFitDeviceE2E.xcresult" \
  | tee "$results/test.log"
