const { withGradleProperties } = require('@expo/config-plugins');

// This project's OneDrive path contains a non-ASCII (Korean) folder segment.
// `expo prebuild --clean` regenerates android/gradle.properties from scratch,
// which drops these two settings if they aren't reapplied by a plugin — see
// AGENTS.md for the full story on why both are required on Windows.
function upsertProperty(modResults, key, value) {
  const existing = modResults.find((item) => item.type === 'property' && item.key === key);
  if (existing) {
    existing.value = value;
  } else {
    modResults.push({ type: 'property', key, value });
  }
}

module.exports = function withKoreanPathBuildFix(config) {
  return withGradleProperties(config, (config) => {
    // AGP's own path check refuses to build from a non-ASCII path.
    upsertProperty(config.modResults, 'android.overridePathCheck', 'true');

    // CMake/Ninja/clang (native module builds) additionally need the JVM's
    // own file-encoding args set to UTF-8, or file paths get mangled to
    // "????" on the Gradle/Kotlin side.
    const jvmArgsKey = 'org.gradle.jvmargs';
    const existingJvmArgs = config.modResults.find((item) => item.type === 'property' && item.key === jvmArgsKey);
    const encodingFlags = '-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8';
    if (existingJvmArgs) {
      if (!existingJvmArgs.value.includes('-Dfile.encoding')) {
        existingJvmArgs.value = `${existingJvmArgs.value} ${encodingFlags}`;
      }
    } else {
      config.modResults.push({ type: 'property', key: jvmArgsKey, value: `-Xmx2048m -XX:MaxMetaspaceSize=512m ${encodingFlags}` });
    }

    return config;
  });
};
