import * as core from "@actions/core";
import { writeFile } from 'fs';
import { getContent, createOrUpdateContent } from "../io/github";
import { MetricsContext, ReleaseYear } from "../types";
import { generatePage } from "./page";

export async function updateTemplate(
  context: MetricsContext,
  releases: ReleaseYear
) {
  const { existingSha } = await getContent(context, "index.html");

  const template = await generatePage(releases, context);

  core.info(`Generated page successfully`);

  if (process.env.NODE_ENV  === "development") {
    // console.log(template);
    writeFile('./dist/index.html', template, () => {});
  } else {
    await createOrUpdateContent(context, "index.html", template, existingSha);
  }


  core.info(`Updated page successfully`);
}
