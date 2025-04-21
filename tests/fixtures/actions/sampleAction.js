import { executeAction } from "@basemachina/action";

/** @type { import("@basemachina/action").Handler } */
export default async (
  // 第1引数からパラメーターの値を取得できます
  args,
  // 第2引数からログインユーザーの情報や環境ごとの変数・シークレットの値を取得できます
  { currentUser, vars, secrets },
) => {
  const listUsersResults = await executeAction("bm-onboarding-list-users");

  // executeActionが成功した場合は、successに結果の値が入ります
  const firstUserId = String(listUsersResults[0].success[0].id);

  const getFirstUserResults = await executeAction("bm-onboarding-get-user", {
    id: firstUserId,
  });

  // executeActionの実行中にエラーが発生した場合は、failureにエラーの値が入ります
  if (getFirstUserResults[0].failure) {
    // Errorをthrowすると、実行結果にエラーメッセージを表示できます
    await executeAction("post-to-slack", {
      channel: "#test",
      text: `ユーザーの詳細取得に失敗しました: ${getFirstUserResults[0].failure.message}`,
    });
    throw new Error(
      `ユーザーの詳細取得に失敗しました: ${getFirstUserResults[0].failure.message}`,
    );
  }

  // 関数の戻り値がアクションの結果の値になります
  return getFirstUserResults[0].success;
};