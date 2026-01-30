import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from '../lib/auth';
export enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SELLER = "SELLER"
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                name: string;
                email: string;
                role: string;
                emailVerified: boolean;
            }
        }
    }
}

const auth = (...roles: UserRole[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Authentication logic here
            //get user session
            const session = await betterAuth.api.getSession({ headers: req.headers as any })

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized"
                })
            }
            if (!session.user.emailVerified) {
                return res.status(403).json({
                    success: false,
                    message: "Please verify your email to access this resource"
                })
            }

            req.user = {
                id: session.user.id,
                name: session.user.name!,
                email: session.user.email,
                role: session.user.role!,
                emailVerified: session.user.emailVerified
            }
            if (roles.length && !roles.includes(req.user.role as UserRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden! You don't have enough permission to access this resource."
                })
            }
            next();
        } catch (error) {
            next(error);

        }
    }
}

export default auth;