#!/bin/bash

APP_NAME="MacDeathMonitor"
APP_DIR="${APP_NAME}.app"
CONTENTS_DIR="${APP_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"

echo "🧹 Cleaning old builds..."
rm -rf "$APP_DIR"

echo "🏗️ Creating App Bundle Structure..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

echo "📝 Creating Info.plist..."
cat <<EOF > "${CONTENTS_DIR}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>com.aisfarhan.MacDeathMonitor</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo "🔨 Compiling Swift code..."
# Use -parse-as-library so @main works and force target to macOS 14 to avoid Developer Beta 27 launch issues
swiftc MacDeathMonitor.swift -parse-as-library -target arm64-apple-macosx14.0 -o "${MACOS_DIR}/${APP_NAME}"

if [ $? -eq 0 ]; then
    echo "APPL????" > "${CONTENTS_DIR}/PkgInfo"
    codesign --force --deep --sign - "$APP_DIR"
    echo "✅ Build successful! MacDeathMonitor.app is ready."
else
    echo "❌ Build failed!"
    exit 1
fi
