"use client";

type Content = {
  id: string;
  title: string;
  objectives: string | null;
  methodology: string | null;
  resources: string | null;
  bncc: string | null;
};

export default function PrintContentsClient({
  contents,
}: {
  contents: Content[];
}) {
  return (
    <>
      <style>{`
        @media print {
          button {
            display: none;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white px-8 py-8">
        <button
          onClick={() => window.print()}
          className="mb-6 rounded bg-sky-600 px-4 py-2 text-white"
        >
          Salvar em PDF
        </button>

        {contents.map((content) => (
          <div key={content.id} className="mb-10 border-b pb-6">
            <h2 className="text-xl font-semibold">{content.title}</h2>

            {content.objectives && (
              <>
                <h3 className="mt-4 font-semibold">Objetivos</h3>
                <p>{content.objectives}</p>
              </>
            )}

            {content.methodology && (
              <>
                <h3 className="mt-4 font-semibold">Metodologia</h3>
                <p>{content.methodology}</p>
              </>
            )}

            {content.resources && (
              <>
                <h3 className="mt-4 font-semibold">Recursos</h3>
                <p>{content.resources}</p>
              </>
            )}

            {content.bncc && (
              <>
                <h3 className="mt-4 font-semibold">BNCC</h3>
                <p>{content.bncc}</p>
              </>
            )}
          </div>
        ))}
      </main>
    </>
  );
}
