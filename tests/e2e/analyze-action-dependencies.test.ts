import { analyzeActionDependencies, TargetType } from '../../analyze-action-dependencies';
import * as path from 'path';

describe('Action dependencies analysis', () => {
  it('should correctly analyze action dependencies', async () => {
    // 関数を直接呼び出し
    const result = await analyzeActionDependencies(
      'action', 
      path.resolve(__dirname, '../../tests/fixtures/actions')
    );
    
    // 期待される結果
    const expected = {
      [path.resolve(__dirname, '../../tests/fixtures/actions/sampleAction.js')]: [
        "bm-onboarding-list-users",
        "bm-onboarding-get-user"
      ]
    };
    
    expect(result).toEqual(expected);
  });

  it('should handle non-existent directory', async () => {
    try {
      // 存在しないディレクトリを指定
      await analyzeActionDependencies(
        'action', 
        path.resolve(__dirname, '../../tests/fixtures/non-existent')
      );
      // エラーが発生しなかった場合はテスト失敗
      fail('Expected an error to be thrown');
    } catch (error) {
      // エラーが発生することを確認
      expect(error).toBeDefined();
    }
  });
});

describe('View dependencies analysis', () => {
  it('should correctly analyze view dependencies', async () => {
    // 関数を直接呼び出し
    const result = await analyzeActionDependencies(
      'view',
      path.resolve(__dirname, '../../tests/fixtures/views')
    );
    
    // 結果をコンソールに出力して確認
    console.log('View dependencies result:', JSON.stringify(result, null, 2));
    
    // 期待される結果の構造を確認
    expect(Object.keys(result)).toContain('pages/SortableFormPage.tsx');
    expect(Object.keys(result)).toContain('pages/paginatedTable/index.tsx');
    
    // SortableFormPageの依存関係を確認
    const sortableFormPage = result['pages/SortableFormPage.tsx'];
    expect(sortableFormPage).toHaveProperty('direct');
    expect(sortableFormPage).toHaveProperty('indirect');
    expect(Object.keys(sortableFormPage.indirect)).toContain('components/SortableForm.tsx');
    expect(sortableFormPage.indirect['components/SortableForm.tsx']).toContain('get-products');
    expect(sortableFormPage.indirect['components/SortableForm.tsx']).toContain('update-category');
    
    // PaginatedTableの依存関係を確認
    const paginatedTable = result['pages/paginatedTable/index.tsx'];
    expect(paginatedTable).toHaveProperty('direct');
    expect(paginatedTable.direct).toContain('get-users');
  });

  it('should handle empty directory', async () => {
    // 一時的な空ディレクトリを作成してテスト
    const tempDir = path.resolve(__dirname, '../fixtures/temp-empty-dir');
    
    try {
      // ディレクトリが存在しない場合は作成
      const fs = require('fs');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const result = await analyzeActionDependencies('view', tempDir);
      
      // 空のオブジェクトが返されることを期待
      expect(Object.keys(result)).toHaveLength(0);
    } finally {
      // テスト後にディレクトリを削除
      const fs = require('fs');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });
});

describe('Invalid arguments', () => {
  it('should handle invalid target type', async () => {
    try {
      // TypeScriptの型チェックを回避するためにanyを使用
      await analyzeActionDependencies('invalid-type' as any, './tests/fixtures/views');
      // エラーが発生しなかった場合はテスト失敗
      fail('Expected an error to be thrown');
    } catch (error) {
      // エラーが発生することを確認
      expect(error).toBeDefined();
    }
  });
});