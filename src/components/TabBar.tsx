/** 底部 TabBar */
import { useUser } from '../store/UserDataProvider'

export type TabKey = 'home' | 'dict' | 'search' | 'review' | 'mine'

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: 'home', icon: '🗺️', label: '场景' },
  { key: 'dict', icon: '📚', label: '词库' },
  { key: 'search', icon: '🔍', label: '搜索' },
  { key: 'review', icon: '🔁', label: '复习' },
  { key: 'mine', icon: '🙂', label: '我的' },
]

export function TabBar({ tab, onTap }: { tab: TabKey; onTap: (t: TabKey) => void }) {
  const { dueItems } = useUser()
  const due = dueItems().length
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => onTap(t.key)}>
          <span className="ic">{t.icon}</span>
          {t.label}
          {t.key === 'review' && due > 0 && <span className="badge">{due > 99 ? '99+' : due}</span>}
        </button>
      ))}
    </nav>
  )
}
