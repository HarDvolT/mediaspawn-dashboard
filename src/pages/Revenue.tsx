import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Invoice {
  id: string
  client_name: string
  amount: number
  status: 'paid' | 'unpaid' | 'overdue'
  issued_at: string
  due_date: string
  invoice_number: string
}

interface RevenueStats {
  mrr: number
  outstanding: number
  paidTotal: number
  unpaidTotal: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-700 animate-pulse rounded-xl ${className}`} />
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sublabel?: string
  accentColor: string
}) {
  return (
    <div
      className="bg-gray-800 rounded-xl p-6 relative overflow-hidden"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-white text-3xl font-bold mt-1">{value}</p>
          {sublabel && <p className="text-gray-500 text-sm mt-1">{sublabel}</p>}
        </div>
        <span style={{ color: accentColor }}>
          <Icon className="w-8 h-8 opacity-50" />
        </span>
      </div>
    </div>
  )
}

function SimpleBarChart({ data }: { data: MonthlyRevenue[] }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Revenue Trend (Last 6 Months)</h3>
      <div className="flex items-end gap-2 h-40">
        {data.map((item, index) => {
          const height = Math.max((item.revenue / maxRevenue) * 100, 5)
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-t transition-all duration-300"
                style={{
                  height: `${height}%`,
                  background: 'linear-gradient(to top, #8b5cf6, #a78bfa)',
                }}
              />
              <span className="text-xs text-gray-500">{item.month}</span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-4 text-sm">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center">
            <span className="text-gray-400">{formatCurrency(item.revenue)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimplePieChart({ paid, unpaid }: { paid: number; unpaid: number }) {
  const total = paid + unpaid
  const paidPercent = total > 0 ? (paid / total) * 100 : 0
  
  // Create SVG arc paths
  const radius = 80
  const centerX = 100
  const centerY = 100
  
  // For the pie chart, we'll use stroke-dasharray technique
  const circumference = 2 * Math.PI * radius
  const paidDash = (paidPercent / 100) * circumference
  
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-4">Paid vs Unpaid</h3>
      <div className="flex items-center justify-center gap-8">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle (unpaid) */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="30"
              opacity="0.3"
            />
            {/* Paid arc */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="30"
              strokeDasharray={`${paidDash} ${circumference}`}
              strokeDashoffset={circumference / 4}
              transform={`rotate(-90 ${centerX} ${centerY})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
            {/* Unpaid arc */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="30"
              strokeDasharray={`${circumference - paidDash} ${circumference}`}
              strokeDashoffset={-(paidDash - circumference / 4)}
              transform={`rotate(-90 ${centerX} ${centerY})`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{total > 0 ? `${Math.round(paidPercent)}%` : '-'}</p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <div>
              <p className="text-sm text-gray-400">Paid</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(paid)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-red-500" />
            <div>
              <p className="text-sm text-gray-400">Unpaid</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(unpaid)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const statusStyles = {
    paid: 'bg-emerald-500/20 text-emerald-400',
    unpaid: 'bg-amber-500/20 text-amber-400',
    overdue: 'bg-red-500/20 text-red-400',
  }

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
      <td className="py-3 px-4">
        <div>
          <p className="text-white font-medium">{invoice.invoice_number}</p>
          <p className="text-gray-500 text-xs">{invoice.client_name}</p>
        </div>
      </td>
      <td className="py-3 px-4 text-white font-medium">{formatCurrency(invoice.amount)}</td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[invoice.status]}`}>
          {invoice.status}
        </span>
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {new Date(invoice.issued_at).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 text-gray-400 text-sm">
        {new Date(invoice.due_date).toLocaleDateString()}
      </td>
    </tr>
  )
}

export default function Revenue() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<RevenueStats>({
    mrr: 0,
    outstanding: 0,
    paidTotal: 0,
    unpaidTotal: 0,
  })
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    fetchRevenueData()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchRevenueData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchRevenueData() {
    try {
      setLoading(true)
      
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('issued_at', { ascending: false })
        .limit(20)

      if (invoicesError) throw invoicesError

      const invoices = (invoicesData || []) as Invoice[]
      setInvoices(invoices)

      // Calculate stats
      const paidInvoices = invoices.filter(i => i.status === 'paid')
      const unpaidInvoices = invoices.filter(i => i.status !== 'paid')
      
      const paidTotal = paidInvoices.reduce((sum, i) => sum + i.amount, 0)
      const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0)
      
      // Calculate MRR (sum of recurring invoices or just use monthly average for demo)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentPaid = paidInvoices.filter(i => new Date(i.issued_at) >= sixMonthsAgo)
      const mrr = recentPaid.length > 0 
        ? Math.round(paidTotal / Math.max(recentPaid.length, 1))
        : 0

      setStats({
        mrr,
        outstanding: unpaidTotal,
        paidTotal,
        unpaidTotal,
      })

      // Calculate monthly revenue for chart
      const monthlyData: Record<string, number> = {}
      const months: string[] = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        months.push(monthKey)
        monthlyData[monthKey] = 0
      }

      paidInvoices.forEach(invoice => {
        const monthKey = new Date(invoice.issued_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (monthlyData[monthKey] !== undefined) {
          monthlyData[monthKey] += invoice.amount
        }
      })

      setMonthlyRevenue(months.map(month => ({
        month,
        revenue: monthlyData[month] || 0,
      })))

      setError(null)
    } catch (err) {
      console.error('Failed to load revenue data:', err)
      setError('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Track invoices, MRR, and outstanding payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
          </>
        ) : (
          <>
            <StatCard
              icon={TrendingUp}
              label="MRR"
              value={formatCurrency(stats.mrr)}
              sublabel="Monthly recurring revenue"
              accentColor="#8b5cf6"
            />
            <StatCard
              icon={DollarSign}
              label="Outstanding"
              value={formatCurrency(stats.outstanding)}
              sublabel="Unpaid invoices total"
              accentColor="#f59e0b"
            />
            <StatCard
              icon={FileText}
              label="Paid Total"
              value={formatCurrency(stats.paidTotal)}
              sublabel="All paid invoices"
              accentColor="#10b981"
            />
            <StatCard
              icon={AlertCircle}
              label="Unpaid Total"
              value={formatCurrency(stats.unpaidTotal)}
              sublabel="Pending & overdue"
              accentColor="#ef4444"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <SkeletonCard className="h-64" />
            <SkeletonCard className="h-64" />
          </>
        ) : (
          <>
            <SimpleBarChart data={monthlyRevenue} />
            <SimplePieChart paid={stats.paidTotal} unpaid={stats.unpaidTotal} />
          </>
        )}
      </div>

      {/* Invoices Table */}
      <div className="bg-gray-800/30 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Recent Invoices</h2>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} className="h-12" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Invoice</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Issued</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
