import * as path from 'path';
import { findFiles } from './lib/file-finder';
import { analyzeFile } from './lib/code-analyzer';
import { extractDependencies } from './lib/dependency-extractor';
import { formatJavaScriptActionDependencyAnalysisResult, formatViewDependencyAnalysisResult } from './lib/result-formatter';
import { ViewDependencyGraph } from './lib/dependency-graph-builder';
import { ActionDependencyGraph } from './lib/action-dependency-graph-builder';
import { analyzeEntryPoints, defaultEntryPointPatterns } from './lib/entry-point-analyzer';

export type TargetType = 'action' | 'view';

/**
 * JavaScriptアクションの依存関係を表す型
 */
export interface JavaScriptActionDependency {
  entrypoint: string;
  dependencies: {
    direct: string[];
    indirect: Record<string, string[]>;
  };
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
      // 依存関係グラフの構築
      const dependencyGraph = new ActionDependencyGraph(targetDir);
      for (const file of files) {
        await dependencyGraph.addFile(file);
      }
      
      // 依存関係グラフを構築
      dependencyGraph.buildDependencyGraph();
      
      // 各ファイルの依存関係を解析
      const result: JavaScriptActionDependency[] = [];
      
      for (const file of files) {
        // 依存関係を取得
        const dependencies = dependencyGraph.getReachableActionDependencies(file);
        
        // 依存関係がある場合のみ結果に追加
        if (dependencies.direct.length > 0 || dependencies.indirect.size > 0) {
          // コマンドで指定したディレクトリからの相対パスに変換
          const relativePath = path.relative(targetDir, file);
          
          result.push({
            entrypoint: relativePath,
            dependencies: {
              direct: dependencies.direct,
              indirect: Object.fromEntries(
                Array.from(dependencies.indirect.entries()).map(([key, value]) => [
                  path.relative(targetDir, key),
                  value
                ])
              )
            }
          });
        }
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
