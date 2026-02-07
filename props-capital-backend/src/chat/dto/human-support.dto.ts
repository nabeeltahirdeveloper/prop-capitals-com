import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class HumanSupportDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
