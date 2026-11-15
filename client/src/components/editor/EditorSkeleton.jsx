import Skeleton from '../common/Skeleton';

const ToolbarSkeleton = () => (
  <div className="flex min-h-[3.25rem] items-center justify-between gap-2 border-b border-slate-200 bg-white px-2 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
      <Skeleton className="h-8 w-8" rounded="rounded-lg" />
      <Skeleton className="h-6 w-40 max-w-[45%]" />
      <div className="hidden items-center gap-0.5 border-l border-slate-200 pl-2 md:flex">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
      <div className="hidden -space-x-2 sm:flex">
        <Skeleton className="h-7 w-7" rounded="rounded-full" />
        <Skeleton className="h-7 w-7" rounded="rounded-full" />
      </div>
      <Skeleton className="h-9 w-9" rounded="rounded-lg" />
      <Skeleton className="h-8 w-16" rounded="rounded-md" />
    </div>
  </div>
);

const ContentSkeleton = () => (
  <div className="flex-1 overflow-y-auto bg-white">
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10 md:px-12">
      {/* Title */}
      <Skeleton className="h-8 w-2/3" />

      {/* Paragraph 1 */}
      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-10/12" />
      </div>

      {/* Paragraph 2 */}
      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
      </div>

      {/* Paragraph 3 */}
      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-8/12" />
      </div>
    </div>
  </div>
);

const CommentsSkeleton = () => (
  <div className="hidden w-80 shrink-0 border-l border-slate-200 bg-white lg:block">
    <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
      <Skeleton className="h-5 w-5" rounded="rounded-md" />
      <Skeleton className="h-4 w-24" />
    </div>

    <div className="space-y-3 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="space-y-2 rounded-xl border border-slate-200 p-3"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" rounded="rounded-full" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="ml-auto h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

const EditorSkeleton = () => (
  <div
    className="flex h-full flex-col"
    aria-busy="true"
    aria-label="Loading editor"
  >
    <ToolbarSkeleton />
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <ContentSkeleton />
      <CommentsSkeleton />
    </div>
  </div>
);

export default EditorSkeleton;