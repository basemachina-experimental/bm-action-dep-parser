import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatResults } from './lib/result-formatter';
import { DependencyGraph } from './lib/dependency-graph-builder';
import { analyzeEntryPoints, defaultEntryPointPatterns, formatEntryPointResults } from './lib/entry-point-analyzer';

export type TargetType = 'action' | 'view';

/**
 * アクション依存関係解析ツールのメイン関数
 */
async function main() {
  try {
    // コマンドライン引数の解析
    const args = process.argv.slice(2);
    const targetType = args[0] as TargetType;
    const targetDir = args[1]; // 対象ディレクトリ
    
    // 出力形式とオプションの解析
    // ビューの場合は常にエントリー分析モードにする
    let entryPointPatterns: string[] = defaultEntryPointPatterns;
    
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--entry-point-patterns' && i + 1 < args.length) {
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

    // コンソール出力を削除

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
        console.error(`ファイル ${file} の解析中にエラーが発生しました:`, error);
        dependencies[file] = [];
      }
    }

    // アクションの場合のみ通常の解析結果を表示
    if (targetType === 'action') {
      // JSON形式の結果のみを出力
      const formattedResults = formatResults(dependencies);
      console.log(formattedResults);
    }
    
    // ビューの場合は常にエントリーポイント分析を行う
    if (targetType === 'view') {
      // コンソール出力を削除
      
      // 依存関係グラフの構築
      const dependencyGraph = new DependencyGraph(targetDir);
      for (const file of files) {
        await dependencyGraph.addFile(file);
      }
      
      // エントリーポイントからの依存関係を解析
      const entryPointDependencies = await analyzeEntryPoints(targetDir, dependencyGraph, entryPointPatterns);
      
      // JSON形式の結果のみを出力
      const formattedEntryPointResults = formatEntryPointResults(entryPointDependencies);
      console.log(formattedEntryPointResults);
    }
  } catch (error) {
    // エラーもJSON形式で出力
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  }
}

// メイン関数の実行
main().catch(error => {
  // エラーもJSON形式で出力
  console.error(JSON.stringify({
    error: error instanceof Error ? error.message : String(error)
  }));
  process.exit(1);
});