/**
 * Loading placeholders shaped like the content they stand in for, so pages keep their layout
 * while schemes, scheme details or documents load. Each block pulses with a short stagger.
 */

function Block({ className = '', delay = 0 }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-purple-100 via-purple-200/70 to-purple-100 ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    />
  );
}

/** Wrapper that announces the loading state to screen readers. */
function Loading({ label, className = '', children }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

function SchemeCardSkeleton({ index }) {
  const delay = index * 120;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm" aria-hidden="true">
      <Block className="aspect-video w-full rounded-none" delay={delay} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Block className="h-5 w-2/5" delay={delay} />
        <Block className="h-3.5 w-full" delay={delay + 60} />
        <Block className="h-3.5 w-4/5" delay={delay + 60} />
        <Block className="mt-3 h-4 w-24" delay={delay + 120} />
      </div>
    </div>
  );
}

/** Grid of scheme cards (Genie scheme picker and the admin schemes list). */
export function SchemeGridSkeleton({ count = 3, className = 'mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <Loading label="Loading schemes" className={className}>
      {Array.from({ length: count }, (_, i) => (
        <SchemeCardSkeleton key={i} index={i} />
      ))}
    </Loading>
  );
}

/** Scheme intro page: banner, title and text on the left, the "How Genie helps" card on the right. */
export function SchemeIntroSkeleton() {
  return (
    <Loading label="Loading scheme" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-8 sm:px-6">
      <div aria-hidden="true">
        <Block className="mb-5 h-4 w-44" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Block className="aspect-video w-full rounded-3xl" />
            <Block className="mt-6 h-8 w-1/3" delay={100} />
            <div className="mt-4 space-y-2.5">
              <Block className="h-4 w-full" delay={160} />
              <Block className="h-4 w-11/12" delay={160} />
              <Block className="h-4 w-3/4" delay={160} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
              <Block className="h-5 w-40" delay={100} />
              <div className="mt-5 space-y-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Block className="h-8 w-8 shrink-0 rounded-full" delay={160 + i * 80} />
                    <div className="flex-1 space-y-2">
                      <Block className="h-3.5 w-3/4" delay={160 + i * 80} />
                      <Block className="h-3 w-1/2" delay={160 + i * 80} />
                    </div>
                  </div>
                ))}
              </div>
              <Block className="mt-6 h-11 w-full rounded-xl" delay={400} />
            </div>
          </div>
        </div>
      </div>
    </Loading>
  );
}

/** Admin scheme editor: header, tab strip and a few form fields. */
export function SchemeEditorSkeleton() {
  return (
    <Loading label="Loading scheme" className="mx-auto w-full max-w-6xl space-y-6">
      <div aria-hidden="true" className="space-y-6">
        <Block className="h-4 w-24" />
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Block className="h-7 w-48" delay={80} />
            <Block className="h-3.5 w-72" delay={80} />
          </div>
          <Block className="h-10 w-28 rounded-xl" delay={120} />
        </div>
        <div className="flex gap-2 border-b border-gray-100 pb-3">
          {[0, 1, 2, 3].map((i) => (
            <Block key={i} className="h-8 w-28 rounded-full" delay={160 + i * 60} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 rounded-2xl border border-gray-200 bg-white p-6 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Block className="h-3.5 w-32" delay={240 + i * 80} />
                <Block className={`${i === 2 ? 'h-24' : 'h-10'} w-full rounded-xl`} delay={240 + i * 80} />
              </div>
            ))}
          </div>
          <div className="space-y-3 lg:col-span-2">
            <Block className="h-3.5 w-28" delay={300} />
            <Block className="aspect-video w-full rounded-2xl" delay={300} />
          </div>
        </div>
      </div>
    </Loading>
  );
}

/** Rows of the admin documents list. */
export function DocumentRowsSkeleton({ count = 3 }) {
  return (
    <Loading label="Loading documents" className="divide-y divide-gray-100">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5" aria-hidden="true">
          <Block className="h-9 w-9 shrink-0 rounded-lg" delay={i * 100} />
          <div className="flex-1 space-y-2">
            <Block className="h-3.5 w-1/2" delay={i * 100} />
            <Block className="h-3 w-1/3" delay={i * 100 + 60} />
          </div>
          <Block className="h-6 w-16 rounded-full" delay={i * 100 + 120} />
        </div>
      ))}
    </Loading>
  );
}
