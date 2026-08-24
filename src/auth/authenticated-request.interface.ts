import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    orgId: number | null;
    payload: any;
    user: any;
  };
}
