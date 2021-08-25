import * as dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import { safeDump } from "js-yaml";
import { prepareMocks } from "../utils/mocks";
import * as core from "../utils/actions-core";
import * as github from "../utils/actions-github";
import { mockAnswer } from "../utils/actions-github";
import { ReleaseYear, Config, MetricsData } from "../../src/model";
import { writePageIntoDom, assertSnapshot } from "../utils/test";

dayjs.extend(localizedFormat);

const context = {
  branch: "master",
  releaseId: "rel-a",
  owner: "floric",
  repo: "repo",
  token: "token",
};

describe("Report", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.setTimeout(10000);
  });

  it("Renders first time correctly", async () => {
    // given
    prepareMocks(core, github);
    const year: ReleaseYear = {
      releases: [],
      year: 2020,
    };

    // when
    await writePageIntoDom(year, context);

    // then
    await assertSnapshot({ width: 1024, height: 1024 });
  });

  it("Renders correctly", async () => {
    // given
    prepareMocks(core, {
      ...github,
      ...{
        getOctokit: () => ({
          repos: {
            ...github.getOctokit().repos,
            ...mockAnswer([
              {
                key: `data/values/2020/key-a.json`,
                content: JSON.stringify({
                  key: "key-a",
                  type: "scalar",
                  values: [
                    { releaseId: "rel-a", value: 2 },
                    { releaseId: "rel-b", value: 1 },
                    { releaseId: "rel-x", value: -1 },
                    { releaseId: "rel-y", value: -2 },
                    { releaseId: "rel-z", value: -3 },
                  ],
                } as MetricsData),
              },
              {
                key: `data/values/2020/key-b.json`,
                content: JSON.stringify({
                  key: "key-b",
                  type: "scalar",
                  values: [
                    { releaseId: "rel-a", value: 1 },
                    { releaseId: "rel-b", value: 1 },
                  ],
                } as MetricsData),
              },
              {
                key: `data/releases/2020/releases.json`,
                content: JSON.stringify(year),
              },
              {
                key: ".github/repo-monitor-action/config.yml",
                content: safeDump({
                  groups: {
                    ["General"]: {
                      metrics: ["key-a", "key-b"],
                      name: "General",
                      description: "Desc",
                    },
                    ["Other"]: {
                      metrics: ["key-b"],
                      name: "Other",
                    },
                  },
                  metrics: {
                    ["key-a"]: { description: "Key A" },
                    ["key-b"]: {},
                  },
                } as Config),
              },
            ]),
          },
        }),
      },
    });
    const year: ReleaseYear = {
      releases: [
        { id: "rel-a", timestamp: 1 },
        { id: "rel-b", timestamp: 2 },
        { id: "rel-x", timestamp: 6 },
        { id: "rel-y", timestamp: 7 },
        { id: "rel-z", timestamp: 8 },
      ],
      year: 2020,
    };

    // when
    await writePageIntoDom(year, context);

    // then
    await assertSnapshot({ width: 1024, height: 2048 });
  });

  it("Renders many releases correctly", async () => {
    // given
    const ids = new Array(40).fill(0).map((_, i) => i);
    const year: ReleaseYear = {
      releases: ids.map((i) => ({ id: `rel-${i}`, timestamp: i })),
      year: 2020,
    };
    prepareMocks(core, {
      ...github,
      ...{
        getOctokit: () => ({
          repos: {
            ...github.getOctokit().repos,
            ...mockAnswer([
              {
                key: `data/values/2020/key-a.json`,
                content: JSON.stringify({
                  key: "key-a",
                  type: "scalar",
                  values: ids.map((i) => ({ releaseId: `rel-${i}`, value: i })),
                } as MetricsData),
              },
              {
                key: `data/releases/2020/releases.json`,
                content: JSON.stringify(year),
              },
              {
                key: ".github/repo-monitor-action/config.yml",
                content: safeDump({
                  metrics: {
                    ["key-a"]: { description: "Key A" },
                  },
                  groups: {
                    ["general"]: {
                      name: "General",
                      metrics: ["key-a"],
                      description: "Desc",
                    },
                  },
                } as Config),
              },
            ]),
          },
        }),
      },
    });

    // when
    await writePageIntoDom(year, context);

    // then
    await assertSnapshot({ width: 1024, height: 2048 });
  });
});
