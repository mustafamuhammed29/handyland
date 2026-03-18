export interface Reply {
    _id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
}

export interface Message {
    _id: string;
    name: string;
    email: string;
    message: string;
    status: 'unread' | 'read' | 'replied' | 'closed';
    initiatedByAdmin?: boolean;
    replies: Reply[];
    createdAt: string;
}

export type ViewState = 'list' | 'thread' | 'new';
