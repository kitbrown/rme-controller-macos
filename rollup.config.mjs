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
    resolve({ preferBuiltins: true }),
    typescript({ tsconfig: "./tsconfig.json" })
  ],
  external: [/^node:/]
};
