import { cn } from '@/lib/cn'
import { Icon } from './Icon'

/** An item's picture, or a neutral box icon when it has none. Size it with className. */
export function ItemImage({ src, alt, className, iconSize = 26 }: { src?: string; alt: string; className?: string; iconSize?: number }) {
  if (src) return <img src={src} alt={alt} className={cn('object-cover', className)}/>
  return <div role="img" aria-label={alt} className={cn('flex items-center justify-center bg-[#EEF3F0] text-[#9AABA3]', className)}><Icon name="box" size={iconSize}/></div>
}
