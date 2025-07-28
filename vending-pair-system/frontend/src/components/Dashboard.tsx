import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { LogOut, Users, History, Coffee } from 'lucide-react'
import { PairRegistration } from './PairRegistration'
import { PairHistory } from './PairHistory'
import { UnpairedUsers } from './UnpairedUsers'
import { useToast } from '../hooks/use-toast'

interface User {
  id: number
  name: string
  email: string
}

interface DashboardProps {
  user: User
  token: string
  onLogout: () => void
}

export function Dashboard({ user, token, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('pair')
  const [todaysPair, setTodaysPair] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkTodaysPair()
  }, [])

  const checkTodaysPair = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pairs/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const history = await response.json()
        const today = new Date().toISOString().split('T')[0]
        const todayPair = history.find((pair: any) => pair.pair_date === today)
        setTodaysPair(todayPair)
      }
    } catch (error) {
      console.error('Failed to check today\'s pair:', error)
    }
  }

  const handlePairSuccess = () => {
    checkTodaysPair()
    toast({
      title: "ペア登録完了",
      description: "今日のペアが登録されました！",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Coffee className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">社長の奢り自販機</h1>
                <p className="text-sm text-gray-500">ペア管理システム</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {todaysPair && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  今日のペア
                </Badge>
                <span className="text-lg font-medium">{todaysPair.partner_name}さん</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pair" className="flex items-center space-x-2">
              <Coffee className="h-4 w-4" />
              <span>ペア登録</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>履歴</span>
            </TabsTrigger>
            <TabsTrigger value="unpaired" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>未ペア一覧</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pair">
            <Card>
              <CardHeader>
                <CardTitle>今日のペア登録</CardTitle>
                <CardDescription>
                  一緒に自販機に行く相手を選択してください（1日1回まで）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PairRegistration 
                  token={token} 
                  onSuccess={handlePairSuccess}
                  disabled={!!todaysPair}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>今週のペア履歴</CardTitle>
                <CardDescription>
                  今週（月曜日〜日曜日）のペア履歴を表示します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PairHistory token={token} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unpaired">
            <Card>
              <CardHeader>
                <CardTitle>今日の未ペア社員</CardTitle>
                <CardDescription>
                  今日まだペアを組んでいない社員の一覧です
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UnpairedUsers token={token} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
