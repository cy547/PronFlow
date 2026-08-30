// 一键打包部署 zip（正斜杠路径，供 EdgeOne Pages 直接上传）
// 用法：npm run package（先 npm run build）
const JSZip = require('jszip')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const outFile = path.join(root, 'pronflow-deploy.zip')

function addDir(zip, dir, base) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const rel = base ? base + '/' + name : name
    if (fs.statSync(full).isDirectory()) addDir(zip, full, rel)
    else zip.file(rel, fs.readFileSync(full))
  }
}

;(async () => {
  if (!fs.existsSync(dist)) {
    console.error('dist 不存在，请先执行 npm run build')
    process.exit(1)
  }
  const zip = new JSZip()
  addDir(zip, dist, '')
  // 边缘函数（数据同步 API）随包一起部署
  const efDir = path.join(root, 'edge-functions')
  if (fs.existsSync(efDir)) addDir(zip, efDir, 'edge-functions')
  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })
  fs.writeFileSync(outFile, buf)
  console.log(`✅ ${outFile}  ${(buf.length / 1024 / 1024).toFixed(2)} MB`)
})()
