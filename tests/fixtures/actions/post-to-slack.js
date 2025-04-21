import { ResultError, executeAction, wait } from "@basemachina/action";

const maxRetryCount = 3;

const generateMentionText = async (email: string): Promise<string> => {
  const results: ExecActionResult[] = await executeAction(
    "lookup-slack-user-by-email",
    {
      email,
    },
  );
  const userId = (() => {
    if (!results[0].success?.ok) {
      return null;
    }
    return results[0].success.user.id;
  })();
  return userId !== null ? `<@${userId}>` : email;
};

type ExecActionResult = {
  success?: LookupSlackUserOKResult | LookupSlackUserNGResult;
  failure?: unknown;
};

type LookupSlackUserOKResult = {
  ok: true;
  user: SlackUser;
};

type LookupSlackUserNGResult = {
  ok: false;
  error: string;
};

type SlackUser = {
  id: string;
};

type HandlerArguments = {
  email: string;
  channel: string;
  text: string;
};

/**
 * Slackメンション送信のハンドラー関数
 */
export default async (args: HandlerArguments) => {
  const errorMessages: string[] = [];

  for (let retryCount = 0; retryCount < maxRetryCount; retryCount++) {
    try {
      const text = [
        retryCount > 0 ? `（通知エラーのため再送: ${retryCount}回目）` : null,
        args.text,
        args.email !== "" ? await generateMentionText(args.email) : null,
      ]
        .filter((i) => i !== null)
        .join("\n");

      const postMessageResults = await executeAction("post-slack-message", {
        channel: args.channel,
        text,
      });

      if (postMessageResults[0].failure) {
        throw new Error(JSON.stringify(postMessageResults[0].failure));
      }
      return postMessageResults[0].success;
    } catch (error) {
      errorMessages.push(String(error));
      await wait(1000);
    }
  }

  throw new ResultError({
    message: "Slackのメッセージ送信に失敗しました",
    error: errorMessages,
  });
};
