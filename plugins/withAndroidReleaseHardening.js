const { withAppBuildGradle, withGradleProperties, AndroidConfig } = require('@expo/config-plugins');

// Keystore lives at <repo root>/keystores/, outside android/, so it survives
// `expo prebuild --clean` (which deletes and regenerates the whole android/ dir).
// rootProject in android/app/build.gradle points at android/, so "../keystores/..."
// resolves to <repo root>/keystores/...
const KEYSTORE_LOAD_SNIPPET = `
def keystorePropertiesFile = rootProject.file("../keystores/keystore.properties")
def keystoreProperties = new Properties()
def hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

const RELEASE_SIGNING_CONFIG_SNIPPET = `        if (hasReleaseKeystore) {
            release {
                storeFile rootProject.file("../keystores/" + keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
`;

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('hasReleaseKeystore')) {
      return config;
    }

    const androidBlockAnchor = /^android \{/m;
    if (!androidBlockAnchor.test(contents)) {
      throw new Error(
        'withAndroidReleaseHardening: could not find "android {" in android/app/build.gradle to inject release keystore loading logic. The RN/Expo build.gradle template may have changed — update this plugin.',
      );
    }
    contents = contents.replace(androidBlockAnchor, `${KEYSTORE_LOAD_SNIPPET}android {`);

    const signingConfigsAnchor = /signingConfigs \{\n/;
    if (!signingConfigsAnchor.test(contents)) {
      throw new Error(
        'withAndroidReleaseHardening: could not find "signingConfigs {" block in android/app/build.gradle. The RN/Expo build.gradle template may have changed — update this plugin.',
      );
    }
    contents = contents.replace(signingConfigsAnchor, (match) => match + RELEASE_SIGNING_CONFIG_SNIPPET);

    const releaseSigningLine = /(release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/;
    if (!releaseSigningLine.test(contents)) {
      throw new Error(
        'withAndroidReleaseHardening: could not find the release buildType\'s "signingConfig signingConfigs.debug" line in android/app/build.gradle. The RN/Expo build.gradle template may have changed — update this plugin.',
      );
    }
    contents = contents.replace(releaseSigningLine, '$1signingConfig hasReleaseKeystore ? signingConfigs.release : signingConfigs.debug');

    config.modResults.contents = contents;
    return config;
  });
}

function withReleaseMinify(config) {
  return withGradleProperties(config, (config) => {
    const key = 'android.enableMinifyInReleaseBuilds';
    const existing = config.modResults.find((item) => item.type === 'property' && item.key === key);
    if (existing) {
      existing.value = 'true';
    } else {
      config.modResults.push({ type: 'property', key, value: 'true' });
    }
    return config;
  });
}

function withRemoveSystemAlertWindow(config) {
  // SYSTEM_ALERT_WINDOW is declared by react-native's own debug-only manifest
  // (dev-mode error overlay), but Expo's permission autolinking bakes it into
  // the app's main manifest for every build type, including release, where
  // this app has no overlay feature that needs it.
  return AndroidConfig.Permissions.withBlockedPermissions(config, ['android.permission.SYSTEM_ALERT_WINDOW']);
}

module.exports = function withAndroidReleaseHardening(config) {
  config = withReleaseSigning(config);
  config = withReleaseMinify(config);
  config = withRemoveSystemAlertWindow(config);
  return config;
};
