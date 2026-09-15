declare namespace Express {
  export interface Request {
    auth?: {
      readonly userId: string;
    };
  }
}
