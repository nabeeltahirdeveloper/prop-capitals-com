import { IsString, MinLength, MaxLength } from 'class-validator';

export class AddMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message is required' })
  @MaxLength(5000, { message: 'Message must not exceed 5000 characters' })
  message: string;
}
