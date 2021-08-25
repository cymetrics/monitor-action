import { readFileSync } from "fs";

export const importCss = () => `${readFileSync(
  `${process.env.DEPS_DIR || ""}/node_modules/tailwindcss/dist/tailwind.min.css`
).toString()}
${readFileSync(
  `${process.env.DEPS_DIR || ""}/node_modules/react-vis/dist/style.css`
).toString()}`;
