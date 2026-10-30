import { Bath, BedDouble, CookingPot, House, Sofa, Sun } from "lucide-react";
import type { RoomDetail, RoomKind } from "../lib/rooms";

export const roomIcons = {
  cucina: CookingPot,
  bagno: Bath,
  camera: BedDouble,
  salone: Sofa,
  balcone: Sun,
  altro: House,
} satisfies Record<RoomKind, typeof House>;

export function RoomBadge({
  detail,
  name,
  small = false,
  tiny = false,
}: {
  detail: RoomDetail;
  name: string;
  small?: boolean;
  tiny?: boolean;
}) {
  const Icon = roomIcons[detail.kind] ?? House;
  const color = Math.min(7, Math.max(0, detail.color));
  return (
    <span className={`room-identity room-identity--${color} ${small ? "room-identity--small" : ""}`}
      aria-label={name} title={name}>
      <Icon aria-hidden="true" strokeWidth={1.9} />
    </span>
  );
}
