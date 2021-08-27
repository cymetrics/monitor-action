import * as core from "@actions/core";
import {
  createOrUpdateContent,
  getContent,
  getContext,
  createOrUpdateRelease,
} from "./io/github";
import {
  getJobTiming
} from "./io/actions";
import { MetricsData, MetricsContext } from "./types";
import { updateTemplate } from "./template/updateTemplate";

const createOrUpdateMetrics = async (
  serializedData: string,
  key: string,
  value: string,
  type: string,
  releaseId: string,
  context: MetricsContext,
  path: string,
  existingSha: string
) => {
  let data: MetricsData;
  let mixValue: string = value;
  if (!serializedData) {
    core.info(`Saving new metrics for key "${key}"`);
    data = { key, type: "scalar", values: [] };
  } else {
    core.info(`Extending existing metrics for "${key}"`);
    data = JSON.parse(serializedData);
  }

  if (type === 'job') {
    mixValue = (await getJobTiming(context, { jobId: value })).value;
  }

  if (mixValue) {
    data.values.push({
      value: Number.parseFloat(mixValue),
      releaseId,
    });
  
    await createOrUpdateContent(context, path, JSON.stringify(data), existingSha);
  }

  return data;
};

export async function runAction() {
  // Get 
  try {
    const context = getContext();
    const key = core.getInput("key") || process.env.key;
    const value = core.getInput("value") || process.env.value;
    const type = core.getInput("type") || process.env.type;
    if (!key || Number.isNaN(Number.parseFloat(value))) {
      throw new Error(
        `Invalid arguments delivered: (key=${key}, value=${value})`
      );
    }
    const path = `data/values/${new Date().getUTCFullYear()}/${key}.json`;

    const [
      { releaseId, releaseYear },
      { serializedData, existingSha },
    ] = await Promise.all([
      createOrUpdateRelease(context),
      getContent(context, path),
    ]);

    await createOrUpdateMetrics(
      serializedData,
      key,
      value,
      type,
      releaseId,
      context,
      path,
      existingSha
    );
    await updateTemplate(context, releaseYear);

    core.info("Finished processing new metrics");
  } catch (err) {
    core.setFailed(err.message);
  }
}
