import type { H5PPackage } from "../types/h5p";
import { ElementDispatcher } from "./renderers/ElementDispatcher";
export function DocumentViewer({ pkg }: { pkg: H5PPackage }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
      <ElementDispatcher
        action={{
          library:
            pkg.mainLibrary +
            (pkg.report.nodes[0]?.version
              ? " " + pkg.report.nodes[0].version
              : ""),
          params: pkg.content,
        }}
        assetMap={pkg.assetMap}
      />
      {![
        "H5P.InteractiveBook",
        "H5P.Column",
        "H5P.CoursePresentation",
        "H5P.QuestionSet",
        "H5P.InteractiveVideo",
      ].includes(pkg.mainLibrary) &&
        pkg.report.nodes
          .slice(1)
          .filter((n) => !["H5P.Column", "H5P.QuestionSet"].includes(n.library))
          .map((n) => (
            <section key={n.path} className="my-4">
              <p className="text-xs text-zinc-500">{n.location}</p>
              <ElementDispatcher
                action={{
                  library: n.library + (n.version ? " " + n.version : ""),
                  params: n.params,
                }}
                assetMap={pkg.assetMap}
              />
            </section>
          ))}
    </div>
  );
}
