#!/usr/bin/env node

import { analyzeActionDependencies, TargetType } from './analyze-action-dependencies';
import { formatJavaScriptActionDependencyAnalysisResult, formatViewDependencyAnalysisResult } from './lib/result-formatter';
import { defaultEntryPointPatterns } from './lib/entry-point-analyzer';

// コマンドライン引数の解析
const args = process.argv.slice(2);

// ヘルプメッセージの表示
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
bm-action-dep-parser - BaseMachina アクション依存関係解析ツール

使用方法:
  bm-action-dep-parser <action|view> <directory> [options]

オプション:
  --entry-point-patterns <patterns> エントリーポイントのパターンをカンマ区切りで指定
                                    (デフォルト: "pages/**/*.{tsx,jsx,ts,js},*.{tsx,jsx,ts,js}")
  --filter-action <identifiers>     フィルタリングするアクション識別子をカンマ区切りで指定
  --help, -h                        ヘルプメッセージを表示

例:
  bm-action-dep-parser action ./packages/actions/js
  bm-action-dep-parser view ./packages/views
  bm-action-dep-parser view ./packages/views --entry-point-patterns "pages/*.tsx,components/**/*.tsx"
  bm-action-dep-parser view ./packages/views --filter-action sampleAction
  bm-action-dep-parser action ./packages/actions/js --filter-action action1,action2
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
let entryPointPatterns: string[] = defaultEntryPointPatterns;
let filterActionIdentifiers: string[] | undefined = undefined;

for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--entry-point-patterns' && i + 1 < args.length) {
        entryPointPatterns = args[i + 1].split(',');
        i++;
    } else if (arg === '--filter-action' && i + 1 < args.length) {
        const identifiersArg = args[i + 1];
        if (!identifiersArg || identifiersArg.trim() === '') {
            console.error('エラー: --filter-action オプションには少なくとも1つのアクション識別子を指定してください');
            process.exit(1);
        }
        filterActionIdentifiers = identifiersArg.split(',').map(id => id.trim()).filter(id => id !== '');
        if (filterActionIdentifiers.length === 0) {
            console.error('エラー: --filter-action オプションには有効なアクション識別子を指定してください');
            process.exit(1);
        }
        i++;
    }
}

// 解析の実行
analyzeActionDependencies(targetType, targetDir, entryPointPatterns, filterActionIdentifiers)
    .then(result => {
        console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
        console.error('エラーが発生しました:', error);
        process.exit(1);
    });