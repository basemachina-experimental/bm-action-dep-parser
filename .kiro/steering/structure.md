# プロジェクト構造

## ルートディレクトリ構成

```
bm-action-dep-parser/
├── .kiro/                    # Kiro Spec-Driven Development 関連ファイル
│   └── steering/             # ステアリングドキュメント（プロジェクトコンテキスト）
├── dist/                     # TypeScriptコンパイル済みファイル（ビルド生成物）
├── lib/                      # コアライブラリモジュール
├── tests/                    # テストファイルとフィクスチャ
│   ├── e2e/                  # E2Eテスト
│   └── fixtures/             # テスト用サンプルファイル
│       ├── actions/          # テスト用JavaScriptアクション
│       └── views/            # テスト用ビューコンポーネント
├── index.ts                  # ライブラリAPIのメインエクスポート
├── cli.ts                    # CLIエントリーポイント
├── analyze-action-dependencies.ts  # メイン解析ロジック
├── package.json              # パッケージ設定とメタデータ
├── tsconfig.json             # TypeScriptコンパイラ設定
├── jest.config.js            # Jest設定
├── CLAUDE.md                 # Claude Code プロジェクト指示
├── README.md                 # ユーザー向けドキュメント
└── LICENSE                   # ライセンスファイル
```

## サブディレクトリ構造

### `lib/` - コアライブラリモジュール

機能ごとに明確に分離された7つのモジュールで構成：

```
lib/
├── file-finder.ts                        # ファイル検索（glob使用）
├── code-analyzer.ts                      # AST生成（TypeScript Compiler API使用）
├── dependency-extractor.ts               # AST走査とアクション呼び出し検出
├── dependency-graph-builder.ts           # ビュー依存関係グラフ構築
├── action-dependency-graph-builder.ts    # アクション依存関係グラフ構築
├── entry-point-analyzer.ts               # エントリーポイント解析
└── result-formatter.ts                   # 結果のJSON整形
```

### `tests/` - テストとフィクスチャ

```
tests/
├── e2e/
│   └── analyze-action-dependencies.test.ts  # E2Eテスト（実際のファイルを解析）
└── fixtures/
    ├── actions/
    │   ├── sampleAction.js               # テスト用アクション1
    │   └── post-to-slack.js              # テスト用アクション2
    └── views/
        ├── components/
        │   └── SortableForm.tsx          # テスト用コンポーネント
        └── pages/
            ├── SortableFormPage.tsx      # テスト用ページ1
            └── paginatedTable/
                └── index.tsx             # テスト用ページ2（index形式）
```

### `dist/` - ビルド生成物（gitignore対象）

TypeScriptコンパイルにより生成されるファイル：

```
dist/
├── index.js, index.d.ts              # ライブラリAPI
├── cli.js, cli.d.ts                  # CLIエントリーポイント
├── analyze-action-dependencies.js    # メイン解析ロジック
└── lib/                              # コンパイル済みライブラリモジュール
```

## コード構成パターン

### モジュール分割の原則

1. **単一責任の原則**: 各モジュールは1つの明確な責任を持つ
   - `file-finder.ts`: ファイル検索のみ
   - `code-analyzer.ts`: AST生成のみ
   - `dependency-extractor.ts`: 依存関係抽出のみ

2. **依存関係の方向**: 低レベル→高レベルへの依存
   ```
   cli.ts
     ↓
   analyze-action-dependencies.ts
     ↓
   lib/* (各モジュール)
   ```

3. **型定義の集約**: 主要な型定義は`analyze-action-dependencies.ts`で定義し、エクスポート
   - `TargetType`
   - `JavaScriptActionDependency`
   - `ViewDependency`

### ファイル命名規則

- **ソースファイル**: kebab-case（`file-finder.ts`, `code-analyzer.ts`）
- **テストファイル**: `*.test.ts`サフィックス
- **型定義ファイル**: `*.d.ts`（自動生成）

### インポート構成

1. **外部ライブラリ**: 標準ライブラリ → サードパーティライブラリ
   ```typescript
   import * as path from 'path';
   import * as ts from 'typescript';
   import { glob } from 'glob';
   ```

2. **内部モジュール**: 相対パスで明示的にインポート
   ```typescript
   import { findFiles } from './lib/file-finder';
   import { analyzeFile } from './lib/code-analyzer';
   ```

3. **型のみのインポート**: `type`キーワードを使用
   ```typescript
   export type { TargetType, ViewDependency } from './analyze-action-dependencies';
   ```

## 主要アーキテクチャ原則

### 1. パイプライン処理パターン

依存関係解析は、以下のパイプラインで処理されます：

```
ファイル検索 → AST生成 → 依存関係抽出 → グラフ構築 → 結果整形
(file-finder) (code-analyzer) (dependency-extractor) (graph-builder) (result-formatter)
```

各ステージは独立しており、テストや拡張が容易です。

### 2. グラフベースのデータ構造

- **ViewDependencyGraph**: ビューファイル間の依存関係を管理
- **ActionDependencyGraph**: アクションファイル間の依存関係を管理

両グラフクラスは以下の責務を持ちます：
- ファイルの追加と解析
- 依存関係グラフの構築
- 到達可能性分析（直接依存・間接依存の分離）

### 3. エントリーポイント駆動分析

ビュー解析では、エントリーポイント（デフォルト: `pages/**/*.{tsx,jsx,ts,js}`）から到達可能な依存関係のみを報告します。これにより、未使用コンポーネントの誤検出を防ぎます。

### 4. 型安全性の徹底

- `strict: true`モードによる厳格な型チェック
- 明示的な型定義（`TargetType`, `JavaScriptActionDependency`, `ViewDependency`）
- TypeScript Compiler APIの型を活用したAST操作

### 5. テストフィクスチャの実在性

`tests/fixtures/`には、実際のBaseMachinaプロジェクトで使われるようなコード構造を模したサンプルを配置し、現実的なシナリオでテストを実行します。

## コード配置のガイドライン

### 新しい解析機能を追加する場合

1. `lib/`に新しいモジュールを作成（例: `lib/new-analyzer.ts`）
2. 必要に応じて`analyze-action-dependencies.ts`のパイプラインに統合
3. `tests/fixtures/`に対応するテストケースを追加
4. `tests/e2e/`にE2Eテストを追加

### 新しいターゲットタイプを追加する場合

1. `TargetType`型を拡張
2. 対応する依存関係型を定義（例: `NewTargetDependency`）
3. `lib/dependency-extractor.ts`に検出ロジックを追加
4. `cli.ts`にCLIオプションを追加

### 出力形式を拡張する場合

1. `lib/result-formatter.ts`に新しいフォーマット関数を追加
2. `cli.ts`に`--format`オプションを追加（現在はJSON固定）

## npmパッケージ構成

### 公開ファイル (`package.json` の `files`)

```json
{
  "files": [
    "dist",       // コンパイル済みJavaScript・型定義
    "LICENSE",    // ライセンス
    "README.md"   // ドキュメント
  ]
}
```

ソースコード（`lib/`, `*.ts`）は公開されず、`dist/`のみが配布されます。

### バイナリコマンド

```json
{
  "bin": {
    "bm-action-dep-parser": "dist/cli.js"
  }
}
```

npm/npxでインストールすると、`bm-action-dep-parser`コマンドが利用可能になります。
