import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => LoginUserDto)
  user: LoginUserDto;
}
