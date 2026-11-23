#!/usr/bin/env python3
"""Verify TravelFit's signature, capabilities and bundled privacy manifests."""

import argparse
from pathlib import Path
import plistlib
import subprocess
import sys
from xml.parsers.expat import ExpatError

BUNDLE_ID = "com.travelfit.app"
PRIVACY_KEYS = {
    "NSPrivacyTracking": bool,
    "NSPrivacyTrackingDomains": list,
    "NSPrivacyCollectedDataTypes": list,
    "NSPrivacyAccessedAPITypes": list,
}


def app_path(target):
    if target.suffix == ".xcarchive":
        target = target / "Products" / "Applications" / "TravelFit.app"
    if target.suffix != ".app" or not target.is_dir():
        raise ValueError("Expected the signed TravelFit .app or its .xcarchive.")
    return target


def read_plist(path):
    with path.open("rb") as source:
        return plistlib.load(source)


def verify_entitlements(entitlements):
    if not isinstance(entitlements, dict):
        raise ValueError("The signature does not contain an entitlements dictionary.")
    identifier = entitlements.get("application-identifier")
    if not isinstance(identifier, str) or identifier.partition(".")[2] != BUNDLE_ID:
        raise ValueError("The signature does not contain the TravelFit application identifier.")
    for key in ("com.apple.developer.healthkit", "com.apple.developer.healthkit.background-delivery"):
        if entitlements.get(key) is not True:
            raise ValueError(f"The signature is missing the {key} entitlement.")
    apple_sign_in = entitlements.get("com.apple.developer.applesignin")
    if not isinstance(apple_sign_in, list) or "Default" not in apple_sign_in:
        raise ValueError("The signature is missing default Sign in with Apple.")


def verify_manifest(path):
    manifest = read_plist(path)
    if not isinstance(manifest, dict) or not (manifest.keys() & PRIVACY_KEYS.keys()):
        raise ValueError(f"Expected an Apple privacy manifest dictionary at {path}.")
    for key, expected_type in PRIVACY_KEYS.items():
        if key in manifest and not isinstance(manifest[key], expected_type):
            raise ValueError(f"{path}: {key} must be a {expected_type.__name__}.")


def verify_privacy(app):
    verify_manifest(app / "PrivacyInfo.xcprivacy")
    firebase_manifests = [
        manifest for manifest in app.rglob("PrivacyInfo.xcprivacy")
        if any(
            parent.name.startswith("FirebaseCoreExtension")
            and parent.suffix in {".bundle", ".framework"}
            for parent in manifest.relative_to(app).parents
        )
    ]
    if not firebase_manifests:
        raise ValueError("The application has no bundled FirebaseCoreExtension privacy manifest.")
    for manifest in firebase_manifests:
        verify_manifest(manifest)


def verify_signed_app(app):
    info = read_plist(app / "Info.plist")
    if not isinstance(info, dict) or info.get("CFBundleIdentifier") != BUNDLE_ID:
        raise ValueError("The application bundle identifier does not match TravelFit.")
    subprocess.run(["/usr/bin/codesign", "--verify", "--strict", str(app)], check=True)
    signed_entitlements = subprocess.run(
        ["/usr/bin/codesign", "--display", "--entitlements", ":-", str(app)],
        check=True,
        stdout=subprocess.PIPE,
    ).stdout
    verify_entitlements(plistlib.loads(signed_entitlements))
    verify_privacy(app)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="Path to a signed .app or .xcarchive")
    args = parser.parse_args()
    try:
        verify_signed_app(app_path(args.target))
    except (OSError, ValueError, plistlib.InvalidFileException, ExpatError, subprocess.CalledProcessError) as error:
        print(f"TravelFit release verification failed: {error}", file=sys.stderr)
        return 1
    print("TravelFit signature, signed capabilities, and app/Firebase privacy manifests verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
