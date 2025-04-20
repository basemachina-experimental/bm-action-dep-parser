import path from 'path';

/**
 * 依存関係の解析結果をフォーマットする
 * @param dependencies ファイルパスとそれが依存するアクションのマップ
 * @param format 出力形式 ('text' または 'json')
 * @returns フォーマットされた結果
 */
export function formatResults(
  dependencies: Record<string, string[]>, 
  format: 'text' | 'json' = 'text'
): string {
  if (format === 'json') {
    return formatAsJson(dependencies);
  }
  
  return formatAsText(dependencies);
}

/**
 * 依存関係の解析結果をテキスト形式でフォーマットする
 * @param dependencies ファイルパスとそれが依存するアクションのマップ
 * @returns テキスト形式でフォーマットされた結果
 */
function formatAsText(dependencies: Record<string, string[]>): string {
  let result = '';
  let hasResults = false;
  
  for (const [file, deps] of Object.entries(dependencies)) {
    if (deps.length === 0) {
      continue;
    }
    
    hasResults = true;
    const relativePath = path.relative(process.cwd(), file);
    result += `\n## ${relativePath}\n`;
    
    for (const dep of deps) {
      result += `- ${dep}\n`;
    }
  }
  
  if (!hasResults) {
    return 'アクション依存関係は見つかりませんでした。';
  }
  
  return result;
}

/**
 * 依存関係の解析結果をJSON形式でフォーマットする
 * @param dependencies ファイルパスとそれが依存するアクションのマップ
 * @returns JSON形式でフォーマットされた結果
 */
function formatAsJson(dependencies: Record<string, string[]>): string {
  const result: Record<string, string[]> = {};
  
  for (const [file, deps] of Object.entries(dependencies)) {
    if (deps.length === 0) {
      continue;
    }
    
    const relativePath = path.relative(process.cwd(), file);
    result[relativePath] = deps;
  }
  
  return JSON.stringify(result, null, 2);
}