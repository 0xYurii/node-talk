declare global {
    namespace Express {
        interface User {
            id: number;
            username: string;
            email: string;
            avatarUrl: string;
            isPrivate: boolean;
        }
    }
}

export {};
