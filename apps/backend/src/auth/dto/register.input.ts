import {
  IsByteLength,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterInput {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'username may only contain letters, numbers, dots, underscores, and hyphens',
  })
  username: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsByteLength(8, 72)
  password: string;
}
