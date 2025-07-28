import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { useToast } from '../hooks/use-toast'

interface User {
  id: number
  name: string
  email: string
}

interface PairRegistrationProps {
  token: string
  onSuccess: () => void
  disabled: boolean
}

export function PairRegistration({ token, onSuccess, disabled }: PairRegistrationProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const allUsers = await response.json()
        setUsers(allUsers)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast({
        title: "エラー",
        description: "ユーザー一覧の取得に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPartnerId) return

    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pairs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: parseInt(selectedPartnerId)
        })
      })

      if (response.ok) {
        setSelectedPartnerId('')
        onSuccess()
      } else {
        const error = await response.json()
        toast({
          title: "ペア登録エラー",
          description: error.detail || "ペア登録に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "サーバーに接続できません",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const availableUsers = users.filter(user => currentUser && user.id !== currentUser.id)

  if (disabled) {
    return (
      <Alert>
        <AlertDescription>
          今日はすでにペアを登録済みです。明日また登録してください。
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">ペアの相手を選択</label>
        <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
          <SelectTrigger>
            <SelectValue placeholder="相手を選択してください" />
          </SelectTrigger>
          <SelectContent>
            {availableUsers.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        type="submit" 
        disabled={!selectedPartnerId || loading}
        className="w-full"
      >
        {loading ? '登録中...' : 'ペアを登録'}
      </Button>
    </form>
  )
}
