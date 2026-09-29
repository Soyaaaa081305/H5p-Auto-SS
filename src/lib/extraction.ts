import { decodeHTML } from "entities";
import type {
  AnswerItem,
  AnswerPart,
  ContentNode,
  ExtractionReport,
} from "../types/h5p";

export const plainText = (value: unknown): string =>
  typeof value === "string"
    ? decodeHTML(
        value
          .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
          .replace(/<br\s*\/?\s*>|<\/p>|<\/div>/gi, "\n")
          .replace(/<[^>]*>/g, ""),
      ).trim()
    : "";
const list = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const record = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const versions: Record<string, [number, number]> = {
  "H5P.Blanks": [1, 14],
  "H5P.DragText": [1, 10],
  "H5P.DragQuestion": [1, 15],
  "H5P.MultiChoice": [1, 16],
  "H5P.TrueFalse": [1, 8],
  "H5P.SingleChoiceSet": [1, 11],
  "H5P.Summary": [1, 10],
  "H5P.MarkTheWords": [1, 11],
};
const containers = new Set([
  "H5P.InteractiveBook",
  "H5P.Column",
  "H5P.CoursePresentation",
  "H5P.QuestionSet",
  "H5P.InteractiveVideo",
  "H5P.BranchingScenario",
  "H5P.ImageSlider",
  "H5P.ImageSlide",
  "H5P.Accordion",
]);
const passive = new Set([
  "H5P.Image",
  "H5P.Text",
  "H5P.AdvancedText",
  "H5P.Video",
  "H5P.Audio",
  "H5P.Link",
  "H5P.Table",
]);

// H5P uses escaped delimiters inside asterisk-marked answers.
function splitEscaped(value: string, delimiter: string): string[] {
  const out = [""];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "\\" && i + 1 < value.length) {
      out[out.length - 1] += value[i] + value[++i];
    } else if (value[i] === delimiter) out.push("");
    else out[out.length - 1] += value[i];
  }
  return out;
}
const unescape = (s: string) => s.replace(/\\([\\*/:+-])/g, "$1");
export function markedParts(
  text: string,
  alternatives = false,
): { prompt: string; parts: AnswerPart[] } {
  const parts: AnswerPart[] = [];
  const prompt = text.replace(
    /(?<!\\)\*((?:\\.|[^*\\])*)\*/g,
    (_match, raw: string) => {
      const solution = splitEscaped(raw.split(/(?<!\\)[+-]:/)[0], ":")[0];
      const values = (alternatives ? splitEscaped(solution, "/") : [solution])
        .map((s) => plainText(unescape(s)))
        .filter(Boolean);
      parts.push({ label: `Blank ${parts.length + 1}`, values });
      return ` [${parts.length}] `;
    },
  );
  return { prompt: plainText(unescape(prompt)), parts };
}

type Draft = { prompt: string; parts: AnswerPart[]; explanation?: string };
type Adapter = (p: Record<string, any>) => Draft[];
const adapters: Record<string, Adapter> = {
  "H5P.Blanks": (p) =>
    list(p.questions).map((q) =>
      typeof q === "string"
        ? markedParts(q, true)
        : { prompt: "Malformed blank question", parts: [] },
    ),
  "H5P.DragText": (p) => [
    markedParts(typeof p.textField === "string" ? p.textField : ""),
  ],
  "H5P.MarkTheWords": (p) => [
    {
      ...markedParts(typeof p.textField === "string" ? p.textField : ""),
      prompt: plainText(p.taskDescription || p.textField),
    },
  ],
  "H5P.MultiChoice": (p) => [
    {
      prompt: plainText(p.question || p.text),
      parts: list(p.answers)
        .filter((a) => record(a) && a.correct === true)
        .map((a, i) => ({
          label: `Correct option ${i + 1}`,
          values: [plainText(a.text)].filter(Boolean),
        })),
    },
  ],
  "H5P.TrueFalse": (p) => [
    {
      prompt: plainText(p.question),
      parts: [true, false, "true", "false"].includes(p.correct)
        ? [
            {
              label: "Answer",
              values: [
                String(p.correct).toLowerCase() === "true" ? "True" : "False",
              ],
            },
          ]
        : [],
    },
  ],
  "H5P.SingleChoiceSet": (p) =>
    list(p.choices).map((c) => ({
      prompt: plainText(c?.question),
      parts: [
        {
          label: "Answer",
          values: [plainText(list(c?.answers)[0])].filter(Boolean),
        },
      ],
    })),
  "H5P.Summary": (p) => {
    const rawSummaries = list(p.summaries || p.summary || p.statements);
    const intro = plainText(p.intro || p.question || p.taskDescription) || "Choose the correct statement";

    if (!rawSummaries.length) {
      return [
        {
          prompt: intro,
          parts: [{ label: "Correct statement", values: [] }],
          explanation:
            "This summary question was left blank by the author (no statements were created in this module).",
        },
      ];
    }

    return rawSummaries.map((s) => {
      let stList: any[] = [];
      if (Array.isArray(s)) {
        stList = s;
      } else if (record(s)) {
        stList = list(s.summary || s.statements || s.options || s.answers || s.choices);
        if (!stList.length) {
          const single = s.statement || s.text || s.label;
          if (single) stList = [single];
        }
      } else if (typeof s === "string") {
        stList = [s];
      }

      let correctVal = "";
      if (stList.length > 0) {
        const first = stList[0];
        if (typeof first === "string") {
          correctVal = plainText(first);
        } else if (record(first)) {
          correctVal = plainText(
            first.text || first.statement || first.label || first.summary || first.answer,
          );
        }
      }

      const prompt = (record(s) && plainText(s.tip || s.intro || s.question)) || intro;

      return {
        prompt,
        parts: [
          {
            label: "Correct statement",
            values: correctVal ? [correctVal] : [],
          },
        ],
        explanation: !correctVal
          ? "This summary question was left blank by the author (no statements were created in this module)."
          : undefined,
      };
    });
  },
  "H5P.DragQuestion": (p) => {
    const task = p.question?.task;
    const elements = list(task?.elements);
    return [
      {
        prompt:
          plainText(p.taskDescription) ||
          "Match each item to its numbered target",
        parts: list(task?.dropZones).map((z, i) => {
          const refs = list(z?.correctElements);
          const matches = refs.map((id) =>
            /^(0|[1-9]\d*)$/.test(String(id))
              ? elements[Number(id)]
              : undefined,
          );
          const invalid = matches.some((e) => !record(e));
          const values = matches
            .map((e) =>
              plainText(e?.type?.params?.text || e?.type?.params?.alt),
            )
            .filter(Boolean);
          const images = matches
            .map((e) => e?.type?.params?.file?.path)
            .filter((s): s is string => typeof s === "string");
          return {
            label: `Target ${i + 1}${plainText(z?.label) ? ` (${plainText(z.label)})` : ""}`,
            values: invalid ? [] : [...new Set(values)],
            images: invalid ? [] : [...new Set(images)],
            target: { x: Number(z?.x) || 0, y: Number(z?.y) || 0 },
          };
        }),
      },
    ];
  },
};

export function extractNode(node: ContentNode, packageName = ""): AnswerItem[] {
  if (containers.has(node.library) || passive.has(node.library)) return [];
  const base = {
    packageName,
    sourcePath: node.path,
    library: node.library,
    version: node.version,
    location: node.location,
    timestamp: node.timestamp,
  };
  const supported = versions[node.library];
  const [major, minor] = (node.version || "").split(".").map(Number);
  if (
    !adapters[node.library] ||
    (node.version &&
      (!supported || major !== supported[0] || minor > supported[1]))
  ) {
    return [
      {
        ...base,
        id: node.path,
        prompt:
          plainText(
            node.params.question ||
              node.params.taskDescription ||
              node.params.title,
          ) || node.library,
        parts: [],
        status: "unsupported",
        explanation:
          "This library or version has no validated answer adapter. Expand source details to inspect its stored parameters.",
      },
    ];
  }
  let drafts: Draft[];
  try {
    drafts = adapters[node.library](node.params);
  } catch {
    drafts = [];
  }
  if (!drafts.length)
    drafts = [
      { prompt: plainText(node.params.question) || node.library, parts: [] },
    ];
  return drafts.map((d, i) => {
    const complete = d.parts.filter(
      (p) => p.values.length || p.images?.length,
    ).length;
    const status =
      complete === 0
        ? "missing"
        : complete < d.parts.length
          ? "partial"
          : "extracted";
    return {
      ...base,
      id: `${node.path}#${i}`,
      ...d,
      status,
      explanation:
        d.explanation ||
        (status === "missing"
          ? "No usable answer key is stored in the expected fields."
          : status === "partial"
            ? "Some answer parts are missing or malformed."
            : undefined),
    };
  });
}

export function extractContent(
  content: Record<string, any>,
  mainLibrary: string,
  packageName = "",
  rootVersion?: string,
): ExtractionReport {
  const report: ExtractionReport = {
    nodes: [],
    answers: [],
    warnings: [],
    videoNotes: [],
  };
  const stack: Array<{
    value: unknown;
    path: string;
    location: string;
    depth: number;
    timestamp?: number;
  }> = [
    {
      value: {
        library: `${mainLibrary}${rootVersion ? ` ${rootVersion}` : ""}`,
        params: content,
      },
      path: "$",
      location: "Module",
      depth: 0,
    },
  ];
  let count = 0;
  while (stack.length) {
    const item = stack.pop()!;
    if (++count > 100000 || item.depth > 128)
      throw new Error("Content exceeds the safe nesting or node limit.");
    const v = item.value;
    if (!v || typeof v !== "object") continue;
    if (record(v) && typeof v.library === "string") {
      const [library, version] = v.library.trim().split(/\s+/);
      const node: ContentNode = {
        path: item.path,
        library,
        version,
        params: record(v.params) ? v.params : {},
        location: item.location,
        timestamp: item.timestamp,
      };
      report.nodes.push(node);
      report.answers.push(...extractNode(node, packageName));
      if (library === "H5P.Video" || library === "H5P.InteractiveVideo") {
        const p = node.params.interactiveVideo || node.params;
        const texts = [
          p.transcript,
          p.description,
          ...list(p.assets?.interactions || p.interactions).map(
            (i) => i?.action?.params?.text,
          ),
        ]
          .map(plainText)
          .filter(Boolean);
        report.videoNotes.push({
          sourcePath: node.path,
          location: node.location,
          kind: typeof p.transcript === "string" ? "transcript" : "activity",
          text:
            texts.join("\n\n") ||
            "No packaged transcript or activity notes are available for this video.",
        });
      }
    }
    const entries = Array.isArray(v)
      ? v.map((x, i) => [String(i), x] as const)
      : Object.entries(v);
    for (let i = entries.length - 1; i >= 0; i--) {
      const [key, value] = entries[i];
      let location = item.location;
      if (Array.isArray(v)) {
        const group = item.path.split(".").pop();
        const labels: Record<string, string> = {
          chapters: "Chapter",
          slides: "Slide",
          questions: "Question",
          branches: "Branch",
        };
        if (group && labels[group])
          location += ` / ${labels[group]} ${Number(key) + 1}`;
      }
      const timestamp =
        record(value) && Number.isFinite(value.duration?.from)
          ? value.duration.from
          : item.timestamp;
      if (timestamp !== item.timestamp)
        location += ` / Video ${Math.floor(timestamp! / 60)}:${String(Math.floor(timestamp! % 60)).padStart(2, "0")}`;
      stack.push({
        value,
        path: item.path + (Array.isArray(v) ? `[${key}]` : `.${key}`),
        location,
        depth: item.depth + 1,
        timestamp,
      });
    }
  }
  return report;
}

export const statusLabel = {
  extracted: "Extracted",
  partial: "Partially extracted",
  unsupported: "Unsupported format",
  missing: "No answer key stored",
};
export function answerText(a: AnswerItem): string {
  return (
    a.parts
      .map(
        (p) =>
          `${p.label}: ${p.values.join(" / ")}${p.images?.length ? ` [Image: ${p.images.join(", ")}]` : ""}${p.target ? ` (x ${p.target.x.toFixed(1)}%, y ${p.target.y.toFixed(1)}%)` : ""}`,
      )
      .join("\n") ||
    a.explanation ||
    statusLabel[a.status]
  );
}
