import * as ts from 'typescript';
import { TargetType } from '../analyze-action-dependencies';


/**
 * 引数から依存関係を抽出する共通関数
 * @param arg 関数の引数
 * @param variableMap 変数名とその値のマッピング
 * @returns 依存関係の文字列（存在する場合）
*/
function extractDependencyFromArgument(arg: ts.Node, variableMap: Map<string, string>): string | null {
  if (ts.isStringLiteral(arg)) {
    // 文字列リテラルの場合
    return arg.text;
  } else if (ts.isIdentifier(arg)) {
    // 変数の場合
    return variableMap.get(arg.text) || null;
  }
  return null;
}

/**
 * ASTからアクション依存関係を抽出する
 * @param sourceFile TypeScriptのソースファイル（AST）
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @returns 依存しているアクションの識別子の配列
 */
export function extractDependencies(sourceFile: ts.SourceFile, targetType: TargetType): string[] {
  const dependencies = new Set<string>();
  const variableMap = new Map<string, string>(); // 変数名とその値のマッピング
  
  // 検出対象の関数名
  const targetFunctions = ['executeAction'];
  
  // ビューのコードの場合は、追加の関数も検出
  if (targetType === 'view') {
    targetFunctions.push('useExecuteAction', 'useExecuteActionLazy');
  }
  
  // ASTを走査して、アクション呼び出しを検出
  function visit(node: ts.Node) {
    // 変数宣言を検出して、文字列リテラルが代入されている場合は記録
    if (ts.isVariableDeclaration(node) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        ts.isIdentifier(node.name)) {
      variableMap.set(node.name.text, node.initializer.text);
    }
    
    // 対象関数の呼び出しを検出
    if (ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        targetFunctions.includes(node.expression.text)) {
      
      const firstArg = node.arguments[0];
      if (firstArg) {
        const dependency = extractDependencyFromArgument(firstArg, variableMap);
        if (dependency) {
          dependencies.add(dependency);
        }
      }
    }
    
    // 子ノードを再帰的に走査
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return Array.from(dependencies);
}