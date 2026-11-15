import Skeleton from '../common/Skeleton';

const HeaderSkeleton = () => (
  <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-2.5 sm:px-4">
    <div className="flex items-center gap-1.5 sm:gap-3">
      <Skeleton className="h-9 w-9" rounded="rounded-lg" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7" rounded="rounded-lg" />
        <Skeleton className="hidden h-4 w-24 sm:block" />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9" rounded="rounded-lg" />
      <Skeleton className="h-9 w-9" rounded="rounded-lg" />
      <Skeleton className="h-7 w-7" rounded="rounded-full" />
      <Skeleton className="hidden h-4 w-20 sm:block" />
    </div>
  </header>
);

const SidebarSkeleton = () => (
  <aside className="hidden h-full w-60 shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
    <div className="space-y-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Skeleton className="h-5 w-5" rounded="rounded-md" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>

    <div className="mt-6 space-y-2 rounded-xl border border-slate-200 p-3.5">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-1.5 w-full" rounded="rounded-full" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  </aside>
);

const DashboardGridSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg sm:w-36" />
    </div>

    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-9 w-9" rounded="rounded-lg" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-2/3" />
          <Skeleton className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  </div>
);

const AppSkeleton = () => (
  <div
    className="flex h-screen flex-col bg-slate-50"
    aria-busy="true"
    aria-label="Loading application"
  >
    <HeaderSkeleton />
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <SidebarSkeleton />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <DashboardGridSkeleton />
      </main>
    </div>
  </div>
);

export default AppSkeleton;