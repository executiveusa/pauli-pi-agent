import { TOOL_REGISTRY } from "../tools/registry.js";
export class SuperpowersBridge { private registry = TOOL_REGISTRY; getToolsForIDE(_ide: string) { return this.registry.youtube_kg.tools; } }
export default SuperpowersBridge;
