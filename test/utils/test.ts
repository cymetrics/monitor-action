import { generateImage } from "jsdom-screenshot";
import { ReleaseYear, MetricsContext } from "../../src/model";

const snapshotOpts = {
  failureThreshold: 0.01,
  failureThresholdType: "percent",
};

export const writePageIntoDom = async (
  year: ReleaseYear,
  context: MetricsContext
) => {
  const page = await require("../../src/template/page").generatePage(
    year,
    context
  );
  document.getElementsByTagName("html")[0].innerHTML = page;
};

export const assertSnapshot = async (opts?: {
  width: number;
  height: number;
}) => {
  const screenshot = await generateImage({
    viewport: { width: opts?.width || 1024, height: opts?.height || 1024 },
  });
  (expect(screenshot) as any).toMatchImageSnapshot(snapshotOpts);
};
