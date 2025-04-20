import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatResults } from './lib/result-formatter';
import { DependencyGraph } from './lib/dependency-graph-builder';
import { analyzeEntryPoints, formatEntryPointResults } from './lib/entry-point-analyzer';

/**
 * アクション依存関係を解析する関数
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @param targetDir 対象ディレクトリ
 * @param format 出力形式 ('text' または 'json')
 * @param entryPointPatterns エントリーポイントのパターン（ビューの場合のみ使用）
 * @returns 解析結果
 */
export async function analyzeActionDependencies(
  targetType: 'action' | 'view',
  targetDir: string,
  format: 'text' | 'json' = 'text',
  entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"]
): Promise<string> {
  // ファイル検索
  const files = await findFiles(targetDir, targetType);
  console.log(`${files.length} 個のファイルが見つかりました`);

  // 各ファイルの解析と依存関係の抽出
  const dependencies: Record<string, string[]> = {};
  for (const file of files) {
    try {
      const ast = await analyzeFile(file, targetType);
      const fileDependencies = extractDependencies(ast, targetType);
      dependencies[file] = fileDependencies;
    } catch (error) {
      console.error(`ファイル ${file} の解析中にエラーが発生しました:`, error);
      dependencies[file] = [];
    }
  }

  let result = '';

  // アクションの場合のみ通常の解析結果を表示
  if (targetType === 'action') {
    // 結果の出力
    const formattedResults = formatResults(dependencies, format);
    result += '\n===== 解析結果 =====\n\n';
    result += formattedResults;

    // 依存関係の統計情報
    const totalDependencies = Object.values(dependencies)
      .reduce((acc, deps) => acc + deps.length, 0);
    const filesWithDependencies = Object.values(dependencies)
      .filter(deps => deps.length > 0).length;
    
    result += '\n===== 統計情報 =====\n';
    result += `解析したファイル数: ${files.length}\n`;
    result += `アクション依存関係を持つファイル数: ${filesWithDependencies}\n`;
    result += `検出されたアクション依存関係の総数: ${totalDependencies}\n`;
  }
  
  // ビューの場合は常にエントリーポイント分析を行う
  if (targetType === 'view') {
    console.log('\nエントリーポイント分析を開始します...');
    
    // 依存関係グラフの構築
    const dependencyGraph = new DependencyGraph(targetDir);
    for (const file of files) {
      await dependencyGraph.addFile(file);
    }
    
    // エントリーポイントからの依存関係を解析
    const entryPointDependencies = await analyzeEntryPoints(targetDir, dependencyGraph, entryPointPatterns);
    
    // 結果の出力
    const formattedEntryPointResults = formatEntryPointResults(entryPointDependencies, format);
    result += '\n===== エントリーポイント分析結果 =====\n\n';
    result += formattedEntryPointResults;
    
    // 統計情報
    const entryPointCount = Object.keys(entryPointDependencies).length;
    result += '\n===== エントリーポイント統計情報 =====\n';
    result += `エントリーポイント数: ${entryPointCount}\n`;
    
    // 依存関係グラフの統計情報
    const graphStats = dependencyGraph.getStats();
    result += '\n===== 依存関係グラフ統計情報 =====\n';
    result += `解析したファイル数: ${graphStats.totalFiles}\n`;
    result += `ファイル間の依存関係数: ${graphStats.totalDependencies}\n`;
    result += `アクション依存関係を持つファイル数: ${graphStats.filesWithActionDependencies}\n`;
    result += `検出されたアクション依存関係の総数: ${graphStats.totalActionDependencies}\n`;
  }

  return result;
}

// ライブラリとしてのエクスポート
export {
  findFiles,
  analyzeFile,
  extractDependencies,
  formatResults,
  DependencyGraph,
  analyzeEntryPoints,
  formatEntryPointResults
};