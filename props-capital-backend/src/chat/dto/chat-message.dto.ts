import { IsString, IsNotEmpty } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
