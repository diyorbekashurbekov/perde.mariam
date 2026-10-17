import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Photo } from "@/components/Photo"

type PhotoSlotProps = {
  label: string
  src?: string
  sizes?: string
  priority?: boolean
  className?: string
}

// Суретке арналған орын. `src` берілсе — нақты сурет, әйтпесе белгіленген бос орын.
export function PhotoSlot({ label, src, sizes, priority, className }: PhotoSlotProps) {
  if (src) return <Photo src={src} alt={label} sizes={sizes} priority={priority} className={className} />
  return (
    <div
      role="img"
      aria-label={`Фото орны: ${label}`}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-3 bg-linen-deep text-ink-soft",
        "bg-[repeating-linear-gradient(135deg,rgba(30,26,22,0.045)_0_1px,transparent_1px_14px)]",
        className,
      )}
    >
      <ImageIcon className="size-6" strokeWidth={1.2} aria-hidden />
      <span className="px-4 text-center text-[11px] font-normal tracking-[0.2em] uppercase">Фото · {label}</span>
    </div>
  )
}
