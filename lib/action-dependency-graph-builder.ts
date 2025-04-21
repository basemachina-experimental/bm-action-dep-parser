import * as ts from 'typescript';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { extractDependencies } from './dependency-extractor';

/**
 * アクション間の依存関係を表すグラフ
 */
export class ActionDependencyGraph {
  // アクション間の依存関係を表すグラフ（キー：ファイルパス、値：依存先ファイルパスのセット）
  private graph: Map<string, Set<string>> = new Map();
  
  // 各ファイルが直接依存するアクション（キー：ファイルパス、値：アクション識別子のセット）
  private directActionDependencies: Map<string, Set<string>> = new Map();
  
  // ファイルパスの正規化（絶対パスに変換）
  private normalizedPaths: Map<string, string> = new Map();
  
  // アクション識別子とファイルパスのマッピング
  private actionToFilePath: Map<string, string> = new Map();
  
  // ベースディレクトリ
  private baseDir: string;
  
  constructor(baseDir: string) {
    this.baseDir = path.resolve(baseDir);
  }
  
  /**
   * ファイルを解析してグラフに追加
   * @param filePath ファイルパス
   */
  async addFile(filePath: string): Promise<void> {
    const normalizedPath = this.normalizePath(filePath);
    
    // すでに解析済みの場合はスキップ
    if (this.graph.has(normalizedPath)) {
      return;
    }
    
    try {
      // ファイルの内容を読み込む
      const content = await fsPromises.readFile(filePath, 'utf-8');
      
      // TypeScriptのパーサーを使用してASTを生成
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      // アクション呼び出しを解析
      const actionCalls = extractDependencies(sourceFile, 'action');
      
      // 直接依存するアクションを記録
      if (actionCalls.length > 0) {
        this.directActionDependencies.set(normalizedPath, new Set(actionCalls));
      }
      
      // アクション識別子とファイルパスのマッピングを更新
      // ファイル名（拡張子なし）とアクション識別子が一致する場合、マッピングを作成
      const fileName = path.basename(filePath, path.extname(filePath));
      this.actionToFilePath.set(fileName, normalizedPath);
      
      // 依存関係グラフを更新（初期状態では空のセット）
      this.graph.set(normalizedPath, new Set<string>());
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      // エラーが発生した場合は空の依存関係を設定
      this.graph.set(normalizedPath, new Set());
    }
  }
  
  /**
   * 依存関係グラフを構築
   * 全てのファイルを解析した後に呼び出す必要がある
   */
  buildDependencyGraph(): void {
    // 各ファイルの直接依存するアクションに対応するファイルパスを探索
    for (const [filePath, actionDependencies] of this.directActionDependencies.entries()) {
      const dependencies = new Set<string>();
      
      for (const actionDependency of actionDependencies) {
        // アクション識別子に対応するファイルパスを検索
        for (const [action, file] of this.actionToFilePath.entries()) {
          if (actionDependency === action) {
            dependencies.add(file);
            break;
          }
        }
      }
      
      // 依存関係グラフを更新
      this.graph.set(filePath, dependencies);
    }
  }
  
  /**
   * ファイルパスを正規化（絶対パスに変換）
   * @param filePath ファイルパス
   * @returns 正規化されたファイルパス
   */
  private normalizePath(filePath: string): string {
    if (this.normalizedPaths.has(filePath)) {
      return this.normalizedPaths.get(filePath)!;
    }
    
    const normalizedPath = path.resolve(this.baseDir, filePath);
    this.normalizedPaths.set(filePath, normalizedPath);
    return normalizedPath;
  }
  
  /**
   * エントリーポイントから到達可能なすべてのアクション依存関係を取得
   * @param entryPoint エントリーポイントのファイルパス
   * @returns 直接依存するアクションと間接依存するアクション（ファイルパスごと）
   */
  getReachableActionDependencies(entryPoint: string): {
    direct: string[];
    indirect: Map<string, string[]>;
  } {
    const normalizedEntryPoint = this.normalizePath(entryPoint);
    const visited = new Set<string>();
    const indirect = new Map<string, string[]>();
    
    // 深さ優先探索でグラフを走査
    const dfs = (node: string) => {
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      
      const dependencies = this.graph.get(node);
      if (!dependencies) {
        return;
      }
      
      for (const dependency of dependencies) {
        const normalizedDependency = this.normalizePath(dependency);
        
        // エントリーポイント自身でない場合のみ間接依存関係として追加
        if (normalizedDependency !== normalizedEntryPoint) {
          // 依存先ファイルが直接依存するアクションを取得
          const actionDependencies = this.directActionDependencies.get(normalizedDependency);
          if (actionDependencies && actionDependencies.size > 0) {
            indirect.set(normalizedDependency, Array.from(actionDependencies));
          }
        }
        
        // 依存先ファイルを再帰的に探索
        dfs(normalizedDependency);
      }
    };
    
    // エントリーポイントから探索を開始
    dfs(normalizedEntryPoint);
    
    // エントリーポイント自身が直接依存するアクションを取得
    const direct = this.directActionDependencies.get(normalizedEntryPoint) || new Set<string>();
    
    return {
      direct: Array.from(direct),
      indirect
    };
  }
  
  /**
   * 依存関係グラフの統計情報を取得
   * @returns 統計情報
   */
  getStats(): {
    totalFiles: number;
    totalDependencies: number;
    filesWithActionDependencies: number;
    totalActionDependencies: number;
  } {
    let totalDependencies = 0;
    for (const dependencies of this.graph.values()) {
      totalDependencies += dependencies.size;
    }
    
    let totalActionDependencies = 0;
    for (const actionDependencies of this.directActionDependencies.values()) {
      totalActionDependencies += actionDependencies.size;
    }
    
    return {
      totalFiles: this.graph.size,
      totalDependencies,
      filesWithActionDependencies: this.directActionDependencies.size,
      totalActionDependencies
    };
  }
}