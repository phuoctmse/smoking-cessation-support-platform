export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary')) return null;

  const publicIdMatch = url.match(/\/v\d+\/(.+?)\./);
  return publicIdMatch && publicIdMatch[1] ? publicIdMatch[1] : null;
}