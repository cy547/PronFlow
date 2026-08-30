// 验证部署包内部路径使用正斜杠
const JSZip = require('jszip')
const fs = require('fs')

JSZip.loadAsync(fs.readFileSync('pronflow-deploy.zip')).then((z) => {
  const names = Object.keys(z.files).filter((n) => !z.files[n].dir)
  console.log('包内文件:')
  names.forEach((n) => console.log(' ', n))
  console.log('含反斜杠:', names.some((n) => n.includes('\\')))
})
