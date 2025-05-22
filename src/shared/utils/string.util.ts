import slugify from 'slugify'

export function generateSlug(text: string, addRandomSuffix = true): string {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'vi',
  })

  if (!addRandomSuffix) {
    return baseSlug
  }

  const randomSuffix = Math.floor(Math.random() * 10000)
  return `${baseSlug}-${randomSuffix}`
}
