import {
  IsNumber,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const noSpecialChars = /^[a-zA-Z0-9\s]+$/;

export class UserInfoDto {
  @IsString()
  @MinLength(2, { message: 'First name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'First name must not contain special characters',
  })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Last name must not contain special characters',
  })
  lastName: string;

  @IsNumber({ allowNaN: false }, { message: 'Age invalid format' })
  @Min(5, { message: 'Age must be at least 5' })
  @Max(100, { message: 'Age must be below 100' })
  age: number;

  @IsString()
  @MinLength(2, { message: 'Location must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Location must not contain special characters',
  })
  location: string;

  @IsString()
  @MinLength(2, { message: 'Occupation must have at least 2 characters' })
  @Matches(noSpecialChars, {
    message: 'Occupation must not contain special characters',
  })
  occupation: string;
}
