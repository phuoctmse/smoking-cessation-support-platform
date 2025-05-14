import { Injectable } from '@nestjs/common';
import { CreateDemoGraphqlInput } from './dto/create-demo-graphql.input';
import { UpdateDemoGraphqlInput } from './dto/update-demo-graphql.input';

@Injectable()
export class DemoGraphqlService {
  create(createDemoGraphqlInput: CreateDemoGraphqlInput) {
    return { input: createDemoGraphqlInput.input }
  }

  findAll() {
    return [{ input: 1 }, // Example data
    { input: 2 }, // Example data   
    ]
  }

  findOne(id: number) {
    return { exampleField: id }
  }

  update(id: number, updateDemoGraphqlInput: UpdateDemoGraphqlInput) {
    return `This action updates a #${id} demoGraphql`;
  }

  remove(id: number) {
    return `This action removes a #${id} demoGraphql`;
  }
}
