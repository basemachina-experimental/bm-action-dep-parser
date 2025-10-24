# bm-action-dep-parser

BaseMachina アクション依存関係解析ツール

## 概要

このツールは、BaseMachinaのJavaScriptアクションとビューのコードを静的解析して、各ファイルがどのアクションに依存しているかを特定します。

> **注意**: このプロジェクトは、ビューやJavaScriptアクションが構造化されたディレクトリに配置されていることを想定しています。例えば以下のようなディレクトリ構造を前提としています。
> 必ずしもこちらと同じにする必要はありませんが、ビューやJavaScriptアクションのエントリーポイントが明確になるようにしてください。
>
> ```
> project/
> ├── actions/
> │   └── js/
> |       └── sampleAction.js
> └── views/
>     ├── components/
>     │   └── SortableForm.tsx
>     └── pages/
>         ├── SortableFormPage.tsx
>         └── paginatedTable/
>             └── index.tsx
> ```

## 機能

- 解析対象（JSアクションかビューか）と対象ディレクトリを指定可能
- 各ファイルごとに依存しているアクションの識別子をリストアップ
- アクション呼び出し関数（`executeAction`, `useExecuteAction`, `useExecuteActionLazy`）を検出
- 変数に格納されたアクション識別子も検出
- JSON形式で結果を出力
- **ビューのエントリーポイント分析**: ビューのエントリーポイントから直接・間接的に依存しているすべてのアクションを可視化（ビューは常にエントリーポイント分析モード）
- **カスタムエントリーポイントパターン**: エントリーポイントを柔軟に指定可能（デフォルトは `pages/**/*.{tsx,jsx,ts,js}` と `*.{tsx,jsx,ts,js}` で、ネスト構造とフラット構造の両方に対応）
- **アクション識別子によるフィルタリング**: 特定のアクションに依存するビューやアクションのみを抽出し、変更影響範囲の分析を効率化

### 出力例

```
 npx @basemachina/bm-action-dep-parser view ./bm-action-dep-parser/tests/fixtures/views 
[
  {
    "entrypoint": "pages/SortableFormPage.tsx",
    "dependencies": {
      "direct": [],
      "indirect": {
        "components/SortableForm.tsx": [
          "get-products",
          "update-category"
        ]
      }
    }
  },
  {
    "entrypoint": "pages/paginatedTable/index.tsx",
    "dependencies": {
      "direct": [
        "get-users"
      ],
      "indirect": {}
    }
  }
]
```

## 使用方法

### CLIツールとして使用

```bash
npx @basemachina/bm-action-dep-parser action ./packages/actions/js
npx @basemachina/bm-action-dep-parser view ./packages/views
```

### オプション

```bash
# カスタムエントリーポイントパターンを指定（ビューの場合のみ）
npx @basemachina/bm-action-dep-parser view ./packages/views --entry-point-patterns "**/*.tsx"

# 特定のアクションに依存するビューのみを抽出
npx @basemachina/bm-action-dep-parser view ./packages/views --filter-action get-users

# 複数のアクションでフィルタリング（OR論理）
npx @basemachina/bm-action-dep-parser view ./packages/views --filter-action get-users,update-category

# アクション解析でもフィルタリング可能
npx @basemachina/bm-action-dep-parser action ./packages/actions/js --filter-action base-action

# ヘルプを表示
npx @basemachina/bm-action-dep-parser --help
```

### フィルタリング機能の使用例

特定のアクションの変更影響範囲を分析する場合：

```bash
# get-usersアクションに依存するビューを特定
npx @basemachina/bm-action-dep-parser view ./packages/views --filter-action get-users

# 出力: get-usersを直接または間接的に使用するビューのみが表示される
[
  {
    "entrypoint": "pages/UserListPage.tsx",
    "dependencies": {
      "direct": ["get-users"],
      "indirect": {}
    }
  }
]
```

存在しないアクション識別子を指定した場合、警告メッセージが標準エラー出力に表示されます：

```
Warning: Action identifier 'nonexistent-action' not found in dependency graph
No dependencies found for the specified action identifier(s)
[]
```

### ローカルでの実行

```bash
pnpm run analyze action ./packages/actions/js
pnpm run analyze view ./packages/views
```

## 技術詳細

このツールは以下のモジュールで構成されています：

1. **index.ts**: メインエントリーポイント
2. **cli.ts**: コマンドラインインターフェース
3. **analyze-action-dependencies.ts**: メイン解析ロジック
4. **lib/file-finder.ts**: ファイル検索モジュール
5. **lib/code-analyzer.ts**: コード解析モジュール（TypeScript Compiler API使用）
6. **lib/dependency-extractor.ts**: 依存関係抽出モジュール
7. **lib/result-formatter.ts**: 結果出力モジュール（JSON形式）
8. **lib/dependency-graph-builder.ts**: ビュー依存関係グラフ構築モジュール
9. **lib/action-dependency-graph-builder.ts**: アクション依存関係グラフ構築モジュール
10. **lib/entry-point-analyzer.ts**: エントリーポイント解析モジュール
11. **lib/dependency-filter.ts**: 依存関係フィルタリングモジュール（アクション識別子による逆引き検索）

TypeScriptのコンパイラAPIを使用してコードを解析し、アクション呼び出しを検出しています。エントリーポイント分析では、ファイル間の依存関係も解析して、間接的なアクション依存関係も検出します。
