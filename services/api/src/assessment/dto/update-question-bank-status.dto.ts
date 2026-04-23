import { IsIn, IsString } from 'class-validator';

export class UpdateQuestionBankStatusDto {
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';
}
