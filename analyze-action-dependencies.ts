import * as path from 'path';
import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatJavaScriptActionDependencyAnalysisResult, formatViewDependencyAnalysisResult } from './lib/result-formatter';
import { ViewDependencyGraph } from './lib/dependency-graph-builder';
import { analyzeEntryPoints, defaultEntryPointPatterns } from './lib/entry-point-analyzer';

export type TargetType = 'action' | 'view';

/**
 * JavaScriptアクションの依存関係を表す型
 */
export interface JavaScriptActionDependency {
  entrypoint: string;
  dependencies: string[];
}

/**
 * ビューの依存関係を表す型
 */
export interface ViewDependency {
  entrypoint: string;
  dependencies: {
    direct: string[];
    indirect: Record<string, string[]>;
  };
}

/**
 * アクション依存関係を解析する関数
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @param targetDir 対象ディレクトリ
 * @param entryPointPatterns エントリーポイントのパターン（viewの場合のみ使用）
 * @returns 解析結果のオブジェクト
 */
export async function analyzeActionDependencies(
  targetType: TargetType,
  targetDir: string,
  entryPointPatterns: string[] = defaultEntryPointPatterns
): Promise<JavaScriptActionDependency[] | ViewDependency[]> {
  try {
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

    // アクションの場合
    if (targetType === 'action') {
      // 新しい形式に変換
      const result: JavaScriptActionDependency[] = [];
      
      for (const [file, deps] of Object.entries(dependencies)) {
        if (deps.length === 0) {
          continue;
        }
        
        // コマンドで指定したディレクトリからの相対パスに変換
        const relativePath = path.relative(targetDir, file);
        
        result.push({
          entrypoint: relativePath,
          dependencies: deps
        });
      }
      
      return result;
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
      
      // 新しい形式に変換
      const result: ViewDependency[] = [];
      
      for (const [entryPoint, deps] of Object.entries(entryPointDependencies)) {
        result.push({
          entrypoint: entryPoint,
          dependencies: deps
        });
      }
      
      return result;
    }

    return [];
  } catch (error) {
    throw error;
  }
}

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
      throw new Error('targetTypeとtargetDirは必須です');
    }

    if (targetType !== 'action' && targetType !== 'view') {
      throw new Error('解析対象は "action" または "view" のいずれかを指定してください');
    }

    // 依存関係の解析
    const result = await analyzeActionDependencies(targetType, targetDir, entryPointPatterns);
    
    // 結果の出力
    if (targetType === 'action') {
      // 古い形式に変換してからフォーマット
      const oldFormatResult: Record<string, string[]> = {};
      for (const item of result as JavaScriptActionDependency[]) {
        oldFormatResult[path.join(targetDir, item.entrypoint)] = item.dependencies;
      }
      
      // JSON形式の結果のみを出力
      const formattedResults = formatJavaScriptActionDependencyAnalysisResult(oldFormatResult);
      console.log(formattedResults);
    } else if (targetType === 'view') {
      // 古い形式に変換してからフォーマット
      const oldFormatResult: Record<string, {
        direct: string[];
        indirect: Record<string, string[]>;
      }> = {};
      
      for (const item of result as ViewDependency[]) {
        oldFormatResult[item.entrypoint] = item.dependencies;
      }
      
      // JSON形式の結果のみを出力
      const formattedEntryPointResults = formatViewDependencyAnalysisResult(oldFormatResult);
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

// モジュールがrequireされた場合は実行しない（テスト時など）
if (require.main === module) {
  // メイン関数の実行
  main().catch(error => {
    // エラーもJSON形式で出力
    console.error(JSON.stringify({
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  });
}