import * as ts from 'typescript';

/**
 * ASTからアクション依存関係を抽出する
 * @param sourceFile TypeScriptのソースファイル（AST）
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @returns 依存しているアクションの識別子の配列
 */
export function extractDependencies(sourceFile: ts.SourceFile, targetType: 'action' | 'view'): string[] {
  const dependencies = new Set<string>();
  const variableMap = new Map<string, string>(); // 変数名とその値のマッピング
  
  // ASTを走査して、アクション呼び出しを検出
  function visit(node: ts.Node) {
    // 変数宣言を検出して、文字列リテラルが代入されている場合は記録
    if (ts.isVariableDeclaration(node) && 
        node.initializer && 
        ts.isStringLiteral(node.initializer) && 
        ts.isIdentifier(node.name)) {
      variableMap.set(node.name.text, node.initializer.text);
    }
    
    // executeAction の呼び出しを検出
    if (ts.isCallExpression(node) && 
        ts.isIdentifier(node.expression) && 
        node.expression.text === 'executeAction') {
      
      const firstArg = node.arguments[0];
      if (firstArg) {
        if (ts.isStringLiteral(firstArg)) {
          // 文字列リテラルの場合
          dependencies.add(firstArg.text);
        } else if (ts.isIdentifier(firstArg)) {
          // 変数の場合
          const variableValue = variableMap.get(firstArg.text);
          if (variableValue) {
            dependencies.add(variableValue);
          }
        }
      }
    }
    
    // ビューのコードの場合は、useExecuteAction と useExecuteActionLazy も検出
    if (targetType === 'view') {
      // useExecuteAction の呼び出しを検出
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'useExecuteAction') {
        
        const firstArg = node.arguments[0];
        if (firstArg) {
          if (ts.isStringLiteral(firstArg)) {
            dependencies.add(firstArg.text);
          } else if (ts.isIdentifier(firstArg)) {
            const variableValue = variableMap.get(firstArg.text);
            if (variableValue) {
              dependencies.add(variableValue);
            }
          }
        }
      }
      
      // useExecuteActionLazy の呼び出しを検出
      if (ts.isCallExpression(node) && 
          ts.isIdentifier(node.expression) && 
          node.expression.text === 'useExecuteActionLazy') {
        
        const firstArg = node.arguments[0];
        if (firstArg) {
          if (ts.isStringLiteral(firstArg)) {
            dependencies.add(firstArg.text);
          } else if (ts.isIdentifier(firstArg)) {
            const variableValue = variableMap.get(firstArg.text);
            if (variableValue) {
              dependencies.add(variableValue);
            }
          }
        }
      }
    }
    
    // 子ノードを再帰的に走査
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return Array.from(dependencies);
}