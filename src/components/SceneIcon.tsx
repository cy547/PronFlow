/** 场景图标：支持 emoji 或自定义上传的图片（dataURL） */
export function SceneIcon({ icon, size = 26 }: { icon: string; size?: number }) {
  if (icon.startsWith('data:')) {
    return (
      <img
        src={icon}
        alt=""
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: size * 0.24, display: 'block' }}
      />
    )
  }
  return <span style={{ fontSize: size, lineHeight: 1 }}>{icon}</span>
}
