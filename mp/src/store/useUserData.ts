/** 数据订阅 hook（把模块级 store 接进 React），并转出口径一致的 store API */
import { useEffect, useState } from 'react'
import { getUserData, subscribe, actions, favKey, dueItems } from './store'
import type { UserData } from '../shared/types'

export { getUserData, subscribe, actions, favKey, dueItems }

export function useUserData(): UserData {
  const [data, setData] = useState<UserData>(getUserData)
  useEffect(() => subscribe(() => setData(getUserData())), [])
  return data
}
