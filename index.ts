// index.ts の新しい内容
export {
  analyzeActionDependencies
} from './analyze-action-dependencies';

export type {
  TargetType,
  JavaScriptActionDependency,
  ViewDependency
} from './analyze-action-dependencies';

// ライブラリとしてのエクスポート
export { findFiles } from './lib/file-finder';
export { analyzeFile } from './lib/code-analyzer';
export { extractDependencies } from './lib/dependency-extractor';
export {
  formatJavaScriptActionDependencyAnalysisResult,
  formatViewDependencyAnalysisResult
} from './lib/result-formatter';
export { ViewDependencyGraph } from './lib/dependency-graph-builder';
export { analyzeEntryPoints } from './lib/entry-point-analyzer';