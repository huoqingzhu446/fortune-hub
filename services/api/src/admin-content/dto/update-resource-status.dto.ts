import { IsIn, IsString } from 'class-validator';

export class UpdateResourceStatusDto {
  @IsString()
  @IsIn(['draft', 'published', 'archived'])
  status!: 'draft' | 'published' | 'archived';
}
