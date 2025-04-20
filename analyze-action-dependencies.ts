import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatResults } from './lib/result-formatter';
import { DependencyGraph } from './lib/dependency-graph-builder';
import { analyzeEntryPoints, formatEntryPointResults } from './lib/entry-point-analyzer';

/**
 * アクション依存関係解析ツールのメイン関数
 */
async function main() {
  try {
    // コマンドライン引数の解析
    const args = process.argv.slice(2);
    const targetType = args[0] as 'action' | 'view'; // 'action' または 'view'
    const targetDir = args[1]; // 対象ディレクトリ
    
    // 出力形式とオプションの解析
    let format: 'text' | 'json' = 'text';
    // ビューの場合は常にエントリー分析モードにする
    let entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"];
    
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg === 'text' || arg === 'json') {
        format = arg;
      } else if (arg === '--entry-point-patterns' && i + 1 < args.length) {
        // 次の引数をエントリーポイントのパターンとして解釈
        entryPointPatterns = args[i + 1].split(',');
        i++; // 次の引数をスキップ
      }
    }

    // 引数の検証
    if (!targetType || !targetDir) {
      console.error('使用方法: ts-node analyze-action-dependencies.ts <action|view> <directory> [text|json] [--entry-point-patterns pattern1,pattern2,...]');
      console.error('例: ts-node analyze-action-dependencies.ts action packages/actions/js');
      console.error('例: ts-node analyze-action-dependencies.ts view packages/views json');
      console.error('例: ts-node analyze-action-dependencies.ts view packages/views --entry-point-patterns "pages/**/*.tsx,components/**/*.tsx"');
      process.exit(1);
    }

    if (targetType !== 'action' && targetType !== 'view') {
      console.error('解析対象は "action" または "view" のいずれかを指定してください');
      process.exit(1);
    }

    console.log(`解析対象: ${targetType}`);
    console.log(`対象ディレクトリ: ${targetDir}`);
    console.log(`出力形式: ${format}`);
    if (targetType === 'view') {
      console.log(`エントリーポイントパターン: ${entryPointPatterns.join(', ')}`);
    }
    console.log('解析を開始します...');

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

    // アクションの場合のみ通常の解析結果を表示
    if (targetType === 'action') {
      // 結果の出力
      const formattedResults = formatResults(dependencies, format);
      console.log('\n===== 解析結果 =====\n');
      console.log(formattedResults);

      // 依存関係の統計情報
      const totalDependencies = Object.values(dependencies)
        .reduce((acc, deps) => acc + deps.length, 0);
      const filesWithDependencies = Object.values(dependencies)
        .filter(deps => deps.length > 0).length;
      
      console.log('\n===== 統計情報 =====');
      console.log(`解析したファイル数: ${files.length}`);
      console.log(`アクション依存関係を持つファイル数: ${filesWithDependencies}`);
      console.log(`検出されたアクション依存関係の総数: ${totalDependencies}`);
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
      console.log('\n===== エントリーポイント分析結果 =====\n');
      console.log(formattedEntryPointResults);
      
      // 統計情報
      const entryPointCount = Object.keys(entryPointDependencies).length;
      console.log('\n===== エントリーポイント統計情報 =====');
      console.log(`エントリーポイント数: ${entryPointCount}`);
      
      // 依存関係グラフの統計情報
      const graphStats = dependencyGraph.getStats();
      console.log('\n===== 依存関係グラフ統計情報 =====');
      console.log(`解析したファイル数: ${graphStats.totalFiles}`);
      console.log(`ファイル間の依存関係数: ${graphStats.totalDependencies}`);
      console.log(`アクション依存関係を持つファイル数: ${graphStats.filesWithActionDependencies}`);
      console.log(`検出されたアクション依存関係の総数: ${graphStats.totalActionDependencies}`);
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// メイン関数の実行
main().catch(error => {
  console.error('予期しないエラーが発生しました:', error);
  process.exit(1);
});