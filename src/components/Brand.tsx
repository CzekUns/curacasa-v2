type BrandProps = {
  compact?: boolean;
  className?: string;
};

export function Brand({ compact = false, className = "" }: BrandProps) {
  return (
    <span className={`curacasa-brand${compact ? " curacasa-brand--compact" : ""} ${className}`.trim()}>
      <span className="curacasa-brand__symbol">
        <img
          src={`${import.meta.env.BASE_URL}brand/${compact ? "compact-mark.svg" : "mark.svg"}`}
          width="44"
          height="44"
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </span>
      <span className="curacasa-brand__name">CuraCasa</span>
    </span>
  );
}
