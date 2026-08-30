/** 场景卡片长图导出：canvas 绘制 → 保存到相册 */
import Taro from '@tarojs/taro'
import type { Material } from '../../shared/types'

const W = 750
const PAD = 34
const TEXT_W = W - PAD * 2 - 20

function wrapLines(ctx: any, text: string, font: string, maxW: number): string[] {
  ctx.font = font
  const lines: string[] = []
  let cur = ''
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur)
      cur = ch
    } else {
      cur += ch
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

const EN_FONT = '700 32px sans-serif'
const ZH_FONT = '27px sans-serif'
const IPA_FONT = '24px sans-serif'
const SM_FONT = '24px sans-serif'

export async function exportSceneLongImage(
  scene: { name: string; nameEn: string; icon: string; custom?: boolean },
  materials: Material[],
): Promise<{ ok: boolean; error?: string }> {
  const mats = materials.slice(0, 40)
  if (!mats.length) return { ok: false, error: '这个场景还没有内容' }

  Taro.showLoading({ title: '生成中…', mask: true })
  try {
    // 测量画布（第一遍：只算行数与高度）
    const measureCanvas = Taro.createOffscreenCanvas({ type: '2d', width: W, height: 600 })
    const mctx: any = measureCanvas.getContext('2d')

    const layout = mats.map((m) => {
      const enLines = wrapLines(mctx, m.en, EN_FONT, TEXT_W)
      const zhLines = wrapLines(mctx, m.zh, ZH_FONT, TEXT_W)
      const ipa =
        m.type !== 'sentence' && (m.ipaUS || m.ipaUK)
          ? [`${m.ipaUS ?? ''}  ${m.ipaUK ?? ''}  ${m.pos ?? ''}`.trim()]
          : []
      const vars = m.variants.slice(0, 2).map((v) => ({ t: `${v.level}｜${v.en}  ${v.zh}`, lines: wrapLines(mctx, `${v.level}｜${v.en}  ${v.zh}`, SM_FONT, TEXT_W) }))
      const brks = m.type === 'sentence' ? m.breakdown.slice(0, 3) : []
      let h = 30 + enLines.length * 44 + 8
      if (ipa.length) h += 34
      h += zhLines.length * 38 + 8 + 36 // flags
      for (const ex of m.examples.slice(0, 2)) {
        h += wrapLines(mctx, ex.en, SM_FONT, TEXT_W).length * 32 + wrapLines(mctx, ex.zh, SM_FONT, TEXT_W).length * 28 + 14
      }
      for (const v of vars) h += v.lines.length * 34 + 8
      for (const b of brks) h += 36
      h += 26 // bottom pad
      return { m, enLines, zhLines, ipa, vars, brks, h: h + 18 }
    })

    const HEADER = 230
    const FOOTER = 110
    const H = Math.min(HEADER + layout.reduce((n, c) => n + c.h, 0) + FOOTER, 12000)

    // 正式画布
    const canvas = Taro.createOffscreenCanvas({ type: '2d', width: W, height: H })
    const ctx: any = canvas.getContext('2d')
    ctx.fillStyle = '#f4f6f5'
    ctx.fillRect(0, 0, W, H)

    // 头部
    ctx.fillStyle = '#12b886'
    ctx.font = '800 56px sans-serif'
    ctx.fillText('PronFlow', PAD, 110)
    ctx.fillStyle = '#7a828a'
    ctx.font = '26px sans-serif'
    ctx.fillText(`${scene.name} ${scene.nameEn} · ${mats.length} 条内容`, PAD, 170)
    ctx.strokeStyle = '#12b886'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(PAD, 196)
    ctx.lineTo(W - PAD, 196)
    ctx.stroke()

    let y = HEADER

    for (const c of layout) {
      const accent = c.m.type === 'word' ? '#12b886' : c.m.type === 'phrase' ? '#5c9dff' : '#ff9f43'
      // 卡片底
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(PAD, y, W - PAD * 2, c.h - 18)
      ctx.fillStyle = accent
      ctx.fillRect(PAD, y, W - PAD * 2, 6)
      ctx.strokeStyle = '#e3e7e5'
      ctx.lineWidth = 2
      ctx.strokeRect(PAD, y, W - PAD * 2, c.h - 18)

      let cy = y + 46
      // 英文
      ctx.fillStyle = '#1a1d21'
      ctx.font = EN_FONT
      for (const line of c.enLines) {
        ctx.fillText(line, PAD + 20, cy)
        cy += 44
      }
      cy += 8
      // 音标
      if (c.ipa.length) {
        ctx.fillStyle = '#6b7280'
        ctx.font = IPA_FONT
        ctx.fillText(c.ipa[0], PAD + 20, cy)
        cy += 34
      }
      // 中文
      ctx.fillStyle = '#33393f'
      ctx.font = ZH_FONT
      for (const line of c.zhLines) {
        ctx.fillText(line, PAD + 20, cy)
        cy += 38
      }
      cy += 6
      // 口语度
      const lvColor = c.m.spokenLevel === 'high' ? '#0e9e73' : c.m.spokenLevel === 'ok' ? '#4a86e8' : '#d9822b'
      ctx.fillStyle = lvColor
      ctx.font = '600 22px sans-serif'
      ctx.fillText(
        c.m.spokenLevel === 'high' ? '高频口语' : c.m.spokenLevel === 'ok' ? '口语可用' : '书面慎用',
        PAD + 20,
        cy,
      )
      if (c.m.custom) {
        ctx.fillStyle = '#7a828a'
        ctx.fillText('｜ 自定义', PAD + 130, cy)
      }
      cy += 40

      // 例句
      for (const ex of c.m.examples.slice(0, 2)) {
        ctx.fillStyle = '#33393f'
        ctx.font = SM_FONT
        for (const line of wrapLines(ctx, `— ${ex.en}`, SM_FONT, TEXT_W - 10)) {
          ctx.fillText(line, PAD + 20, cy)
          cy += 32
        }
        ctx.fillStyle = '#7a828a'
        for (const line of wrapLines(ctx, ex.zh, SM_FONT, TEXT_W - 10)) {
          ctx.fillText(line, PAD + 20, cy)
          cy += 28
        }
        cy += 12
      }

      // 换个说法
      for (const v of c.vars) {
        ctx.fillStyle = '#33393f'
        ctx.font = SM_FONT
        for (const line of v.lines) {
          ctx.fillText(line, PAD + 20, cy)
          cy += 34
        }
        cy += 6
      }

      // 拆分
      c.brks.forEach((b, i) => {
        ctx.fillStyle = '#0e9e73'
        ctx.font = '700 22px sans-serif'
        ctx.fillText(`${i + 1}`, PAD + 20, cy)
        ctx.fillStyle = '#33393f'
        ctx.font = '24px sans-serif'
        ctx.fillText(`${b.en}  ${b.zh}`, PAD + 52, cy)
        cy += 36
      })

      y += c.h
    }

    ctx.fillStyle = '#b8bfc4'
    ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('PronFlow · 专治口语失语 · 由本地数据生成', W / 2, H - 50)

    // 导出
    const tmp = (await Taro.canvasToTempFilePath({ canvas } as any)) as { tempFilePath: string }
    try {
      await Taro.saveImageToPhotosAlbum({ filePath: tmp.tempFilePath })
      return { ok: true }
    } catch {
      const res = await Taro.showModal({
        title: '需要相册权限',
        content: '请在设置中允许「保存到相册」后重试',
        confirmText: '去设置',
      })
      if (res.confirm) await Taro.openSetting()
      return { ok: false, error: '没有相册权限' }
    }
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e).slice(0, 100) }
  } finally {
    Taro.hideLoading()
  }
}
