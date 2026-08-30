/** 词库联想服务：场景英文名自动建议 + 素材表单词库模糊搜索 */
import type { DictWord } from '../types'

const HAS_ZH = /[\u4e00-\u9fff]/

/** 常见场景中英文直配表（优先命中），key 按长度降序做包含匹配 */
const SCENE_NAME_MAP: Record<string, string> = {
  健身: 'Fitness', 减肥: 'Dieting', 购物: 'Shopping', 校园: 'Campus', 面试: 'Interview',
  职场: 'Career', 办公室: 'Office', 工作: 'Work', 学习: 'Study', 网课: 'Online Class',
  旅行: 'Travel', 旅游: 'Travel', 度假: 'Vacation', 美食: 'Foodie', 烹饪: 'Cooking',
  宠物: 'Pets', 养猫: 'Cat Life', 养狗: 'Dog Life', 电影: 'Movies', 音乐: 'Music',
  游戏: 'Gaming', 篮球: 'Basketball', 足球: 'Soccer', 跑步: 'Running', 健身房: 'Gym',
  摄影: 'Photography', 美妆: 'Beauty', 穿搭: 'Fashion', 开车: 'Driving', 学车: 'Driving',
  看病: 'Seeing a Doctor', 医院: 'Hospital', 家庭: 'Family', 育儿: 'Parenting',
  租房: 'Renting', 看房: 'Apartment Hunting', 装修: 'Renovation', 理财: 'Personal Finance',
  投资: 'Investing', 创业: 'Startup', 编程: 'Coding', 科技: 'Tech', 读书: 'Reading',
  写作: 'Writing', 约会: 'Dating', 婚礼: 'Wedding', 节日: 'Festivals', 天气: 'Weather',
  点餐: 'Dining', 咖啡: 'Coffee', 酒吧: 'Bar Nightlife', 追剧: 'TV Shows', 动漫: 'Anime',
  直播: 'Livestreaming', 社交: 'Socializing', 通勤: 'Commuting', 地铁: 'Subway',
  机场: 'Airport', 酒店: 'Hotel', 快递: 'Delivery', 外卖: 'Takeout', 网购: 'Online Shopping',
  生日: 'Birthday', 野餐: 'Picnic', 露营: 'Camping', 钓鱼: 'Fishing', 画画: 'Drawing',
}

function cap(w: string): string {
  return w.charAt(0).toUpperCase() + w.slice(1)
}

/** 输入中文场景名 → 英文场景名建议列表（精选表 → 词库反查），最多 3 个 */
export function suggestEnNames(zh: string, dict: DictWord[], limit = 3): string[] {
  const q = zh.trim()
  if (!q || !HAS_ZH.test(q)) return []
  const out: string[] = []

  // 1) 精选表：名称包含某个 key 即命中（key 长的优先）
  const keys = Object.keys(SCENE_NAME_MAP).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (q.includes(k)) {
      const v = SCENE_NAME_MAP[k]
      if (!out.includes(v)) out.push(v)
      if (out.length >= limit) return out
    }
  }

  // 2) 词库反查（全名 → 渐进去尾字），按 词频×100 + 短词加分 排序
  const tryMatch = (sub: string): string[] => {
    const scored: { w: string; score: number }[] = []
    for (const d of dict) {
      if (!d.zh || !d.zh.includes(sub)) continue
      const score = (d.freq ?? 0) * 100 - d.w.length * 2 + (d.w.length <= 6 ? 5 : 0)
      scored.push({ w: d.w, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit - out.length).map((s) => cap(s.w))
  }
  const pushUnique = (list: string[]) => {
    for (const w of list) if (!out.includes(w)) out.push(w)
  }
  pushUnique(tryMatch(q))
  if (out.length < limit) {
    for (let cut = 1; cut <= 2 && out.length < limit && q.length - cut >= 2; cut++) {
      pushUnique(tryMatch(q.slice(0, q.length - cut)))
    }
  }
  return out
}

/** 素材表单模糊搜索：英文查单词、中文查释义，前缀优先、词频排序 */
export function searchDictForForm(query: string, dict: DictWord[], limit = 8): DictWord[] {
  const q = query.trim().toLowerCase()
  if (q.length < 1) return []
  const zh = HAS_ZH.test(q) ? q : null
  const scored: { d: DictWord; score: number }[] = []
  for (const d of dict) {
    let score = 0
    if (zh) {
      if (d.zh.includes(zh)) score = (d.freq ?? 0) * 10 + 1
    } else {
      const w = d.w.toLowerCase()
      if (w === q) score = (d.freq ?? 0) * 10 + 100
      else if (w.startsWith(q)) score = (d.freq ?? 0) * 10 + 50 - (w.length - q.length)
      else if (w.includes(q)) score = (d.freq ?? 0) * 10 + 10 - (w.length - q.length)
      else if (d.zh.toLowerCase().includes(q) && q.length >= 3) score = (d.freq ?? 0) * 10 + 2
    }
    if (score > 0) scored.push({ d, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.d)
}

/** 从 ECDICT 长释义提取通俗第一条释义（去词性前缀，最多两组含义） */
export function colloquialZh(full: string): string {
  const first = full.split(/[；;\n]/)[0] ?? full
  return first.replace(/^[a-z]+\.\s*/, '').replace(/^(vt|vi|adj|adv|prep|conj|pron|pl)\.\s*/, '').trim() || full
}
