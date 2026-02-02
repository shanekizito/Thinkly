const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withReactNativeIAPFlavor(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const gradleContent = config.modResults.contents;
      
      // Check if flavorDimensions already exists
      if (!gradleContent.includes('flavorDimensions')) {
        // Find the android { block and insert after defaultConfig
        const defaultConfigRegex = /(defaultConfig\s*\{[^}]*\})/s;
        
        if (defaultConfigRegex.test(gradleContent)) {
          config.modResults.contents = gradleContent.replace(
            defaultConfigRegex,
            `$1
    flavorDimensions "store"
    productFlavors {
        play {
            dimension "store"
        }
    }`
          );
        }
      }
    }
    
    return config;
  });
};

