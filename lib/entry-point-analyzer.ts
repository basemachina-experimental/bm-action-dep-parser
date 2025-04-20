import * as path from 'path';
import { glob } from 'glob';
import { DependencyGraph } from './dependency-graph-builder';

/**
 * 指定されたパターンに一致するファイルをエントリーポイントとして特定
 * @param viewsDir ビューのディレクトリパス
 * @param entryPointPatterns エントリーポイントのパターン
 * @returns エントリーポイントのファイルパスの配列
 */
export async function findEntryPoints(viewsDir: string, entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"]): Promise<string[]> {
  const files: string[] = [];
  
  // 各パターンに一致するファイルを検索
  for (const pattern of entryPointPatterns) {
    const patternPath = path.join(viewsDir, pattern);
    const matchedFiles = await glob(patternPath);
    files.push(...matchedFiles);
  }
  
  // index.tsxファイルを優先
  const entryPoints: string[] = [];
  const dirToFiles = new Map<string, string[]>();
  
  for (const file of files) {
    const dir = path.dirname(file);
    if (!dirToFiles.has(dir)) {
      dirToFiles.set(dir, []);
    }
    dirToFiles.get(dir)!.push(file);
  }
  
  for (const [dir, dirFiles] of dirToFiles.entries()) {
    const indexFile = dirFiles.find(file => path.basename(file).startsWith('index.'));
    if (indexFile) {
      entryPoints.push(indexFile);
    } else {
      entryPoints.push(...dirFiles);
    }
  }
  
  return entryPoints;
}

/**
 * エントリーポイントからの依存関係を解析
 * @param viewsDir ビューのディレクトリパス
 * @param dependencyGraph 依存関係グラフ
 * @param entryPointPatterns エントリーポイントのパターン
 * @returns エントリーポイントごとの依存関係
 */
export async function analyzeEntryPoints(
  viewsDir: string,
  dependencyGraph: DependencyGraph,
  entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"]
): Promise<Record<string, {
  direct: string[];
  indirect: Record<string, string[]>;
}>> {
  // 指定されたパターンに一致するファイルをエントリーポイントとして特定
  const entryPoints = await findEntryPoints(viewsDir, entryPointPatterns);
  
  // 各エントリーポイントの依存関係を解析
  const result: Record<string, {
    direct: string[];
    indirect: Record<string, string[]>;
  }> = {};
  
  for (const entryPoint of entryPoints) {
    const dependencies = dependencyGraph.getReachableActionDependencies(entryPoint);
    
    // Map<string, string[]>をRecord<string, string[]>に変換
    const indirectDependencies: Record<string, string[]> = {};
    for (const [file, actions] of dependencies.indirect.entries()) {
      // ファイルパスをviewsDirからの相対パスに変換
      const relativePath = path.relative(viewsDir, file);
      indirectDependencies[relativePath] = actions;
    }
    
    // エントリーポイントをviewsDirからの相対パスに変換
    const relativeEntryPoint = path.relative(viewsDir, entryPoint);
    
    result[relativeEntryPoint] = {
      direct: dependencies.direct,
      indirect: indirectDependencies
    };
  }
  
  return result;
}

/**
 * エントリーポイント分析結果をテキスト形式でフォーマット
 * @param entryPointDependencies エントリーポイントごとの依存関係
 * @returns テキスト形式でフォーマットされた結果
 */
export function formatEntryPointResults(
  entryPointDependencies: Record<string, {
    direct: string[];
    indirect: Record<string, string[]>;
  }>,
  format: 'text' | 'json' = 'text'
): string {
  if (format === 'json') {
    return JSON.stringify(entryPointDependencies, null, 2);
  }
  
  let result = '';
  
  for (const [entryPoint, dependencies] of Object.entries(entryPointDependencies)) {
    result += `\n## エントリーポイント: ${entryPoint}\n`;
    
    // 直接依存するアクション
    result += '\n### 直接依存するアクション:\n';
    if (dependencies.direct.length === 0) {
      result += '- なし\n';
    } else {
      for (const action of dependencies.direct) {
        result += `- ${action}\n`;
      }
    }
    
    // 間接依存するアクション
    result += '\n### 間接依存するアクション:\n';
    const indirectActions = new Map<string, string[]>();
    
    for (const [file, actions] of Object.entries(dependencies.indirect)) {
      for (const action of actions) {
        if (!indirectActions.has(action)) {
          indirectActions.set(action, []);
        }
        indirectActions.get(action)!.push(file);
      }
    }
    
    if (indirectActions.size === 0) {
      result += '- なし\n';
    } else {
      for (const [action, files] of indirectActions.entries()) {
        result += `- ${action} (経由: ${files.join(', ')})\n`;
      }
    }
    
    // 依存関係パスの出力は不要
    
    result += '\n';
  }
  
  return result;
}