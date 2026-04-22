'use client'

type Props = {
  icon?: string
  title: string
  desc?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = '📭', title, desc, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-medium mb-1 text-sm">{title}</div>
      {desc && <div className="text-xs mb-4" style={{ color: '#8a8580' }}>{desc}</div>}
      {action}
    </div>
  )
}
