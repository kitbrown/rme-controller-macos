import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/index.ts",
  output: {
    file: "com.chris.rme-globalosc.sdPlugin/bin/plugin.js",
    format: "esm",
    sourcemap: true
  },
  plugins: [
    typescript({ tsconfig: "./tsconfig.json" }),
    resolve({ browser: false, exportConditions: ["node"], preferBuiltins: true }),
    commonjs()
  ],
  external: [/^node:/]
};
