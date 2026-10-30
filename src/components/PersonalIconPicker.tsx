import { useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  ChoreIcon, choreIconOptions, personalIconOptions,
  type ChoreIconName, type PersonalIconName,
} from "../lib/icons";

type PersonalIconPickerProps = {
  value: ChoreIconName;
  onChange: (value: PersonalIconName) => void;
};

export function PersonalIconPicker({ value, onChange }: PersonalIconPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const pickerId = useId();
  const personal = personalIconOptions.find((option) => option.value === value);
  const legacy = !personal ? choreIconOptions.find((option) => option.value === value) : undefined;
  const name = personal?.label || (legacy ? `${legacy.label} (icona esistente)` : "Icona esistente");

  return (
    <div className="icon-picker-field personal-icon-picker">
      <span id={`${pickerId}-label`}>Icona personale</span>
      <button
        type="button"
        aria-labelledby={`${pickerId}-label ${pickerId}-selection`}
        aria-expanded={expanded}
        aria-controls={`${pickerId}-options`}
        className="icon-picker-trigger"
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="icon-tile"><ChoreIcon name={value} size={40} /></span>
        <strong id={`${pickerId}-selection`}>{name}</strong>
        <ChevronDown size={18} className={`personal-icon-picker__chevron ${expanded ? "is-open" : ""}`} aria-hidden="true" />
      </button>
      <p className="personal-icon-picker__hint">
        Scegli un simbolo delicato, anche a tema pulizie. I disegni dello Store restano riservati ai preset.
      </p>
      {expanded ? (
        <div id={`${pickerId}-options`} className="personal-icon-picker__groups" role="group" aria-label="Scegli un'icona personale">
          {legacy && (
            <div className="personal-icon-picker__legacy">
              <span className="icon-tile"><ChoreIcon name={value} size={38}/></span>
              <span>Icona attuale mantenuta finché non scegli un nuovo simbolo.</span>
            </div>
          )}
          {(["Pulizie", "Generiche"] as const).map((group) => (
            <section className="personal-icon-picker__section" key={group} aria-label={group === "Pulizie" ? "A tema pulizie" : "Simboli generici"}>
              <h3>{group === "Pulizie" ? "A tema pulizie" : "Simboli generici"}</h3>
              <div className="personal-icon-picker__grid">
                {personalIconOptions.filter((icon) => icon.group === group).map((icon) => (
                  <button
                    type="button"
                    key={icon.value}
                    className={`personal-icon-picker__choice ${icon.value === value ? "is-selected" : ""}`}
                    aria-pressed={icon.value === value}
                    aria-label={icon.label}
                    title={icon.label}
                    onClick={() => { onChange(icon.value); setExpanded(false); }}
                  >
                    <span className="icon-tile"><ChoreIcon name={icon.value} size={40} /></span>
                    <span>{icon.label}</span>
                    {icon.value === value ? <Check className="personal-icon-picker__check" size={14} aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
