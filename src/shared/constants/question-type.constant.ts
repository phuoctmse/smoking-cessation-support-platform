import { registerEnumType } from "@nestjs/graphql";

export enum QuestionType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  BOOLEAN = 'BOOLEAN',
  SCALE = 'SCALE',
  DATE = 'DATE'
}

export enum QuizStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

registerEnumType(QuizStatus, {
    name: 'QuizStatus',
    description: 'The status of quiz',
})

registerEnumType(QuestionType, {
    name: 'QuestionType',
    description: 'The type of quiz question',
})