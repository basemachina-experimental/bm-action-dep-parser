import * as ts from 'typescript';
import fs from 'fs/promises';

/**
 * ファイルを解析してASTを生成する
 * @param filePath 解析対象のファイルパス
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @returns TypeScriptのソースファイル（AST）
 */
export async function analyzeFile(filePath: string, targetType: 'action' | 'view') {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // TypeScriptのパーサーを使用してASTを生成
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    return sourceFile;
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    throw error;
  }
}