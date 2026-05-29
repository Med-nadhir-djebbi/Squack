import { UserModel } from '../../users/models/user.model';

export class AuthPayload {
  accessToken: string;

  user: UserModel;
}
