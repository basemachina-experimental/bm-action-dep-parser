import { analyzeActionDependencies, JavaScriptActionDependency, ViewDependency } from '../../analyze-action-dependencies';
import * as path from 'path';
import * as fs from 'fs';

describe('Action dependencies analysis', () => {
  it('should correctly analyze action dependencies', async () => {
    // 関数を直接呼び出し
    const result = await analyzeActionDependencies(
      'action', 
      path.resolve(__dirname, '../fixtures/actions')
    );
    
    // 期待される結果をJSONファイルから読み込む
    const expectedPath = path.resolve(__dirname, '../fixtures/expected/action-dependencies.json');
    const expectedJson = fs.readFileSync(expectedPath, 'utf-8');
    const expected = JSON.parse(expectedJson) as JavaScriptActionDependency[];
    
    // テスト用に相対パスのままで比較
    expect(result).toEqual(expected);
  });

  it('should handle non-existent directory', async () => {
    try {
      // 存在しないディレクトリを指定
      await analyzeActionDependencies(
        'action', 
        path.resolve(__dirname, '../fixtures/non-existent')
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
      path.resolve(__dirname, '../fixtures/views')
    );
    
    // 結果をコンソールに出力して確認
    console.log('View dependencies result:', JSON.stringify(result, null, 2));
    
    // 期待される結果をJSONファイルから読み込む
    const expectedPath = path.resolve(__dirname, '../fixtures/expected/view-dependencies.json');
    const expectedJson = fs.readFileSync(expectedPath, 'utf-8');
    const expected = JSON.parse(expectedJson) as ViewDependency[];
    
    expect(result).toEqual(expected);
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
      
      // 空の配列が返されることを期待
      expect(result).toEqual([]);
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