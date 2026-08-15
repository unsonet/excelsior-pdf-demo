const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");
const { join } = require("path");

module.exports = {
  output: {
    path: join(__dirname, "../../dist/apps/excelsior-pdf-demo"),
    clean: true
  },
  devServer: {
    port: 4200
  },
  plugins: [
    new NxAppWebpackPlugin({
      tsConfig: "./tsconfig.app.json",
      compiler: "swc",
      main: "./src/main.ts",
      index: "./src/index.html",
      baseHref: "/",
      assets: ["./src/favicon.ico", "./src/assets"],
      styles: ["./src/styles.scss"],
      outputHashing: "none",//process.env.NODE_ENV === "production" ? "all" : "none",
      optimization: process.env.NODE_ENV === "production",
      target:"es2020"
    })
  ]
};