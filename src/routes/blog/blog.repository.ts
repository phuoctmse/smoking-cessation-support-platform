import { BlogQueryParamsType, CreateBlogType, UpdateBlogType } from './model/blog.model'
import { PrismaService } from '../../shared/services/prisma.service'
import { Injectable } from '@nestjs/common'
import { generateSlug } from '../../shared/utils/string.util'
import { Prisma } from '@prisma/client'

@Injectable()
export class BlogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: BlogQueryParamsType) {
    const { page, limit, search, orderBy, sortOrder } = params
    const skip = (page - 1) * limit

    const where: Prisma.BlogWhereInput = {
      is_deleted: false,
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          content: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.blog.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      hasNext: total > page * limit,
    }
  }

  findOne(id: string) {
    return this.prisma.blog.findUnique({
      where: { id, is_deleted: false },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    })
  }

  findBySlug(slug: string) {
    return this.prisma.blog.findUnique({
      where: { slug, is_deleted: false },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    })
  }

  create(data: CreateBlogType, authorId: string) {
    const slug = generateSlug(data.title)

    return this.prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        cover_image: data.cover_image,
        slug,
        author: {
          connect: {
            id: authorId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    })
  }

  update(id: string, data: UpdateBlogType) {
    const updateData: Prisma.BlogUpdateInput = { ...data }

    if (data.title) {
      updateData.slug = generateSlug(data.title)
    }

    return this.prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    return this.prisma.blog.update({
      where: { id },
      data: { is_deleted: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    })
  }
}
