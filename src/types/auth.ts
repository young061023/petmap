export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  name: string;
  passwordConfirmation: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

export interface AuthSession {
  accessToken: string;
  userId: string;
}
