import { safeLoad } from "js-yaml";
import * as github from "@actions/github";
import { Config, MetricsContext } from "../../types";
import { getContent } from "../../io/github";

const CONFIG_PATH = ".github/monitor-action/config.yml";

export const importConfig = async (
  context: MetricsContext
): Promise<Config> => {
  const branch = github.context.ref;
  const { existingSha, serializedData } = await getContent(
    { ...context, ...{ branch } },
    CONFIG_PATH
  );
  if (!existingSha) {
    throw new Error(`No config provided at ${CONFIG_PATH} on ${branch}`);
  }
  let res = null;
  if (process.env.NODE_ENV === "development") {
    // fake data
    res = {
      groups: {
        ["General"]: {
          metrics: ["code-size", "key-b"],
          name: "General",
          description: "Desc",
        },
        ["Other"]: {
          metrics: ["key-b"],
          name: "Other",
        },
      },
      metrics: {
        ["code-size"]: { description: "Code Size" },
        ["key-b"]: {},
      },
    };
  } else {
    res = await safeLoad(serializedData);
  }

  if (
    !Object.keys(res).find((n) => n === "metrics") ||
    !Object.keys(res).find((n) => n === "groups")
  ) {
    throw new Error("Configuration is missing metrics or groups on root level");
  }
  return res as any;
};
