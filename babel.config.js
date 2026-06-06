module.exports = function babelConfig(api) {
  const isTest = api.env("test");

  return {
    presets: ["babel-preset-expo"],
    plugins: isTest ? [] : ["react-native-worklets/plugin"],
  };
};
