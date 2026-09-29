import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { readArchive } from "../src/lib/archive";
const paths = process.env.H5P_SAMPLE_FILES?.split("|") || [];
it.skipIf(paths.length !== 2)(
  "recovers the expected original lab answers",
  async () => {
    const [a, b] = await Promise.all(
      paths.map(async (p) => readArchive(await readFile(p), "local.h5p")),
    );
    expect(
      a.report.answers
        .filter((x) => x.library === "H5P.Blanks")
        .flatMap((x) => x.parts),
    ).toHaveLength(3);
    expect(
      a.report.answers
        .filter((x) => x.library === "H5P.DragText")
        .flatMap((x) => x.parts),
    ).toHaveLength(6);
    expect(
      a.report.answers.filter((x) => x.library === "H5P.MultiChoice"),
    ).toHaveLength(1);
    expect(
      b.report.answers.filter((x) => x.library === "H5P.SingleChoiceSet"),
    ).toHaveLength(2);
    expect(
      b.report.answers.filter((x) => x.library === "H5P.Summary"),
    ).toHaveLength(2);
    expect(
      b.report.answers.filter((x) => x.library === "H5P.MultiChoice"),
    ).toHaveLength(1);
    expect(
      b.report.answers
        .filter((x) => x.library === "H5P.DragQuestion")
        .flatMap((x) => x.parts),
    ).toHaveLength(5);
    expect(
      [...a.report.answers, ...b.report.answers]
        .filter((x) => x.status !== "extracted")
        .map((x) => ({
          library: x.library,
          status: x.status,
          parts: x.parts.map((p) => p.values.length),
        })),
    ).toEqual([{ library: "H5P.Summary", status: "missing", parts: [0] }]);
  },
  30000,
);
