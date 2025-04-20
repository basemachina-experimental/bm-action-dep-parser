# bm-action-dep-parser

BaseMachina アクション依存関係解析ツール

[![npm version](https://img.shields.io/npm/v/bm-action-dep-parser.svg)](https://www.npmjs.com/package/bm-action-dep-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 概要

このツールは、BaseMachinaのJavaScriptアクションとビューのコードを静的解析して、各ファイルがどのアクションに依存しているかを特定します。

## 機能

- 解析対象（JSアクションかビューか）と対象ディレクトリを指定可能
- 各ファイルごとに依存しているアクションの識別子をリストアップ
- アクション呼び出し関数（`executeAction`, `useExecuteAction`, `useExecuteActionLazy`）を検出
- 変数に格納されたアクション識別子も検出
- テキスト形式またはJSON形式で結果を出力
- **ビューのエントリーポイント分析**: ビューのエントリーポイントから直接・間接的に依存しているすべてのアクションを可視化（ビューは常にエントリーポイント分析モード）
- **カスタムエントリーポイントパターン**: エントリーポイントを柔軟に指定可能（デフォルトは `pages/**/*.{tsx,jsx,ts,js}`）

## インストール

```bash
# グローバルインストール
npm install -g bm-action-dep-parser

# ローカルインストール
npm install --save-dev bm-action-dep-parser
```

## 使用方法

### CLIツールとして使用

```bash
npx bm-action-dep-parser action ./packages/actions/js
npx bm-action-dep-parser view ./packages/views
```

### オプション

```bash
# 出力形式を指定（text または json）
npx bm-action-dep-parser action ./packages/actions/js --format json

# カスタムエントリーポイントパターンを指定（ビューの場合のみ）
npx bm-action-dep-parser view ./packages/views --entry-point-patterns "**/*.tsx"

# ヘルプを表示
npx bm-action-dep-parser --help
```

### ローカルでの実行

```bash
npx ts-node analyze-action-dependencies.ts action ./packages/actions/js
npx ts-node analyze-action-dependencies.ts view ./packages/views
```

## 技術詳細

このツールは以下のモジュールで構成されています：

1. **index.ts**: メインエントリーポイント
2. **cli.ts**: コマンドラインインターフェース
3. **lib/file-finder.ts**: ファイル検索モジュール
4. **lib/code-analyzer.ts**: コード解析モジュール
5. **lib/dependency-extractor.ts**: 依存関係抽出モジュール
6. **lib/result-formatter.ts**: 結果出力モジュール
7. **lib/dependency-graph-builder.ts**: 依存関係グラフ構築モジュール
8. **lib/entry-point-analyzer.ts**: エントリーポイント解析モジュール

TypeScriptのコンパイラAPIを使用してコードを解析し、アクション呼び出しを検出しています。エントリーポイント分析モードでは、ファイル間の依存関係も解析して、間接的なアクション依存関係も検出します。

## ライセンス

MIT