import { ViewDependency, JavaScriptActionDependency } from '../analyze-action-dependencies';

/**
 * フィルタリング結果を表す型
 */
export interface FilterResult<T> {
  /** フィルタリングされた依存関係 */
  filtered: T;
  /** 警告メッセージ（標準エラー出力用） */
  warnings: string[];
}

/**
 * ビュー依存関係をアクション識別子でフィルタリング
 * @param dependencies 全ビュー依存関係
 * @param actionIdentifiers フィルタ対象のアクション識別子
 * @returns フィルタされたビュー依存関係と警告メッセージ
 */
export function filterViewDependencies(
  dependencies: ViewDependency[],
  actionIdentifiers: string[]
): FilterResult<ViewDependency[]> {
  const warnings: string[] = [];
  const identifierSet = new Set(actionIdentifiers);

  // 全依存関係から存在するアクション識別子を収集
  const allActionIds = new Set<string>();
  for (const dep of dependencies) {
    for (const actionId of dep.dependencies.direct) {
      allActionIds.add(actionId);
    }
    for (const indirectActions of Object.values(dep.dependencies.indirect)) {
      for (const actionId of indirectActions) {
        allActionIds.add(actionId);
      }
    }
  }

  // 存在しないアクション識別子について警告を生成
  for (const identifier of identifierSet) {
    if (!allActionIds.has(identifier)) {
      warnings.push(`Warning: Action identifier '${identifier}' not found in dependency graph`);
    }
  }

  // フィルタリング: 指定されたアクションに依存するビューのみを抽出
  const filtered: ViewDependency[] = [];
  for (const dep of dependencies) {
    // 直接依存をフィルタ
    const matchingDirect = dep.dependencies.direct.filter(actionId => identifierSet.has(actionId));

    // 間接依存をフィルタ
    const matchingIndirect: Record<string, string[]> = {};
    for (const [file, actions] of Object.entries(dep.dependencies.indirect)) {
      const matchingActions = actions.filter(actionId => identifierSet.has(actionId));
      if (matchingActions.length > 0) {
        matchingIndirect[file] = matchingActions;
      }
    }

    // いずれかに依存している場合、結果に含める
    if (matchingDirect.length > 0 || Object.keys(matchingIndirect).length > 0) {
      filtered.push({
        entrypoint: dep.entrypoint,
        dependencies: {
          direct: matchingDirect,
          indirect: matchingIndirect
        }
      });
    }
  }

  // 結果が空の場合の警告
  if (filtered.length === 0 && identifierSet.size > 0) {
    warnings.push('No dependencies found for the specified action identifier(s)');
  }

  return {
    filtered,
    warnings
  };
}

/**
 * アクション依存関係をアクション識別子でフィルタリング
 * @param dependencies 全アクション依存関係
 * @param actionIdentifiers フィルタ対象のアクション識別子
 * @returns フィルタされたアクション依存関係と警告メッセージ
 */
export function filterActionDependencies(
  dependencies: JavaScriptActionDependency[],
  actionIdentifiers: string[]
): FilterResult<JavaScriptActionDependency[]> {
  const warnings: string[] = [];
  const identifierSet = new Set(actionIdentifiers);

  // 全依存関係から存在するアクション識別子を収集
  const allActionIds = new Set<string>();
  for (const dep of dependencies) {
    for (const actionId of dep.dependencies.direct) {
      allActionIds.add(actionId);
    }
    for (const indirectActions of Object.values(dep.dependencies.indirect)) {
      for (const actionId of indirectActions) {
        allActionIds.add(actionId);
      }
    }
  }

  // フィルタ対象のアクション自身がエントリーポイントとして存在するか確認
  for (const dep of dependencies) {
    const actionName = dep.entrypoint.replace(/\.(js|ts)$/, '').split('/').pop();
    if (actionName && identifierSet.has(actionName)) {
      allActionIds.add(actionName);
    }
  }

  // 存在しないアクション識別子について警告を生成
  for (const identifier of identifierSet) {
    if (!allActionIds.has(identifier)) {
      warnings.push(`Warning: Action identifier '${identifier}' not found in dependency graph`);
    }
  }

  // フィルタリング: 指定されたアクションに依存するアクション、または指定されたアクション自身を抽出
  const filtered: JavaScriptActionDependency[] = [];
  for (const dep of dependencies) {
    // フィルタ対象のアクション自身かチェック
    const actionName = dep.entrypoint.replace(/\.(js|ts)$/, '').split('/').pop();
    const isTargetAction = actionName && identifierSet.has(actionName);

    // 直接依存をフィルタ
    const matchingDirect = dep.dependencies.direct.filter(actionId => identifierSet.has(actionId));

    // 間接依存をフィルタ
    const matchingIndirect: Record<string, string[]> = {};
    for (const [file, actions] of Object.entries(dep.dependencies.indirect)) {
      const matchingActions = actions.filter(actionId => identifierSet.has(actionId));
      if (matchingActions.length > 0) {
        matchingIndirect[file] = matchingActions;
      }
    }

    // ターゲットアクション自身、またはいずれかに依存している場合、結果に含める
    if (isTargetAction || matchingDirect.length > 0 || Object.keys(matchingIndirect).length > 0) {
      filtered.push({
        entrypoint: dep.entrypoint,
        dependencies: {
          direct: matchingDirect,
          indirect: matchingIndirect
        }
      });
    }
  }

  // 結果が空の場合の警告
  if (filtered.length === 0 && identifierSet.size > 0) {
    warnings.push('No dependencies found for the specified action identifier(s)');
  }

  return {
    filtered,
    warnings
  };
}
