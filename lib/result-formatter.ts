import path from 'path';
import { JavaScriptActionDependency, ViewDependency } from '../analyze-action-dependencies';

/**
 * 依存関係の解析結果をJSON形式でフォーマットする
 * @param dependencies ファイルパスとそれが依存するアクションのマップ
 * @returns JSON形式でフォーマットされた結果
 */
export function formatJavaScriptActionDependencyAnalysisResult(
  dependencies: Record<string, string[]>
): string {
  const result: JavaScriptActionDependency[] = [];
  
  for (const [file, deps] of Object.entries(dependencies)) {
    if (deps.length === 0) {
      continue;
    }
    
    const relativePath = path.relative(process.cwd(), file);
    result.push({
      entrypoint: relativePath,
      dependencies: deps
    });
  }
  
  return JSON.stringify(result, null, 2);
}

/**
 * ビューのエントリーポイント分析結果をJSON形式でフォーマット
 * @param entryPointDependencies エントリーポイントごとの依存関係
 * @returns JSON形式でフォーマットされた結果
 */
export function formatViewDependencyAnalysisResult(
  entryPointDependencies: Record<string, {
    direct: string[];
    indirect: Record<string, string[]>;
  }>
): string {
  const result: ViewDependency[] = [];
  
  for (const [entryPoint, deps] of Object.entries(entryPointDependencies)) {
    result.push({
      entrypoint: entryPoint,
      dependencies: deps
    });
  }
  
  return JSON.stringify(result, null, 2);
}