#!/bin/sh
set -eu

source_plist="$SRCROOT/GoogleService-Info.local.plist"
destination="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/GoogleService-Info.plist"

if [ ! -f "$source_plist" ]; then
  echo "error: Save the Firebase staging iOS config as ios/GoogleService-Info.local.plist."
  exit 1
fi

/usr/bin/plutil -lint "$source_plist"
project_id=$(/usr/libexec/PlistBuddy -c 'Print :PROJECT_ID' "$source_plist")
bundle_id=$(/usr/libexec/PlistBuddy -c 'Print :BUNDLE_ID' "$source_plist")
if [ -z "$project_id" ] || [ "$project_id" = "travelfit-app" ]; then
  echo "error: Use a separate Firebase staging project for this build."
  exit 1
fi
if [ "$bundle_id" != "$PRODUCT_BUNDLE_IDENTIFIER" ]; then
  echo "error: Firebase iOS app bundle ID must match $PRODUCT_BUNDLE_IDENTIFIER."
  exit 1
fi
if ! /usr/libexec/PlistBuddy -c 'Print :DATABASE_URL' "$source_plist" >/dev/null; then
  echo "error: Enable Realtime Database in staging and download the updated iOS config."
  exit 1
fi

mkdir -p "$(dirname "$destination")"
cp "$source_plist" "$destination"
