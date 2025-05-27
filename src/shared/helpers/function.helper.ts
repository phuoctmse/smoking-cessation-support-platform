import { UnauthorizedException } from '@nestjs/common'

export function extractAccessToken(request: any): string | null {
  const authHeader = request.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid Authorization header')
  }
  return authHeader.split(' ')[1]
}
