export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#10b981] to-[#ff7a1a] transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
