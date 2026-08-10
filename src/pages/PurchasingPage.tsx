import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import SmartReorderPanel from '../components/purchasing/SmartReorderPanel'
import PurchaseOrderTable from '../components/purchasing/PurchaseOrderTable'
import SupplierManagement from '../components/purchasing/SupplierManagement'
import { FileText, TrendingUp, Users } from 'lucide-react'

type TabId = 'reorder' | 'orders' | 'suppliers'

// Skeleton shimmer blocks
function SkeletonPurchasing() {
  return (
    <div className="p-5 space-y-5 max-w-[1400px] animate-pulse">
      {/* Fake tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-3">
        {[120, 100, 90].map((w, i) => (
          <div key={i} className="h-4 rounded bg-gray-200" style={{ width: w }} />
        ))}
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="h-3 bg-gray-100 rounded w-24" />
            <div className="h-8 bg-gray-200 rounded w-16" />
            <div className="h-2 bg-gray-100 rounded w-32" />
          </div>
        ))}
      </div>

      {/* Main panel card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 min-h-[400px]">
        {/* Filter row */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-48" />
          <div className="h-8 bg-gray-100 rounded-lg w-28" />
        </div>

        {/* Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50">
            <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-40" />
              <div className="h-2.5 bg-gray-100 rounded w-28" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-7 bg-gray-100 rounded-lg w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState<TabId>('reorder')
  const [booting, setBooting] = useState(true)

  // Brief skeleton on first mount to let child components start loading
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 700)
    return () => clearTimeout(t)
  }, [])

  const tabs = [
    { id: 'reorder', label: 'Reabastecimiento Inteligente', icon: TrendingUp },
    { id: 'orders', label: 'Órdenes Generadas', icon: FileText },
    { id: 'suppliers', label: 'Proveedores', icon: Users },
  ] as const

  if (booting) {
    return (
      <MainLayout title="Reabastecimiento y Compras">
        <SkeletonPurchasing />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Reabastecimiento y Compras">
      <div className="p-5 space-y-5 max-w-[1400px]">
        {/* Tabs navigation */}
        <div className="flex border-b border-gray-200 gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-2 pb-3.5 text-[13px] font-medium border-b-2 transition-all outline-none',
                  isActive
                    ? 'border-gray-900 text-gray-900 font-semibold'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                ].join(' ')}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content wrapper */}
        <div className="bg-white p-5 border border-gray-200 rounded-2xl shadow-sm min-h-[500px]">
          {activeTab === 'reorder' && <SmartReorderPanel />}
          {activeTab === 'orders' && <PurchaseOrderTable />}
          {activeTab === 'suppliers' && <SupplierManagement />}
        </div>
      </div>
    </MainLayout>
  )
}
