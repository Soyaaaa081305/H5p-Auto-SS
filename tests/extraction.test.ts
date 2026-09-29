import { describe, it, expect } from "vitest";
import {
  extractContent,
  extractNode,
  markedParts,
  plainText,
} from "../src/lib/extraction";
import { book, activity } from "./fixtures";
describe("shared extraction", () => {
  it("finds nested book answers and video summaries without duplicate traversal", () => {
    const r = extractContent(book, "H5P.InteractiveBook");
    expect(r.answers).toHaveLength(8);
    expect(new Set(r.answers.map((a) => a.id)).size).toBe(8);
    expect(
      r.answers.find((a) => a.library === "H5P.SingleChoiceSet")?.timestamp,
    ).toBe(65);
    expect(
      r.answers.find((a) => a.library === "H5P.Summary")?.parts[0].values,
    ).toEqual(["Conclusion"]);
  });
  it("preserves all correct choices, ordered blanks and alternatives", () => {
    const r = extractContent(book, "H5P.InteractiveBook");
    expect(r.answers[0].parts.map((p) => p.values)).toEqual([
      ["red", "crimson"],
      ["blue"],
    ]);
    expect(r.answers[1].parts.map((p) => p.values)).toEqual([["One"], ["Two"]]);
  });
  it("preserves distinct repeated questions, rejects prefix collisions and future versions", () => {
    const q = activity("H5P.TrueFalse 1.8", { correct: false });
    const r = extractContent(
      {
        questions: [
          q,
          q,
          activity("H5P.TrueFalseCustom 1.8", { correct: true }),
          activity("H5P.TrueFalse 2.0", { correct: true }),
        ],
      },
      "H5P.QuestionSet",
    );
    expect(r.answers.map((a) => a.status)).toEqual([
      "extracted",
      "extracted",
      "unsupported",
      "unsupported",
    ]);
    expect(r.answers[0].parts[0].values).toEqual(["False"]);
  });
  it("does not fabricate false for a missing key", () => {
    expect(
      extractNode({
        path: "$",
        location: "Module",
        library: "H5P.TrueFalse",
        params: {},
      })[0].status,
    ).toBe("missing");
  });
  it("uses correctElements, including images, rather than allowed drop zones", () => {
    const a = extractContent(book, "H5P.InteractiveBook").answers.find(
      (a) => a.library === "H5P.DragQuestion",
    )!;
    expect(a.parts[0].values).toEqual(["Match me", "Image answer"]);
    expect(a.parts[0].images).toEqual(["images/pixel.png"]);
    expect(a.parts[0].target).toEqual({ x: 20, y: 30 });
  });
  it("supports deeply nested unknown wrappers and malformed questions", () => {
    let nested: any = activity("H5P.TrueFalse 1.8", { correct: true });
    for (let i = 0; i < 30; i++) nested = { child: nested };
    expect(
      extractContent(nested, "Custom.Wrapper").answers.some(
        (a) => a.parts[0]?.values[0] === "True",
      ),
    ).toBe(true);
    expect(
      extractContent({ questions: [null, 4] }, "H5P.Blanks").answers.every(
        (a) => a.status === "missing",
      ),
    ).toBe(true);
  });
  it("rejects excessive depth", () => {
    let x: any = {};
    for (let i = 0; i < 140; i++) x = { x };
    expect(() => extractContent(x, "H5P.Column")).toThrow(/limit/);
  });
  it("decodes entities, strips active text, and preserves escaped delimiters", () => {
    expect(plainText("<script>evil()</script><p>A &amp; B</p>")).toBe("A & B");
    expect(
      markedParts("Use *a\\/b/c* and \\*literal\\*", true).parts[0].values,
    ).toEqual(["a/b", "c"]);
  });
  it("reports partial answers and marks missing transcripts honestly", () => {
    const r = extractContent({ questions: ["*ok* and **"] }, "H5P.Blanks");
    expect(r.answers[0].parts).toHaveLength(2);
    expect(r.answers[0].status).toBe("partial");
    const video = extractContent(
      { interactiveVideo: { video: { files: [] } } },
      "H5P.InteractiveVideo",
    );
    expect(video.videoNotes[0].text).toMatch(/No packaged transcript/);
  });
});
