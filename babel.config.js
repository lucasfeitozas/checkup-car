module.exports = function babelConfig(api) {
  const isTest = api.env("test");

  return {
    presets: [
      // O NativeWind v4 exige que ele seja injetado aqui dentro do preset do Expo
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    // Removido o "nativewind/babel" daqui. Mantido apenas o worklets (se não for ambiente de teste)
    plugins: isTest ? [] : ["react-native-worklets/plugin"],
  };
};
