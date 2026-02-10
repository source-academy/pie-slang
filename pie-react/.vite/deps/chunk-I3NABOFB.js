import {
  paths_exports
} from "./chunk-KMDP5OJR.js";
import {
  paths_exports as paths_exports2
} from "./chunk-L22N6EOR.js";
import {
  IconSize,
  pascalCase
} from "./chunk-QBI6Y6X7.js";

// node_modules/@blueprintjs/icons/lib/esm/allPaths.js
function getIconPaths(name, size) {
  const key = pascalCase(name);
  return size === IconSize.STANDARD ? paths_exports[key] : paths_exports2[key];
}
function iconNameToPathsRecordKey(name) {
  return pascalCase(name);
}

export {
  getIconPaths,
  iconNameToPathsRecordKey
};
//# sourceMappingURL=chunk-I3NABOFB.js.map
