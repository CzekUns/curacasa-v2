import { useEffect, useId, useRef, useState } from "react";
import { ChoreIcon, personalIconOptions, type ChoreIconName, type PersonalIconName } from "../lib/icons";

type PersonalIconPickerProps = {
  value: ChoreIconName;
  onChange: (value: PersonalIconName) => void;
};

/**
 * Like a compact emoji picker: a single square trigger, 6 × N scrollable
 * glyph grid, no visible names. Accessible names are kept on the buttons.
 */
export function PersonalIconPicker({ value, onChange }: PersonalIconPickerProps) {
  const [open, setOpen] = useState(false);
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedName =
    personalIconOptions.find((option) => option.value === value)?.label ?? "Icona precedente";

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  function choose(value: PersonalIconName) {
    onChange(value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div className="personal-icon-picker" ref={rootRef}>
      <span className="personal-icon-picker__label" id={`${pickerId}-label`}>Icona</span>
      <button
        ref={triggerRef}
        type="button"
        className="personal-icon-picker__trigger"
        aria-label={`Scegli icona. Attuale: ${selectedName}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? `${pickerId}-grid` : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <ChoreIcon name={value} size={40} />
      </button>

      {open && (
        <div id={`${pickerId}-grid`} className="personal-icon-picker__popover" role="group" aria-label="Scegli un simbolo">
          <div className="personal-icon-picker__grid">
            {personalIconOptions.map((icon) => (
              <button
                type="button"
                key={icon.value}
                className={`personal-icon-picker__choice ${icon.value === value ? "is-selected" : ""}`}
                aria-pressed={icon.value === value}
                aria-label={icon.label}
                onClick={() => choose(icon.value)}
              >
                <ChoreIcon name={icon.value} size={32} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
