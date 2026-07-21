export default function PosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-pos-border/70" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-pos-border/50" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-pos-border/70" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-card" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-card lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-card" />
      </div>

      <div className="h-72 animate-pulse rounded-2xl bg-white shadow-card" />
    </div>
  );
}
