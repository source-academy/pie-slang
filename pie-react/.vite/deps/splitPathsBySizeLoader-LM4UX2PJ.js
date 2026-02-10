import {
  IconSize,
  pascalCase
} from "./chunk-QBI6Y6X7.js";
import "./chunk-DC5AMYBS.js";

// node_modules/@blueprintjs/icons/lib/esm/paths-loaders/splitPathsBySizeLoader.js
var splitPathsBySizeLoader = async (name, size) => {
  const key = pascalCase(name);
  let pathsRecord;
  if (size === IconSize.STANDARD) {
    pathsRecord = await import(
      /* webpackChunkName: "blueprint-icons-16px-paths" */
      "./paths-H6AGMBAT.js"
    );
  } else {
    pathsRecord = await import(
      /* webpackChunkName: "blueprint-icons-20px-paths" */
      "./paths-5RJJ5UXH.js"
    );
  }
  return pathsRecord[key];
};
export {
  splitPathsBySizeLoader
};
//# sourceMappingURL=splitPathsBySizeLoader-LM4UX2PJ.js.map
