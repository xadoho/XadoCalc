#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
T=tools
mkdir -p build/out
python3 build/gen_dex.py build/classes.dex
$T/aapt2 compile --dir app/res -o build/out/res.zip
$T/aapt2 link -o build/out/base.apk -I $T/android.jar --manifest app/AndroidManifest.xml \
  --min-sdk-version 29 --target-sdk-version 29 --version-code 1 --version-name 1.0 -A app/assets build/out/res.zip
python3 build/pack.py build/out/base.apk build/classes.dex build/out/unsigned.apk
[ -f build/release.jks ] || keytool -genkeypair -keystore build/release.jks -alias xadocalc -keyalg RSA -keysize 2048 \
  -validity 10000 -dname "CN=XadoCalc, O=XadoHot, C=RU"
jarsigner -keystore build/release.jks -sigalg SHA256withRSA -digestalg SHA-256 \
  -signedjar build/out/XadoCalc.apk build/out/unsigned.apk xadocalc
echo "Готово: build/out/XadoCalc.apk"
