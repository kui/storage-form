const envOptions = {
  targets: {
    // See http://caniuse.com/usage-table
    chrome: "79",
    firefox: "70",
    safari: "13",
    edge: "18",
    ios: "12",
  },
  useBuiltIns: "usage",
  corejs: 3,
};

module.exports = {
  presets: [
    [
      "@babel/preset-env",
      envOptions,
    ],
  ],
  env: {
    production: {
      presets: [
        [
          "@babel/preset-env",
          Object.assign(envOptions, { loose: true }),
        ],
      ],
      plugins: [
        "unassert",
        ["strip-function-call", {
          strip: [ "console.debug" ]
        }],
      ],
    },
  },
};
