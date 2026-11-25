#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 1 || ! "$1" =~ ^[1-9][0-9]*$ ]]; then
  echo 'Usage: TRAVELFIT_STAGING_PROJECT_ID=PROJECT bash scripts/archive-ios-beta.sh BUILD_NUMBER' >&2
  exit 2
fi
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Archive this build on a Mac with Xcode 26 and Apple distribution signing configured.' >&2
  exit 1
fi

: "${TRAVELFIT_STAGING_PROJECT_ID:?Set the authorized Firebase staging project ID.}"
repository=$(cd "$(dirname "$0")/.." && pwd -P)
config="$repository/ios/GoogleService-Info.local.plist"
python3 "$repository/scripts/verify-ios-release.py" \
  --staging-project "$TRAVELFIT_STAGING_PROJECT_ID" --firebase-config "$config"

build_number="$1"
revision=$(git -C "$repository" rev-parse HEAD)
results=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-ios-beta.XXXXXX")
work=$(mktemp -d "${TMPDIR:-/tmp}/travelfit-archive-work.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir "$work/checkout"
git -C "$repository" archive "$revision" | tar -x -C "$work/checkout"
cd "$work/checkout"
if grep -q 'ios-simulator-fixture' index.js; then
  echo 'The committed build must use the normal signed-app entry point.' >&2
  exit 1
fi
cp "$config" ios/GoogleService-Info.local.plist

echo "TravelFit source commit: $revision"
echo "Archive, IPA, and logs: $results"
export BUNDLE_PATH="${BUNDLE_PATH:-$work/bundle}"
export RCT_NO_LAUNCH_PACKAGER=1
npm ci --engine-strict
bundle check || bundle install
(cd ios && bundle exec pod install --deployment)

archive="$results/TravelFit.xcarchive"
xcodebuild archive \
  -workspace ios/TravelFit.xcworkspace \
  -scheme TravelFit \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$work/derived" \
  -archivePath "$archive" \
  CURRENT_PROJECT_VERSION="$build_number" | tee "$results/archive.log"
python3 scripts/verify-ios-release.py --staging-project "$TRAVELFIT_STAGING_PROJECT_ID" "$archive"

python3 - "$work/export-options.plist" <<'PY'
import plistlib
import sys

with open(sys.argv[1], 'wb') as file:
    plistlib.dump({
        'method': 'app-store-connect',
        'destination': 'export',
        'manageAppVersionAndBuildNumber': False,
    }, file)
PY

xcodebuild -exportArchive \
  -archivePath "$archive" \
  -exportOptionsPlist "$work/export-options.plist" \
  -exportPath "$results/export" | tee "$results/export.log"
ipa="$results/export/TravelFit.ipa"
unzip -q "$ipa" 'Payload/TravelFit.app/*' -d "$work/export-check"
exported_app="$work/export-check/Payload/TravelFit.app"
python3 scripts/verify-ios-release.py --staging-project "$TRAVELFIT_STAGING_PROJECT_ID" \
  "$exported_app"
python3 - "$archive/Products/Applications/TravelFit.app" "$exported_app" "$build_number" <<'PY'
from pathlib import Path
import plistlib
import sys

archive_app, exported_app, build_number = sys.argv[1:]
with (Path(archive_app) / 'Info.plist').open('rb') as source:
    archived = plistlib.load(source)
with (Path(exported_app) / 'Info.plist').open('rb') as source:
    exported = plistlib.load(source)
if archived.get('CFBundleVersion') != build_number or exported.get('CFBundleVersion') != build_number:
    sys.exit('The archive and IPA must both contain the requested build number.')
if not archived.get('CFBundleShortVersionString') or exported.get('CFBundleShortVersionString') != archived['CFBundleShortVersionString']:
    sys.exit('The IPA version must match the archive version.')
PY
echo "Verified TestFlight export: $ipa"
