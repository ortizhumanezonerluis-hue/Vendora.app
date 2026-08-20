import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

type MainLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function MainLayout({ title, subtitle, children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(() =>
    localStorage.getItem('vendora_sidebar_collapsed') === 'true'
  )

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('vendora_sidebar_collapsed', String(next))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} onToggleSidebar={toggleCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
