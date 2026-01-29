declare global {
    namespace Express {
        interface User {
            id: number;
            username: string;
            email: string;
            avatarUrl: string;
            isPrivate: boolean;
        }
        interface Locals {
            post?: {
                id: number;
                authorId: number;
                user: {
                    id: number;
                    username: string;
                    avatarUrl: string;
                    isPrivate: boolean;
                };
                _count?: {
                    likes: number;
                    comments: number;
                };
                likes?: { id: number }[];
            };
        }
    }
}

export {};
