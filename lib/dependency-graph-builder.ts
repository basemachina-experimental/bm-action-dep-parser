import * as ts from 'typescript';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { extractDependencies } from './dependency-extractor';

/**
 * ファイル間の依存関係を表すグラフ
 */
export class DependencyGraph {
  // ファイル間の依存関係を表すグラフ（キー：ファイルパス、値：依存先ファイルパスのセット）
  private graph: Map<string, Set<string>> = new Map();
  
  // 各ファイルが直接依存するアクション（キー：ファイルパス、値：アクション識別子のセット）
  private directActionDependencies: Map<string, Set<string>> = new Map();
  
  // ファイルパスの正規化（絶対パスに変換）
  private normalizedPaths: Map<string, string> = new Map();
  
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
      
      // インポート文を解析
      const imports = this.extractImports(sourceFile, path.dirname(filePath));
      
      // JSXコンポーネントの使用を解析
      const jsxComponents = this.extractJsxComponents(sourceFile, path.dirname(filePath));
      
      // 依存するファイルをグラフに追加
      const dependencies = new Set([...imports, ...jsxComponents]);
      this.graph.set(normalizedPath, dependencies);
      
      // 直接依存するアクションを抽出
      const actionDependencies = extractDependencies(sourceFile, 'view');
      if (actionDependencies.length > 0) {
        this.directActionDependencies.set(normalizedPath, new Set(actionDependencies));
      }
      
      // 依存先ファイルも再帰的に解析
      for (const dependency of dependencies) {
        if (dependency.endsWith('.tsx') || dependency.endsWith('.jsx') || 
            dependency.endsWith('.ts') || dependency.endsWith('.js')) {
          await this.addFile(dependency);
        }
      }
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      // エラーが発生した場合は空の依存関係を設定
      this.graph.set(normalizedPath, new Set());
    }
  }
  
  /**
   * インポート文からファイルの依存関係を抽出
   * @param sourceFile TypeScriptのソースファイル
   * @param basePath インポートパスの解決に使用するベースパス
   * @returns 依存先ファイルパスの配列
   */
  private extractImports(sourceFile: ts.SourceFile, basePath: string): string[] {
    const imports: string[] = [];
    
    // ASTを走査してインポート文を検出
    function visit(node: ts.Node) {
      // import文の検出
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const importPath = node.moduleSpecifier.text;
        if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
          // 外部パッケージのインポートはスキップ
          return;
        }
        imports.push(importPath);
      }
      
      // require文の検出
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'require' &&
          node.arguments.length > 0 &&
          ts.isStringLiteral(node.arguments[0])) {
        const importPath = node.arguments[0].text;
        if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
          // 外部パッケージのインポートはスキップ
          return;
        }
        imports.push(importPath);
      }
      
      // 動的インポートの検出
      if (ts.isCallExpression(node) && 
          node.expression.kind === ts.SyntaxKind.ImportKeyword &&
          node.arguments.length > 0 &&
          ts.isStringLiteral(node.arguments[0])) {
        const importPath = node.arguments[0].text;
        if (!importPath.startsWith('@') && !importPath.startsWith('.')) {
          // 外部パッケージのインポートはスキップ
          return;
        }
        imports.push(importPath);
      }
      
      // 子ノードを再帰的に走査
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    // インポートパスを解決
    return imports
      .map(importPath => this.resolveImportPath(importPath, basePath))
      .filter(Boolean) as string[];
  }
  
  /**
   * JSXコンポーネントの使用からファイルの依存関係を抽出
   * @param sourceFile TypeScriptのソースファイル
   * @param basePath インポートパスの解決に使用するベースパス
   * @returns 依存先ファイルパスの配列
   */
  private extractJsxComponents(sourceFile: ts.SourceFile, basePath: string): string[] {
    // 現在の実装では、JSXコンポーネントの使用はインポート文から間接的に検出されるため、
    // 追加の解析は行わない。将来的には、インポートされたコンポーネントとJSX内で使用されている
    // コンポーネントの対応関係を解析して、より正確な依存関係を構築することも可能。
    return [];
  }
  
  /**
   * インポートパスを絶対パスに解決
   * @param importPath インポートパス
   * @param basePath インポートパスの解決に使用するベースパス
   * @returns 解決されたファイルパス
   */
  private resolveImportPath(importPath: string, basePath: string): string | null {
    try {
      if (importPath.startsWith('.')) {
        // 相対パスの解決
        let resolvedPath = path.resolve(basePath, importPath);
        
        // 拡張子がない場合は追加
        if (!path.extname(resolvedPath)) {
          // TypeScriptの拡張子を試す
          const extensions = ['.tsx', '.ts', '.jsx', '.js'];
          for (const ext of extensions) {
            const pathWithExt = resolvedPath + ext;
            try {
              if (fs.existsSync(pathWithExt)) {
                return pathWithExt;
              }
            } catch (e) {
              // ファイルが存在しない場合は次の拡張子を試す
            }
          }
          
          // index.tsxなどを試す
          for (const ext of extensions) {
            const indexPath = path.join(resolvedPath, `index${ext}`);
            try {
              if (fs.existsSync(indexPath)) {
                return indexPath;
              }
            } catch (e) {
              // ファイルが存在しない場合は次の拡張子を試す
            }
          }
        }
        
        return resolvedPath;
      } else if (importPath.startsWith('@')) {
        // エイリアスパスの解決（プロジェクト固有の設定に依存）
        // 現在の実装では、単純化のためにnullを返す
        return null;
      }
      
      // 外部パッケージのインポートはnullを返す
      return null;
    } catch (error) {
      console.error(`Error resolving import path ${importPath}:`, error);
      return null;
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
        
        // 依存先ファイルが直接依存するアクションを取得
        const actionDependencies = this.directActionDependencies.get(normalizedDependency);
        if (actionDependencies && actionDependencies.size > 0) {
          indirect.set(normalizedDependency, Array.from(actionDependencies));
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