import { Button } from '@/components/ui/Button'

export function SaveBar({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return <div className="mt-8 flex justify-end"><Button onClick={onSave} loading={saving}>Save changes</Button></div>
}

export function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><div className="text-lg font-black text-[#17382C]">{title}</div><div className="mt-1 text-xs text-[#84938C]">{description}</div></div>
}
