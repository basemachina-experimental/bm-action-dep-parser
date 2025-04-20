import { glob } from 'glob';
import path from 'path';

/**
 * 指定されたディレクトリ内のファイルを検索する
 * @param directory 検索対象のディレクトリ
 * @param targetType 解析対象のタイプ ('action' または 'view')
 * @returns ファイルパスの配列
 */
export async function findFiles(directory: string, targetType: 'action' | 'view'): Promise<string[]> {
  const patterns = [];
  
  if (targetType === 'action') {
    patterns.push('**/*.js', '**/*.ts');
  } else {
    patterns.push('**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts');
  }

  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(path.join(directory, pattern));
    files.push(...matches);
  }

  // node_modules や dist ディレクトリを除外
  return files.filter(file => 
    !file.includes('node_modules') && 
    !file.includes('dist') &&
    !file.includes('.d.ts')
  );
}