interface Props {
  value: number;
}

function getTdColor(td: number): string {
  if (td <= 1) return 'hsl(0 60% 40%)';
  if (td <= 3) return 'hsl(35 80% 50%)';
  if (td <= 5) return 'hsl(187 70% 45%)';
  return 'hsl(270 50% 60%)';
}

export function TdValueCell({ value }: Props) {
  const pct = Math.min((value / 10) * 100, 100);

  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="font-mono font-bold text-purple-400">{value}</span>
      <div className="hidden md:block w-[60px] h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: getTdColor(value) }}
        />
      </div>
    </div>
  );
}
