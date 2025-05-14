import { Injectable } from '@nestjs/common';
import { CreateDemoDto } from './dto/create-demo.dto';
import { UpdateDemoDto } from './dto/update-demo.dto';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class DemoService {
  constructor(private readonly prisma: PrismaService) {
  }
  create(createDemoDto: CreateDemoDto) {
    return this.prisma.user.create({
      data: {
        email: createDemoDto.email,
        name: createDemoDto.name,
      }
    })
  }

  findAll() {
    return this.prisma.user.findMany()  
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id: id
      }
    })
  }

  update(id: number, updateDemoDto: UpdateDemoDto) {
    return this.prisma.user.update({
      where: {
        id: id
      },
      data: updateDemoDto
    })
  }

  remove(id: number) {
    return this.prisma.user.delete({
      where: {
        id: id
      }
    })
  }
}
