/** 自定义场景 / 自定义素材表单 */
import { useEffect, useRef, useState } from 'react'
import type { DictWord, Material, Scene, SentenceMaterial, SpokenLevel, VersionLevel } from '../types'
import { useUser } from '../store/UserDataProvider'
import { loadDict } from '../services/dict'
import { colloquialZh, searchDictForForm, suggestEnNames } from '../services/suggest'
import { Sheet } from '../components/Sheet'
import { SceneIcon } from './SceneIcon'

const ICONS = ['📌', '🎯', '🏠', '💼', '🎓', '✈️', '🚇', '🛒', '🏥', '🎬', '⚽', '🐱', '🍕', '🎵', '💡', '🗣️']

/** 上传图片 → 居中裁剪压缩成 96px PNG dataURL（存 localStorage 不会爆容量） */
function fileToIconDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = 96
        c.height = 96
        const ctx = c.getContext('2d')!
        const s = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 96, 96)
        URL.revokeObjectURL(url)
        resolve(c.toDataURL('image/png'))
      } catch (e) {
        URL.revokeObjectURL(url)
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}

export function SceneForm({ initial, onDone }: { initial?: Scene; onDone: () => void }) {
  const { addCustomScene, updateCustomScene } = useUser()
  const [name, setName] = useState(initial?.name ?? '')
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📌')
  const [desc, setDesc] = useState(initial?.desc ?? '')
  const [nameEnSugs, setNameEnSugs] = useState<string[]>([])
  /** 用户手动编辑过英文名后，联想不再自动覆盖 */
  const [nameEnTouched, setNameEnTouched] = useState(!!initial)
  const dictRef = useRef<DictWord[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [imgErr, setImgErr] = useState('')

  useEffect(() => {
    void loadDict().then((r) => (dictRef.current = r.words))
  }, [])

  /** 中文名输入（防抖 350ms）→ 精选表 + 词库反查英文名建议 */
  useEffect(() => {
    if (initial) return
    const t = window.setTimeout(() => {
      const list = name.trim() && dictRef.current ? suggestEnNames(name, dictRef.current) : []
      setNameEnSugs(list)
      if (list.length && (!nameEn.trim() || !nameEnTouched)) setNameEn(list[0])
    }, 350)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const pickImage = async (file: File) => {
    setImgErr('')
    try {
      const dataUrl = await fileToIconDataUrl(file)
      setIcon(dataUrl)
    } catch {
      setImgErr('这张图读取失败，换一张试试')
    }
  }

  const save = () => {
    if (!name.trim()) return
    if (initial) updateCustomScene(initial.id, { name: name.trim(), nameEn: nameEn.trim(), icon, desc: desc.trim() })
    else addCustomScene({ id: `cs-${Date.now()}`, name: name.trim(), nameEn: nameEn.trim() || 'My Scene', icon, desc: desc.trim() })
    onDone()
  }

  return (
    <Sheet title={initial ? '编辑场景' : '新建场景'} onClose={onDone}>
      <div className="form-item">
        <label>场景名（中文）*</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="比如：健身、面试、养宠物" />
        <div className="form-tip">输入后会根据词库自动联想英文名，可自行修改</div>
      </div>
      <div className="form-item">
        <label>英文名</label>
        <input
          value={nameEn}
          onChange={(e) => { setNameEn(e.target.value); setNameEnTouched(true); setNameEnSugs([]) }}
          placeholder="Fitness / Interview / Pets"
        />
        {nameEnSugs.filter((s) => s !== nameEn.trim()).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {nameEnSugs.filter((s) => s !== nameEn.trim()).map((s) => (
              <button key={s} className="sug-apply" onClick={() => { setNameEn(s); setNameEnSugs([]) }}>
                ✨ {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="form-item">
        <label>图标（选 emoji 或上传图片）</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
          {icon.startsWith('data:') && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-soft)', borderRadius: 10, padding: '4px 8px' }}>
              <SceneIcon icon={icon} size={30} />
              <button
                style={{ color: 'var(--sub)', fontSize: 12 }}
                onClick={() => setIcon('📌')}
              >
                移除
              </button>
            </span>
          )}
          {!icon.startsWith('data:') &&
            ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  width: 38, height: 38, fontSize: 20, borderRadius: 10,
                  background: icon === ic ? 'var(--brand-soft)' : '#f5f6f6',
                  border: icon === ic ? '1.5px solid var(--brand)' : '1.5px solid transparent',
                }}
              >
                {ic}
              </button>
            ))}
          <button className="icon-upload" onClick={() => fileRef.current?.click()}>
            🖼 上传图标
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void pickImage(f)
            e.target.value = ''
          }}
        />
        {imgErr && <div className="form-tip" style={{ color: 'var(--red)' }}>{imgErr}</div>}
        <div className="form-tip">上传的图会自动裁成正方形并压缩到 96px，只存本机</div>
      </div>
      <div className="form-item">
        <label>场景说明</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="一句话描述这个场景" />
      </div>
      <button className="btn-main" onClick={save} disabled={!name.trim()}>保存</button>
    </Sheet>
  )
}

/* ================= 素材表单 ================= */

const LEVELS: SpokenLevel[] = ['high', 'ok', 'formal']
const VER_LEVELS: VersionLevel[] = ['简单', '日常', '地道']
const lvName: Record<SpokenLevel, string> = { high: '高频口语', ok: '口语可用', formal: '书面慎用' }

/** "英文 | 中文" 每行一条 → Example[] */
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

export function MaterialForm({ sceneId, initial, initialType, onDone }: { sceneId: string; initial?: Material; initialType?: Material['type']; onDone: () => void }) {
  const { addCustomMaterial, updateCustomMaterial } = useUser()
  const [type, setType] = useState<Material['type']>(initial?.type ?? initialType ?? 'sentence')
  const [en, setEn] = useState(initial?.en ?? '')
  const [zh, setZh] = useState(initial?.zh ?? '')
  const [pos, setPos] = useState(initial?.type === 'word' ? initial.pos ?? '' : '')
  const [ipaUS, setIpaUS] = useState(initial && initial.type !== 'sentence' ? initial.ipaUS ?? '' : '')
  const [ipaUK, setIpaUK] = useState(initial && initial.type !== 'sentence' ? initial.ipaUK ?? '' : '')
  const [level, setLevel] = useState<SpokenLevel>(initial?.spokenLevel ?? 'ok')
  const [note, setNote] = useState(initial?.note ?? '')
  const [exText, setExText] = useState(initial ? toLines(initial.examples) : '')
  const [varRows, setVarRows] = useState<{ level: VersionLevel; en: string; zh: string }[]>(
    initial
      ? initial.variants.map((v) => ({ ...v }))
      : [
          { level: '简单', en: '', zh: '' },
          { level: '日常', en: '', zh: '' },
          { level: '地道', en: '', zh: '' },
        ],
  )
  const [brkText, setBrkText] = useState(initial && initial.type === 'sentence' ? toLines(initial.breakdown) : '')
  const [linking, setLinking] = useState(initial && initial.type === 'sentence' ? initial.linking ?? '' : '')
  const [tplPattern, setTplPattern] = useState(initial?.type === 'sentence' && initial.template ? initial.template.pattern : '')
  const [tplSlotLabel, setTplSlotLabel] = useState(initial?.type === 'sentence' && initial.template ? initial.template.slots[0]?.label ?? '' : '')
  const [tplSlotKey, setTplSlotKey] = useState(initial?.type === 'sentence' && initial.template ? initial.template.slots[0]?.key ?? '' : '')
  const [tplOptions, setTplOptions] = useState(initial?.type === 'sentence' && initial.template ? initial.template.slots.map((s) => s.options.join(', ')).join(', ') : '')

  /* ---------- 词库联想：模糊搜索 → 选中自动带出词性/音标/释义/例句 ---------- */
  const [dictWords, setDictWords] = useState<DictWord[] | null>(null)
  const [sugs, setSugs] = useState<DictWord[] | null>(null)
  const [sugFor, setSugFor] = useState<'en' | 'zh'>('en')

  useEffect(() => {
    void loadDict().then((r) => setDictWords(r.words))
  }, [])

  const querySugs = (q: string, from: 'en' | 'zh') => {
    setSugFor(from)
    if (!dictWords || !q.trim() || type === 'sentence') {
      setSugs(null)
      return
    }
    const list = searchDictForForm(q, dictWords)
    setSugs(list.length ? list : [])
  }

  const pickDictWord = (d: DictWord) => {
    setEn(d.w)
    setZh(colloquialZh(d.zh))
    if (type === 'word') setPos(d.pos ?? '')
    setIpaUS(d.us ?? '')
    setIpaUK(d.uk ?? '')
    const sp = d.spoken
    if (sp?.level) setLevel(sp.level)
    if (sp?.examples?.length) setExText(toLines(sp.examples))
    if (sp?.variants?.length) setVarRows(sp.variants.map((v) => ({ level: v.level, en: v.en, zh: v.zh })))
    setSugs(null)
  }

  const valid = en.trim() && zh.trim()

  const save = () => {
    if (!valid) return
    const variants = varRows.filter((v) => v.en.trim())
    const examples = parseLines(exText)
    const base = {
      en: en.trim(),
      zh: zh.trim(),
      spokenLevel: level,
      note: note.trim() || undefined,
      examples,
      variants,
    }
    let m: Material
    if (type === 'word') {
      m = { type, id: initial?.id ?? `cw-${Date.now()}`, sceneId, custom: true, pos: pos.trim() || undefined, ipaUS: ipaUS.trim() || ipaUK.trim(), ipaUK: ipaUK.trim() || ipaUS.trim(), ...base }
    } else if (type === 'phrase') {
      m = { type, id: initial?.id ?? `cp-${Date.now()}`, sceneId, custom: true, ipaUS: ipaUS.trim() || undefined, ipaUK: ipaUK.trim() || undefined, ...base }
    } else {
      const template =
        tplPattern.trim() && tplSlotKey.trim()
          ? {
              pattern: tplPattern.trim(),
              slots: [{ key: tplSlotKey.trim(), label: tplSlotLabel.trim() || '替换词', options: tplOptions.split(/[,，]/).map((s) => s.trim()).filter(Boolean) }],
            }
          : undefined
      m = {
        type,
        id: initial?.id ?? `cs-${Date.now()}`,
        sceneId,
        custom: true,
        breakdown: parseLines(brkText),
        linking: linking.trim() || undefined,
        template,
        ...base,
      } as SentenceMaterial
    }
    if (initial) updateCustomMaterial(initial.id, m)
    else addCustomMaterial(m)
    onDone()
  }

  return (
    <Sheet title={initial ? '编辑内容' : '添加内容'} onClose={onDone}>
      {!initial && (
        <div className="form-item">
          <label>类型 *</label>
          <div className="radio-pill">
            {(['word', 'phrase', 'sentence'] as const).map((t) => (
              <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
                {t === 'word' ? '单词' : t === 'phrase' ? '短语' : '句子'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="form-item">
        <label>英文 * {type !== 'sentence' && <span style={{ fontWeight: 400 }}>（输入可从词库联想）</span>}</label>
        <textarea
          value={en}
          onChange={(e) => {
            setEn(e.target.value)
            querySugs(e.target.value, 'en')
          }}
          placeholder={type === 'sentence' ? '整句英文' : '英文单词 / 短语'}
        />
        {sugs && sugFor === 'en' && (
          <div className="suggest-box">
            {sugs.length === 0 ? (
              <div className="sug-empty">词库没有匹配，继续手动填写即可</div>
            ) : (
              sugs.map((d) => (
                <button key={d.w} className="sug-row" onClick={() => pickDictWord(d)}>
                  <b>{d.w}</b>
                  {d.pos && <span className="tag">{d.pos}</span>}
                  <span className="sug-zh">{colloquialZh(d.zh)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <div className="form-item">
        <label>口语化中文翻译 *</label>
        <input
          value={zh}
          onChange={(e) => {
            setZh(e.target.value)
            querySugs(e.target.value, 'zh')
          }}
          placeholder="怎么说人话怎么写（也可输入中文反查单词）"
        />
        {sugs && sugFor === 'zh' && (
          <div className="suggest-box">
            {sugs.length === 0 ? (
              <div className="sug-empty">词库没有匹配，继续手动填写即可</div>
            ) : (
              sugs.map((d) => (
                <button key={d.w} className="sug-row" onClick={() => pickDictWord(d)}>
                  <b>{d.w}</b>
                  {d.pos && <span className="tag">{d.pos}</span>}
                  <span className="sug-zh">{colloquialZh(d.zh)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {type === 'word' && (
        <div className="form-row2">
          <div className="form-item">
            <label>词性</label>
            <input value={pos} onChange={(e) => setPos(e.target.value)} placeholder="n. / v. / adj." />
          </div>
          <div className="form-item">
            <label>口语使用度</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as SpokenLevel)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{lvName[l]}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      {type !== 'sentence' && (
        <div className="form-row2">
          <div className="form-item">
            <label>美式音标</label>
            <input value={ipaUS} onChange={(e) => setIpaUS(e.target.value)} placeholder="/ˈɔːrdər/" />
          </div>
          <div className="form-item">
            <label>英式音标</label>
            <input value={ipaUK} onChange={(e) => setIpaUK(e.target.value)} placeholder="/ˈɔːdə/" />
          </div>
        </div>
      )}
      <div className="form-item">
        <label>对话例句（每行一条：英文 | 中文）</label>
        <textarea value={exText} onChange={(e) => setExText(e.target.value)} placeholder={'Are you ready to order? | 您要点餐了吗？'} />
      </div>
      <div className="form-item">
        <label>换个说法（同义 / 替换 / 不同语气）</label>
        {varRows.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select
              value={v.level}
              onChange={(e) => setVarRows((rs) => rs.map((r, j) => (j === i ? { ...r, level: e.target.value as VersionLevel } : r)))}
              style={{ width: 82, background: '#f5f6f6', borderRadius: 8, padding: '0 6px', fontSize: 12.5 }}
            >
              {VER_LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              value={v.en}
              onChange={(e) => setVarRows((rs) => rs.map((r, j) => (j === i ? { ...r, en: e.target.value } : r)))}
              placeholder="英文"
              style={{ flex: 1, background: '#f5f6f6', borderRadius: 8, padding: '8px 9px', fontSize: 13 }}
            />
            <input
              value={v.zh}
              onChange={(e) => setVarRows((rs) => rs.map((r, j) => (j === i ? { ...r, zh: e.target.value } : r)))}
              placeholder="中文"
              style={{ flex: 1, background: '#f5f6f6', borderRadius: 8, padding: '8px 9px', fontSize: 13 }}
            />
          </div>
        ))}
      </div>
      {type === 'sentence' && (
        <>
          <div className="form-item">
            <label>长句拆分（每行一段：英文 | 中文）</label>
            <textarea value={brkText} onChange={(e) => setBrkText(e.target.value)} placeholder={'Could I get | 能不能给我来\na burger | 一个汉堡'} />
            <div className="form-tip">适配零基础：把整句拆成 2~4 小段，逐段开口</div>
          </div>
          <div className="form-item">
            <label>连读弱读标注</label>
            <input value={linking} onChange={(e) => setLinking(e.target.value)} placeholder={'What‿are *you *up *to?   （‿连读 *弱读 (吞音)）'} />
          </div>
          <div className="form-item">
            <label>句式仿写模板（可选）</label>
            <input value={tplPattern} onChange={(e) => setTplPattern(e.target.value)} placeholder="Could I get {item} and {side}?" />
            <div className="form-row2 mt8">
              <input value={tplSlotKey} onChange={(e) => setTplSlotKey(e.target.value)} placeholder="槽位名(item)" style={{ background: '#f5f6f6', borderRadius: 8, padding: '9px 10px', fontSize: 13 }} />
              <input value={tplSlotLabel} onChange={(e) => setTplSlotLabel(e.target.value)} placeholder="槽位中文(食物)" style={{ background: '#f5f6f6', borderRadius: 8, padding: '9px 10px', fontSize: 13 }} />
            </div>
            <input value={tplOptions} onChange={(e) => setTplOptions(e.target.value)} placeholder="候选词，逗号分隔：a burger, a wrap, a salad" className="mt8" style={{ width: '100%', background: '#f5f6f6', borderRadius: 8, padding: '9px 10px', fontSize: 13 }} />
          </div>
        </>
      )}
      <div className="form-item">
        <label>口语使用度</label>
        <div className="radio-pill">
          {LEVELS.map((l) => (
            <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>
              {lvName[l]}
            </button>
          ))}
        </div>
      </div>
      <div className="form-item">
        <label>备注 / 使用提示</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="什么场合用、怎么用更自然" />
      </div>
      <button className="btn-main" onClick={save} disabled={!valid}>保存</button>
      <div className="form-tip mt8">保存后自动进入全局搜索库、收藏本与复习体系</div>
    </Sheet>
  )
}
