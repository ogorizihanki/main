import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Calendar } from 'lucide-react'

interface PairHistoryItem {
  id: number
  partner_name: string
  partner_id: number
  pair_date: string
}

interface PairHistoryProps {
  token: string
}

export function PairHistory({ token }: PairHistoryProps) {
  const [history, setHistory] = useState<PairHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pairs/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>今週はまだペアを組んでいません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {item.partner_name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{item.partner_name}さん</p>
              <p className="text-sm text-gray-500">{formatDate(item.pair_date)}</p>
            </div>
          </div>
          <Badge variant="secondary">ペア済み</Badge>
        </div>
      ))}
    </div>
  )
}
