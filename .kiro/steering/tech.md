# 技術スタック

## アーキテクチャ

`bm-action-dep-parser`は、TypeScriptで実装された静的解析ツールです。TypeScriptコンパイラAPI（`typescript`パッケージ）を使用して、JavaScriptおよびTypeScriptコードの抽象構文木（AST）を解析し、アクション呼び出しパターンを検出します。

### コアコンポーネント

1. **CLIインターフェース** (`cli.ts`): ユーザーからの入力を受け付け、解析処理を起動
2. **ファイル検索** (`lib/file-finder.ts`): 対象ディレクトリ内のファイルを`glob`パターンで検索
3. **コード解析** (`lib/code-analyzer.ts`): TypeScript Compiler APIを使用してASTを生成
4. **依存関係抽出** (`lib/dependency-extractor.ts`): ASTを走査してアクション呼び出しを検出
5. **依存関係グラフ構築** (`lib/dependency-graph-builder.ts`, `lib/action-dependency-graph-builder.ts`): ファイル間の依存関係グラフを構築
6. **エントリーポイント解析** (`lib/entry-point-analyzer.ts`): エントリーポイントから到達可能な依存関係を分析
7. **結果フォーマット** (`lib/result-formatter.ts`): 解析結果をJSON形式に整形

## 言語とランタイム

- **言語**: TypeScript 5.8.3
- **ターゲット**: ES2020
- **モジュールシステム**: NodeNext（ESM互換）
- **Nodeバージョン要件**: >=22.14.0

## 主要依存関係

### プロダクション依存関係

```json
{
  "glob": "^11.0.1",      // ファイルパターンマッチング
  "typescript": "^5.8.3"  // TypeScript Compiler API（AST解析用）
}
```

### 開発依存関係

```json
{
  "@types/glob": "^8.1.0",
  "@types/jest": "^29.5.14",
  "@types/node": "^22.14.1",
  "jest": "^29.7.0",        // テストフレームワーク
  "ts-jest": "^29.3.2",     // TypeScript用Jestプリセット
  "ts-node": "^10.9.2"      // TypeScript直接実行
}
```

## 開発環境

### 必須ツール

- Node.js >= 22.14.0
- npm または pnpm（推奨）

### 推奨エディタ設定

- TypeScript LSP対応エディタ（VSCode、Neovim、Emacsなど）
- `tsconfig.json`の`strict: true`により厳格な型チェックが有効

## よく使うコマンド

### 開発コマンド

```bash
# TypeScriptコンパイル
npm run build

# ローカルでの実行（ts-node使用）
npm run analyze action ./packages/actions/js
npm run analyze view ./packages/views

# 直接実行（開発用）
npm start action ./packages/actions/js
```

### テストコマンド

```bash
# 全テスト実行
npm test

# E2Eテストのみ実行
npm run test:e2e
```

### パッケージ公開

```bash
# 公開前にビルドを自動実行（prepublishOnlyフック）
npm publish
```

### ツール使用（npx経由）

```bash
# インストール不要で実行
npx @basemachina/bm-action-dep-parser action ./path/to/actions
npx @basemachina/bm-action-dep-parser view ./path/to/views --entry-point-patterns "pages/*.tsx"
```

## 環境変数

現在、環境変数は使用していません。すべての設定はCLI引数で指定します。

## ビルド設定

### TypeScriptコンパイラ設定 (`tsconfig.json`)

- **outDir**: `dist/` - コンパイル済みファイルの出力先
- **rootDir**: `.` - ソースコードのルートディレクトリ
- **declaration**: `true` - 型定義ファイル（`.d.ts`）を生成
- **sourceMap**: `true` - デバッグ用のソースマップを生成
- **strict**: `true` - 厳格な型チェックを有効化
- **moduleResolution**: `NodeNext` - Node.jsのESMモジュール解決を使用

### パッケージエントリーポイント

- **main**: `dist/index.js` - プログラムAPIのエントリーポイント
- **types**: `dist/index.d.ts` - TypeScript型定義
- **bin**: `dist/cli.js` - CLIコマンドのエントリーポイント（`bm-action-dep-parser`コマンド）

## テスト戦略

- **フレームワーク**: Jest
- **テスト種別**: E2Eテスト（`tests/e2e/`）
- **フィクスチャ**: `tests/fixtures/`に実際のアクション・ビューファイルのサンプルを配置

## アーキテクチャ上の重要な決定事項

### 1. TypeScript Compiler API使用の理由
正規表現ではなくASTベースの解析により、コメント内や文字列内の誤検出を防ぎ、高精度な依存関係検出を実現。

### 2. ファイルシステムベースの解析
実行時の動的な振る舞いではなく、静的コード解析により、ビルド時やCI/CDパイプラインでの利用を想定。

### 3. JSONのみの出力形式
機械可読性を重視し、他のツールとの統合を容易にするためJSON形式を標準出力。テキスト形式は将来的な拡張として検討可能。

### 4. エントリーポイントパターンのデフォルト設定
`pages/**/*.{tsx,jsx,ts,js}`をデフォルトとし、一般的なNext.js風のディレクトリ構造を想定。カスタマイズ可能にすることで柔軟性を確保。
