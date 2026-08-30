// 把网页版工程的共享纯逻辑镜像到小程序工程（保持相对结构，导入路径天然兼容）
// 用法：npm run sync-shared（数据或逻辑变更后执行）
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')
const outDir = path.join(root, 'mp', 'src', 'shared', 'web')

// 需要镜像的内容：类型 / 场景数据 / 搜索 / 联想
const ITEMS = [
  { from: 'types.ts', to: 'types.ts' },
  { from: 'data', to: 'data' },
  { from: path.join('services', 'search.ts'), to: path.join('services', 'search.ts') },
  { from: path.join('services', 'suggest.ts'), to: path.join('services', 'suggest.ts') },
]

function copyItem(from, to) {
  const fromFull = path.join(srcDir, from)
  const toFull = path.join(outDir, to)
  if (fs.statSync(fromFull).isDirectory()) {
    fs.mkdirSync(toFull, { recursive: true })
    for (const name of fs.readdirSync(fromFull)) {
      copyItem(path.join(from, name), path.join(to, name))
    }
  } else {
    fs.mkdirSync(path.dirname(toFull), { recursive: true })
    fs.copyFileSync(fromFull, toFull)
  }
}

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })
for (const item of ITEMS) copyItem(item.from, item.to)

let count = 0
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full)
    else count++
  }
}
walk(outDir)
console.log(`✅ 已同步 ${count} 个共享文件到 mp/src/shared/web/`)
