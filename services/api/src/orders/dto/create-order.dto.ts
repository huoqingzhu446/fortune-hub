import { IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @MaxLength(32)
  productCode!: string;
}
