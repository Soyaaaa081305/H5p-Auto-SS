import JSZip from "jszip";
export const activity = (library: string, params: any) => ({ library, params });
export const book = {
  chapters: [
    {
      ...activity("H5P.Column 1.22", {
        content: [
          {
            content: activity("H5P.Blanks 1.14", {
              questions: ["<p>The *red/crimson:color* and *blue* flags.</p>"],
            }),
          },
          {
            content: activity("H5P.MultiChoice 1.16", {
              question: "Choose both",
              answers: [
                { text: "One", correct: true },
                { text: "Two", correct: true },
                { text: "Three", correct: false },
              ],
            }),
          },
          {
            content: activity("H5P.DragText 1.10", {
              textField: "*First* then *Second*",
            }),
          },
          {
            content: activity("H5P.InteractiveVideo 1.28", {
              interactiveVideo: {
                video: { files: [{ path: "https://youtu.be/abcdefghijk" }] },
                assets: {
                  interactions: [
                    {
                      duration: { from: 65 },
                      action: activity("H5P.SingleChoiceSet 1.11", {
                        choices: [
                          {
                            question: "Video question?",
                            answers: ["Correct", "Wrong"],
                          },
                        ],
                      }),
                    },
                  ],
                },
                summary: {
                  task: activity("H5P.Summary 1.10", {
                    summaries: [{ summary: ["Conclusion", "Wrong"] }],
                  }),
                },
              },
            }),
          },
          {
            content: activity("H5P.DragQuestion 1.15", {
              question: {
                task: {
                  elements: [
                    {
                      type: activity("H5P.AdvancedText 1.1", {
                        text: "Match me",
                      }),
                    },
                    {
                      type: activity("H5P.Image 1.1", {
                        file: { path: "images/pixel.png" },
                        alt: "Image answer",
                      }),
                    },
                  ],
                  dropZones: [
                    {
                      label: "Destination",
                      x: 20,
                      y: 30,
                      correctElements: ["0", "1"],
                    },
                  ],
                },
              },
            }),
          },
          {
            content: activity("H5P.CustomThing 1.0", {
              question: "Unknown answer format",
              secretAnswer: "Inspectable only",
            }),
          },
          {
            content: activity("H5P.TrueFalse 1.8", { question: "Absent key" }),
          },
          {
            content: activity("H5P.AdvancedText 1.1", {
              text: '<p>Safe text<img src="https://privacy.invalid/pixel"><script>window.pwned=true</script><a href="javascript:alert(1)">link</a></p>',
            }),
          },
        ],
      }),
    },
  ],
};
export async function archive(
  content: unknown = book,
  mainLibrary = "H5P.InteractiveBook",
) {
  const zip = new JSZip();
  zip.file(
    "h5p.json",
    JSON.stringify({ title: "Synthetic Book", mainLibrary }),
  );
  zip.file("content/content.json", JSON.stringify(content));
  zip.file(
    "content/images/pixel.png",
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
  return zip.generateAsync({ type: "nodebuffer" });
}
