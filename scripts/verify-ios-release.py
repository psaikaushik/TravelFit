#!/usr/bin/env python3
"""Verify a staging Firebase plist or a signed TravelFit beta build."""

import argparse
from pathlib import Path
import plistlib
import re
import subprocess
import sys
from urllib.parse import urlsplit
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


def verify_staging_config(path, expected_project):
    if (
        not re.fullmatch(r"[a-z][a-z0-9-]{4,28}[a-z0-9]", expected_project)
        or expected_project == "travelfit-app"
        or expected_project.startswith("demo-")
    ):
        raise ValueError("Specify the authorized non-production Firebase staging project.")

    config = read_plist(path)
    if (
        not isinstance(config, dict)
        or config.get("PROJECT_ID") != expected_project
        or config.get("BUNDLE_ID") != BUNDLE_ID
        or config.get("PLIST_VERSION") != "1"
    ):
        raise ValueError("Use the downloaded Firebase iOS plist for the authorized staging project.")

    api_key = config.get("API_KEY")
    app_id = config.get("GOOGLE_APP_ID")
    if (
        not isinstance(api_key, str)
        or not re.fullmatch(r"AIza[\w-]{35}", api_key, flags=re.ASCII)
        or api_key == "AIza" + "0" * 35
        or not isinstance(app_id, str)
        or not re.fullmatch(r"1:[0-9]+:ios:[a-f0-9]+", app_id)
    ):
        raise ValueError("The Firebase iOS plist must include the app registration and API key.")

    database_url = config.get("DATABASE_URL")
    if not isinstance(database_url, str):
        raise ValueError("The Firebase iOS plist is missing the default Realtime Database URL.")
    try:
        url = urlsplit(database_url)
        host = url.hostname or ""
    except ValueError:
        raise ValueError("Use the HTTPS default Realtime Database URL for the staging project.") from None
    default_db = re.escape(expected_project + "-default-rtdb")
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
        raise ValueError("Use the HTTPS default Realtime Database URL for the staging project.")


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


def verify_signed_app(app, staging_project):
    info = read_plist(app / "Info.plist")
    if not isinstance(info, dict) or info.get("CFBundleIdentifier") != BUNDLE_ID:
        raise ValueError("The application bundle identifier does not match TravelFit.")
    subprocess.run(["/usr/bin/codesign", "--verify", "--strict", str(app)], check=True)
    signed_entitlements = subprocess.run(
        ["/usr/bin/codesign", "--display", "--entitlements", "-", "--xml", str(app)],
        check=True,
        stdout=subprocess.PIPE,
    ).stdout
    verify_entitlements(plistlib.loads(signed_entitlements))
    verify_privacy(app)
    verify_staging_config(app / "GoogleService-Info.plist", staging_project)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staging-project", required=True, help="Authorized Firebase staging project ID")
    artifact = parser.add_mutually_exclusive_group(required=True)
    artifact.add_argument("--firebase-config", type=Path, help="Path to a pre-build Firebase plist")
    artifact.add_argument("target", nargs="?", type=Path, help="Path to a signed .app or .xcarchive")
    args = parser.parse_args()
    try:
        if args.firebase_config:
            verify_staging_config(args.firebase_config, args.staging_project)
            print("TravelFit Firebase staging configuration verified.")
        else:
            verify_signed_app(app_path(args.target), args.staging_project)
            print("TravelFit signature, capabilities, privacy manifests, and bundled staging configuration verified.")
    except (OSError, ValueError, plistlib.InvalidFileException, ExpatError, subprocess.CalledProcessError) as error:
        print(f"TravelFit release verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
