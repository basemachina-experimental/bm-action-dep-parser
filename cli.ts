#!/usr/bin/env node

import { TargetType } from './analyze-action-dependencies';
import { analyzeActionDependencies } from './index';

// コマンドライン引数の解析
const args = process.argv.slice(2);

// ヘルプメッセージの表示
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
bm-action-dep-parser - BaseMachina アクション依存関係解析ツール

使用方法:
  bm-action-dep-parser <action|view> <directory> [options]

オプション:
  --entry-point-patterns <patterns> エントリーポイントのパターンをカンマ区切りで指定 (デフォルト: pages/**/*.{tsx,jsx,ts,js})
  --help, -h                      ヘルプメッセージを表示

例:
  bm-action-dep-parser action ./packages/actions/js
  bm-action-dep-parser view ./packages/views
  bm-action-dep-parser view ./packages/views --entry-point-patterns "pages/*.tsx,components/**/*.tsx"
`);
    process.exit(0);
}

// 引数の検証
const targetType = args[0] as TargetType;
const targetDir = args[1];

if (!targetType || !targetDir) {
    console.error('エラー: 解析対象と対象ディレクトリを指定してください');
    console.error('使用方法: bm-action-dep-parser <action|view> <directory> [options]');
    console.error('詳細は --help オプションを参照してください');
    process.exit(1);
}

// オプションの解析
let entryPointPatterns: string[] = ["pages/**/*.{tsx,jsx,ts,js}"];

for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--entry-point-patterns' && i + 1 < args.length) {
        entryPointPatterns = args[i + 1].split(',');
        i++;
    }
}

// 解析の実行
analyzeActionDependencies(targetType, targetDir, entryPointPatterns)
    .catch(error => {
        console.error('エラーが発生しました:', error);
        process.exit(1);
    });