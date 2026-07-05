export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] w-full bg-surface" />
      <div className="mt-3 h-3 w-16 bg-surface-2" />
      <div className="mt-2 h-5 w-4/5 bg-surface-2" />
      <div className="mt-2 h-3 w-full bg-surface-2" />
    </div>
  );
}
export function GridSkeleton({ n = 6 }: { n?: number }) {
  return <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }).map((_, i) => <CardSkeleton key={i} />)}</div>;
}
