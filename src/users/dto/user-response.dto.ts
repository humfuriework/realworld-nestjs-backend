export interface UserDto {
  email: string;
  token: string;
  username: string;
  bio: string | null;
  image: string | null;
}

export interface UserResponse {
  user: UserDto;
}
