"""Configure the unsigned simulator test app in a disposable checkout."""

import plistlib
from pathlib import Path


root = Path(__file__).resolve().parent.parent
entry = root / 'index.js'
original = entry.read_text()
gesture_handler = "import 'react-native-gesture-handler'\n"
fixture_import = "import './scripts/ios-simulator-fixture'\n"
if not original.startswith(gesture_handler) or fixture_import in original:
    raise SystemExit('Expected the unmodified TravelFit entry point.')

config = {
    'API_KEY': 'AIza' + '0' * 35,
    'BUNDLE_ID': 'com.travelfit.app',
    'DATABASE_URL': 'https://demo-travelfit-audit.firebaseio.com',
    'GCM_SENDER_ID': '100000000000',
    'GOOGLE_APP_ID': '1:100000000000:ios:0000000000000000000000',
    'IS_ANALYTICS_ENABLED': False,
    'PLIST_VERSION': '1',
    'PROJECT_ID': 'demo-travelfit-audit',
}
try:
    with (root / 'ios/GoogleService-Info.local.plist').open('xb') as file:
        plistlib.dump(config, file)
except FileExistsError:
    raise SystemExit('An iOS Firebase configuration already exists. Use a disposable checkout.') from None

entry.write_text(original.replace(gesture_handler, gesture_handler + fixture_import, 1))

info = root / 'ios/TravelFit/Info.plist'
with info.open('rb') as file:
    simulator_info = plistlib.load(file)
# The unsigned demo app uses HTTP and WebSocket Firebase emulators on loopback.
simulator_info['NSAppTransportSecurity'] = {'NSAllowsArbitraryLoads': True}
with info.open('wb') as file:
    plistlib.dump(simulator_info, file)
