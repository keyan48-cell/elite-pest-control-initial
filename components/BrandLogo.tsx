export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-xs font-black tracking-tight text-white shadow-sm">
        EPCI
      </div>
      {!compact && (
        <div>
          <div className="text-base font-extrabold text-gray-950">Elite Pest Control Initial</div>
          <div className="text-[11px] font-medium text-emerald-700">Building Safer Spaces · GSTIN: 33NTRPK2832P1ZS</div>
        </div>
      )}
    </div>
  );
}
