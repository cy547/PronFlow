import { useRef, useState } from 'react'
import { View, Text, Input, Textarea, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import type { Material, SentenceMaterial, SpokenLevel, VersionLevel } from '../../shared/types'
import { DICT } from '../../data/dictData'
import { actions, useUserData } from '../../store/useUserData'
import './index.css'

interface Sug {
  w: string
  us?: string
  uk?: string
  pos?: string
  zh: string
}

const LEVELS: SpokenLevel[] = ['high', 'ok', 'formal']
const LV_NAME: Record<SpokenLevel, string> = { high: '高频口语', ok: '口语可用', formal: '书面慎用' }
const VER_LEVELS: VersionLevel[] = ['简单', '日常', '地道']

function parseLines(text: string): { en: string; zh: string }[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf('|')
      return i === -1 ? { en: l, zh: '' } : { en: l.slice(0, i).trim(), zh: l.slice(i + 1).trim() }
    })
    .filter((x) => x.en)
}

function toLines(list: { en: string; zh: string }[]): string {
  return list.map((x) => `${x.en} | ${x.zh}`).join('\n')
}

export default function FormPage() {
  const router = useRouter()
  const sceneId = router.params.sceneId || ''
  const editId = router.params.id
  const data = useUserData()
  const editing = editId ? data.customMaterials.find((m) => m.id === editId) : undefined

  const [type, setType] = useState<Material['type']>(editing?.type ?? (router.params.type as Material['type']) ?? 'word')
  const [en, setEn] = useState(editing?.en ?? '')
  const [zh, setZh] = useState(editing?.zh ?? '')
  const [pos, setPos] = useState(editing?.type === 'word' ? editing.pos ?? '' : '')
  const [ipaUS, setIpaUS] = useState(editing && editing.type !== 'sentence' ? editing.ipaUS ?? '' : '')
  const [ipaUK, setIpaUK] = useState(editing && editing.type !== 'sentence' ? editing.ipaUK ?? '' : '')
  const [level, setLevel] = useState<SpokenLevel>(editing?.spokenLevel ?? 'ok')
  const [note, setNote] = useState(editing?.note ?? '')
  const [exText, setExText] = useState(editing ? toLines(editing.examples) : '')
  const [varRows, setVarRows] = useState(
    editing
      ? editing.variants.map((v) => ({ ...v }))
      : [
          { level: '简单' as VersionLevel, en: '', zh: '' },
          { level: '日常' as VersionLevel, en: '', zh: '' },
          { level: '地道' as VersionLevel, en: '', zh: '' },
        ],
  )
  const [brkText, setBrkText] = useState(editing && editing.type === 'sentence' ? toLines(editing.breakdown) : '')
  const [linking, setLinking] = useState(editing && editing.type === 'sentence' ? editing.linking ?? '' : '')

  /* ---------- 词库联想（本地离线词典：自动带出词性/音标/释义） ---------- */
  const [sugs, setSugs] = useState<Sug[] | null>(null)
  const [sugFor, setSugFor] = useState<'en' | 'zh'>('en')
  const sugTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 音标自动生成：输入停顿后，逐词查内置词典拼接美式音标（已填则不覆盖） */
  useEffect(() => {
    if (type === 'sentence' || editing) return
    const t = setTimeout(() => {
      const clean = en.trim().replace(/[,.!?;:]+$/g, '')
      if (!clean || ipaUS.trim()) return
      const words = clean.split(/\s+/)
      const parts: string[] = []
      for (const w of words) {
        const hit = DICT.find((d) => d.w.toLowerCase() === w.toLowerCase())
        if (!hit || !(hit.us || hit.uk)) return // 有词查不到 → 不自动填，交给手动/按钮
        parts.push(hit.us || hit.uk)
      }
      const ipa = parts.join(' ')
      if (ipa) setIpaUS(ipa)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [en, type])

  const querySugs = (text: string, from: 'en' | 'zh') => {
    setSugFor(from)
    const q = text.trim().toLowerCase()
    if (type === 'sentence' || !q) {
      setSugs(null)
      return
    }
    if (sugTimer.current) clearTimeout(sugTimer.current)
    sugTimer.current = setTimeout(() => {
      const hasZh = /[\u4e00-\u9fff]/.test(q)
      const matched: Sug[] = []
      for (const it of DICT) {
        const w = it.w.toLowerCase()
        let hit = false
        if (hasZh) hit = it.zh.includes(q)
        else if (w === q || w.startsWith(q)) hit = true
        else if (q.length >= 3 && it.zh.toLowerCase().includes(q)) hit = true
        if (hit) {
          matched.push({ w: it.w, us: it.us, uk: it.uk, pos: it.pos, zh: it.zh })
          if (matched.length >= 8) break
        }
      }
      setSugs(matched)
    }, 250)
  }

  const pickDictWord = (d: Sug) => {
    setEn(d.w)
    const zhFirst = (d.zh || '').split(/[；;]/)[0]?.replace(/^[a-z]+\.\s*/, '') || d.zh
    setZh(zhFirst)
    if (type === 'word') setPos(d.pos ?? '')
    setIpaUS(d.us ?? '')
    setIpaUK(d.uk ?? '')
    setSugs(null)
  }

  /** 短语音标自动拼接：逐词查内置离线词典（查不到的词以 ·词· 占位） */
  const autoGenIpa = () => {
    const clean = en.trim().replace(/[,.!?;:]+$/g, '')
    if (!clean) return
    const ipa = clean
      .split(/\s+/)
      .map((w) => {
        const hit = DICT.find((d) => d.w.toLowerCase() === w.toLowerCase())
        return hit ? hit.us || hit.uk || '' : `·${w}·`
      })
      .join(' ')
      .trim()
    if (ipa) setIpaUS(ipa)
  }

  const save = () => {
    if (!en.trim() || !zh.trim()) {
      Taro.showToast({ title: '英文和中文都要填', icon: 'none' })
      return
    }
    const base = {
      en: en.trim(),
      zh: zh.trim(),
      spokenLevel: level,
      note: note.trim() || undefined,
      examples: parseLines(exText),
      variants: varRows.filter((v) => v.en.trim()),
    }
    let m: Material
    if (type === 'word') {
      m = { type, id: editing?.id ?? `cw-${Date.now()}`, sceneId, custom: true, pos: pos.trim() || undefined, ipaUS: ipaUS.trim() || ipaUK.trim(), ipaUK: ipaUK.trim() || ipaUS.trim(), ...base }
    } else if (type === 'phrase') {
      m = { type, id: editing?.id ?? `cp-${Date.now()}`, sceneId, custom: true, ipaUS: ipaUS.trim() || undefined, ipaUK: ipaUK.trim() || undefined, ...base }
    } else {
      m = { type, id: editing?.id ?? `cs-${Date.now()}`, sceneId, custom: true, breakdown: parseLines(brkText), linking: linking.trim() || undefined, ...base } as SentenceMaterial
    }
    if (editing) actions.updateCustomMaterial(editing.id, m)
    else actions.addCustomMaterial(m)
    Taro.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 600)
  }

  return (
    <View className="form-page">
      {!editing && (
        <View className="fi">
          <Text className="fl">类型 *</Text>
          <View className="pills">
            {(['word', 'phrase', 'sentence'] as const).map((t) => (
              <Text key={t} className={`pill${type === t ? ' on' : ''}`} onClick={() => setType(t)}>
                {t === 'word' ? '单词' : t === 'phrase' ? '短语' : '句子'}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View className="fi">
        <Text className="fl">英文 * {type !== 'sentence' && <Text style={{ fontWeight: 400 }}>（输入可从词库联想）</Text>}</Text>
        <Textarea
          value={en}
          onInput={(e) => {
            setEn(e.detail.value)
            querySugs(e.detail.value, 'en')
          }}
          placeholder={type === 'sentence' ? '整句英文' : '英文单词 / 短语'}
          autoHeight
          maxlength={-1}
        />
        {sugs && sugFor === 'en' && (
          <View className="sug-box">
            {sugs.length === 0 ? (
              <Text className="sug-empty">词库没有匹配，继续手动填写</Text>
            ) : (
              sugs.map((d) => (
                <View key={d.w} className="sug-row" onClick={() => pickDictWord(d)}>
                  <Text className="sug-w">{d.w}</Text>
                  {d.pos && <Text className="tag">{d.pos}</Text>}
                  <Text className="sug-zh">{(d.zh || '').split(/[；;]/)[0]}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
      <View className="fi">
        <Text className="fl">口语化中文翻译 *</Text>
        <Input
          value={zh}
          onInput={(e) => {
            setZh(e.detail.value)
            querySugs(e.detail.value, 'zh')
          }}
          placeholder="怎么说人话怎么写（也可输入中文反查）"
        />
        {sugs && sugFor === 'zh' && (
          <View className="sug-box">
            {sugs.length === 0 ? (
              <Text className="sug-empty">词库没有匹配，继续手动填写</Text>
            ) : (
              sugs.map((d) => (
                <View key={d.w} className="sug-row" onClick={() => pickDictWord(d)}>
                  <Text className="sug-w">{d.w}</Text>
                  {d.pos && <Text className="tag">{d.pos}</Text>}
                  <Text className="sug-zh">{(d.zh || '').split(/[；;]/)[0]}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {type === 'word' && (
        <View className="fi">
          <Text className="fl">词性</Text>
          <Input value={pos} onInput={(e) => setPos(e.detail.value)} placeholder="n. / v. / adj." />
        </View>
      )}
      {type !== 'sentence' && (
        <View className="fi2">
          <View className="fi">
            <Text className="fl">美式音标</Text>
            <Input value={ipaUS} onInput={(e) => setIpaUS(e.detail.value)} placeholder="/ˈɔːrdər/" />
          </View>
          <View className="fi">
            <Text className="fl">英式音标</Text>
            <Input value={ipaUK} onInput={(e) => setIpaUK(e.detail.value)} placeholder="/ˈɔːdə/" />
          </View>
        </View>
      )}
      {type === 'phrase' && en.trim().includes(' ') && (
        <View className="fi">
          <Text className="qa-btn" onClick={autoGenIpa}>🪄 按单词自动生成音标（用内置离线词典）</Text>
        </View>
      )}

      <View className="fi">
        <Text className="fl">对话例句（每行一条：英文 | 中文）</Text>
        <Textarea value={exText} onInput={(e) => setExText(e.detail.value)} placeholder={'Are you ready to order? | 您要点餐了吗？'} autoHeight maxlength={-1} />
      </View>

      <View className="fi">
        <Text className="fl">换个说法（同义 / 替换 / 不同语气）</Text>
        {varRows.map((v, i) => (
          <View className="vrow" key={i}>
            <Text className="vlevel">{v.level}</Text>
            <Input value={v.en} onInput={(e) => setVarRows((rs) => rs.map((r, j) => (j === i ? { ...r, en: e.detail.value } : r)))} placeholder="英文" />
            <Input value={v.zh} onInput={(e) => setVarRows((rs) => rs.map((r, j) => (j === i ? { ...r, zh: e.detail.value } : r)))} placeholder="中文" />
          </View>
        ))}
      </View>

      {type === 'sentence' && (
        <View className="fi">
          <Text className="fl">长句拆分（每行一段：英文 | 中文）</Text>
          <Textarea value={brkText} onInput={(e) => setBrkText(e.detail.value)} placeholder={'Could I get | 能不能给我来'} autoHeight maxlength={-1} />
          <Text className="ftip">零基础友好：把整句拆成 2~4 小段</Text>
        </View>
      )}
      {type === 'sentence' && (
        <View className="fi">
          <Text className="fl">连读弱读标注（‿连读 *弱读 (吞音)）</Text>
          <Input value={linking} onInput={(e) => setLinking(e.detail.value)} placeholder={'What‿are *you *up *to?'} />
        </View>
      )}

      <View className="fi">
        <Text className="fl">口语使用度</Text>
        <View className="pills">
          {LEVELS.map((l) => (
            <Text key={l} className={`pill${level === l ? ' on' : ''}`} onClick={() => setLevel(l)}>
              {LV_NAME[l]}
            </Text>
          ))}
        </View>
      </View>

      <View className="fi">
        <Text className="fl">备注 / 使用提示</Text>
        <Input value={note} onInput={(e) => setNote(e.detail.value)} placeholder="什么场合用、怎么用更自然" />
      </View>

      <Button className="save-btn" onClick={save}>保存</Button>
      <Text className="ftip center">保存后自动进入全局搜索、收藏本与复习体系</Text>
    </View>
  )
}
