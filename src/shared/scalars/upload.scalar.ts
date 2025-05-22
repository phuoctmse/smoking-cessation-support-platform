import { Scalar } from '@nestjs/graphql';
import { GraphQLScalarType } from 'graphql';

@Scalar('FileUpload')
export class UploadScalar extends GraphQLScalarType {
  constructor() {
    super({
      name: 'FileUpload',
      description: 'The `FileUpload` scalar type represents a file upload.',
      parseValue: value => value,
      parseLiteral: ast => {
        throw new Error('Upload scalar cannot be parsed from AST');
      },
      serialize: value => value,
    });
  }
}