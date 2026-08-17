const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");
const { join } = require("path");
const webpack = require("webpack"); // === ДОБАВИТЬ ===

class ConfigureSourceMapLoaderPlugin {
  apply(compiler) {
    for (const rule of compiler.options.module.rules) {
      if (
        typeof rule.loader === "string" &&
        rule.loader.includes("source-map-loader")
      ) {
        rule.exclude = /node_modules/;
      }
    }
  }
}

module.exports = {
  ignoreWarnings: [
    {
      module: /source-map-loader/,
      message: /Failed to parse source map/,
    },
  ],
  stats: {
    warningsFilter: (warning) => {
      return !/Failed to parse source map/.test(
        typeof warning === "string" ? warning : warning.message
      );
    }
  },

  output: {
    path: join(__dirname, "../../dist/apps/excelsior-pdf-demo"),
    clean: true
  },

  // resolve: {
  //   fallback: {
  //     "process": require.resolve("process"),
  //     "os": false,
  //     "util": require.resolve("util/"),
  //     "crypto": require.resolve("crypto-browserify"),
  //     "fs": false,
  //     "path": require.resolve("path-browserify"),
  //     "stream": require.resolve("stream-browserify"),
  //     "http": require.resolve("stream-http"),
  //     "https": require.resolve("https-browserify"),
  //     "zlib": require.resolve("browserify-zlib"),
  //     "vm": require.resolve("vm-browserify"),
  //     "assert": require.resolve("assert/"),
  //     "buffer": require.resolve("buffer/")
  //   }
  // },

  devServer: {
    port: 4200
  },

  plugins: [

    new webpack.DefinePlugin({
      global: "globalThis"
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"]
    }),

    new NxAppWebpackPlugin({
      tsConfig: "./tsconfig.app.json",
      compiler: "swc",
      main: "./src/main.ts",
      index: "./src/index.html",
      baseHref: "/",
      assets: ["./src/favicon.ico", "./src/assets"],
      styles: ["./src/styles.scss"],

      scripts: [
        "dist/libs/excelsior-data-converter/browser/excelsior-data-converter.min.js"
      ],

      stylePreprocessorOptions: {
        includePaths: [
          join(__dirname, "../../libs"),
          join(__dirname, "../../node_modules")
        ]
      },

      outputHashing: "none",
      optimization: process.env.NODE_ENV === "production",
      target: "es2020"
    }),

    new ConfigureSourceMapLoaderPlugin()
  ]


};