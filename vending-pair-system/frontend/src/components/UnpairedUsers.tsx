import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Users } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
}

interface UnpairedUsersProps {
  token: string
}

export function UnpairedUsers({ token }: UnpairedUsersProps) {
  const [unpairedUsers, setUnpairedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnpairedUsers()
  }, [])

  const fetchUnpairedUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/unpaired`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUnpairedUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch unpaired users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  if (unpairedUsers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>今日はすべての社員がペアを組んでいます！</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unpairedUsers.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-orange-600">
                {user.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{user.name}さん</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            未ペア
          </Badge>
        </div>
      ))}
    </div>
  )
}
