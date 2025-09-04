export function Halo() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
    </div>
  );
}
