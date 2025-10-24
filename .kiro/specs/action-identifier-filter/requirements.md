# Requirements Document

## Introduction

`bm-action-dep-parser`に、アクション識別子による依存関係のフィルタリング機能を追加します。この機能により、開発者は特定のアクションに関連するビューやJavaScriptアクションのみを抽出でき、大規模プロジェクトにおける変更影響範囲の分析やリファクタリング作業が効率化されます。

### ビジネス価値
- **変更影響範囲の高速特定**: 特定アクションの変更時に影響を受けるコンポーネントを即座に把握
- **リファクタリング効率化**: 不要なノイズを排除し、関連コンポーネントのみに集中可能
- **CI/CDパイプライン最適化**: 変更されたアクションに依存するテスト対象を絞り込み、テスト時間を短縮

## Requirements

### Requirement 1: アクション識別子によるフィルタリング機能
**Objective:** 開発者として、特定のアクション識別子を指定して依存関係解析結果をフィルタしたい。それにより、関心のあるアクションに関連するビューやアクションのみを抽出できる。

#### Acceptance Criteria

1. WHEN ユーザーが`--filter-action`オプションでアクション識別子を指定 THEN `bm-action-dep-parser`はそのアクションに依存するビューとアクションのみを出力結果に含める
2. WHEN ユーザーが`--filter-action`オプションでアクション識別子を指定 AND そのアクションが依存グラフに存在しない THEN `bm-action-dep-parser`は空の結果配列とともに警告メッセージを標準エラー出力に表示する
3. WHEN ユーザーが複数のアクション識別子を指定（カンマ区切り） THEN `bm-action-dep-parser`は指定されたすべてのアクションに依存するビューとアクションを出力結果に含める
4. WHEN ユーザーが`--filter-action`オプションを指定しない THEN `bm-action-dep-parser`は従来通りすべての依存関係を出力する

### Requirement 2: ビュー解析におけるフィルタリング対応
**Objective:** 開発者として、ビュー依存関係解析時にアクション識別子でフィルタしたい。それにより、特定アクションを使用するビューコンポーネントのみを特定できる。

#### Acceptance Criteria

1. WHEN ユーザーが`analyze view`コマンドに`--filter-action`オプションを指定 THEN `bm-action-dep-parser`は指定されたアクションを直接または間接的に使用するビューファイルのみを結果に含める
2. WHEN フィルタされたビュー結果が出力される THEN 各ビューの`dependencies`配列には指定されたアクションへの依存パスが含まれる
3. IF ビューが複数のアクションに依存し AND その一部のみがフィルタ条件に一致する THEN そのビューは結果に含まれ、一致したアクションの依存関係のみが`dependencies`配列に表示される

### Requirement 3: アクション解析におけるフィルタリング対応
**Objective:** 開発者として、アクション依存関係解析時にアクション識別子でフィルタしたい。それにより、特定アクションに依存する他のJavaScriptアクションを特定できる。

#### Acceptance Criteria

1. WHEN ユーザーが`analyze action`コマンドに`--filter-action`オプションを指定 THEN `bm-action-dep-parser`は指定されたアクションを直接または間接的に呼び出すアクションファイルのみを結果に含める
2. WHEN フィルタされたアクション結果が出力される THEN 各アクションの`dependencies`配列には指定されたアクションへの依存パスが含まれる
3. IF フィルタ対象のアクション自身が解析対象ディレクトリに含まれる THEN そのアクションファイル自体も結果に含まれ、他のアクションからの依存が表示される

### Requirement 4: JSON出力形式の維持
**Objective:** 開発者として、フィルタリング機能追加後も既存のJSON出力形式を維持したい。それにより、既存のパーサーやスクリプトが引き続き動作する。

#### Acceptance Criteria

1. WHEN `--filter-action`オプションが指定された THEN JSON出力形式は従来と同じ配列形式を維持する
2. WHEN `--filter-action`オプションが指定されていない THEN JSON出力は完全に従来と同一である
3. WHERE フィルタリングが適用される THE 出力配列にはフィルタ条件に一致するエントリーのみが含まれる

### Requirement 5: エラーハンドリングとユーザーフィードバック
**Objective:** 開発者として、フィルタリング時のエラーや警告を明確に理解したい。それにより、誤った入力や期待外の結果の原因を迅速に把握できる。

#### Acceptance Criteria

1. WHEN ユーザーが存在しないアクション識別子でフィルタを指定 THEN `bm-action-dep-parser`は標準エラー出力に「Warning: Action identifier '[identifier]' not found in dependency graph」というメッセージを表示する
2. WHEN フィルタリング結果が空（該当する依存関係が存在しない） THEN `bm-action-dep-parser`は標準エラー出力に「No dependencies found for the specified action identifier(s)」というメッセージを表示する
3. WHEN `--filter-action`オプションの引数が空文字列または無効な形式 THEN `bm-action-dep-parser`はエラーメッセージを表示し、終了コード1で終了する
4. IF 複数のアクション識別子指定時に一部のみが存在する THEN `bm-action-dep-parser`は存在しない識別子について警告を表示し、存在する識別子についてはフィルタリングを実行する

### Requirement 6: 後方互換性の維持
**Objective:** 既存ユーザーとして、新機能追加後も既存のCLIインターフェースとJSON出力形式が変更されないことを期待する。それにより、既存のスクリプトやCI/CDパイプラインが引き続き動作する。

#### Acceptance Criteria

1. WHEN ユーザーが`--filter-action`オプションを使用しない THEN `bm-action-dep-parser`の出力形式と動作は既存バージョンと完全に同一である
2. WHEN 既存の全オプション（`--entry-point-patterns`等）が使用される THEN それらは`--filter-action`と組み合わせて正常に動作する
3. WHERE 既存のプログラムAPIが存在する THE 新しいフィルタリング機能はオプショナルなパラメータとして追加され、既存の関数シグネチャは変更されない
