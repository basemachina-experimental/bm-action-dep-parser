import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatResults } from './lib/result-formatter';
import { ViewDependencyGraph } from './lib/dependency-graph-builder';
import { analyzeEntryPoints, formatEntryPointResults } from './lib/entry-point-analyzer';
import { TargetType } from './analyze-action-dependencies';

/**
 * アクション依存関係を解析する関数
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @param targetDir 対象ディレクトリ
 * @param entryPointPatterns エントリーポイントのパターン（ビューの場合のみ使用）
 * @returns 解析結果
 */
export async function analyzeActionDependencies(
  targetType: TargetType,
  targetDir: string,
  entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"]
): Promise<string> {
  // ファイル検索
  const files = await findFiles(targetDir, targetType);

  // 各ファイルの解析と依存関係の抽出
  const dependencies: Record<string, string[]> = {};
  for (const file of files) {
    try {
      const ast = await analyzeFile(file);
      const fileDependencies = extractDependencies(ast, targetType);
      dependencies[file] = fileDependencies;
    } catch (error) {
      dependencies[file] = [];
    }
  }

  // アクションの場合
  if (targetType === 'action') {
    // JSON形式の結果のみを返す
    return formatResults(dependencies);
  }
  
  // ビューの場合
  if (targetType === 'view') {
    // 依存関係グラフの構築
    const dependencyGraph = new ViewDependencyGraph(targetDir);
    for (const file of files) {
      await dependencyGraph.addFile(file);
    }
    
    // エントリーポイントからの依存関係を解析
    const entryPointDependencies = await analyzeEntryPoints(targetDir, dependencyGraph, entryPointPatterns);
    
    // JSON形式の結果のみを返す
    return formatEntryPointResults(entryPointDependencies);
  }

  // どちらでもない場合（通常はここには到達しない）
  return JSON.stringify({ error: "Invalid target type" });
}

// ライブラリとしてのエクスポート
export {
  findFiles,
  analyzeFile,
  extractDependencies,
  formatResults,
  ViewDependencyGraph,
  analyzeEntryPoints,
  formatEntryPointResults
};