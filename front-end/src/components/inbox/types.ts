export interface Reply {
    _id?: string;
    id?: string;
    message: string;
    isAdmin?: boolean;
    is_admin?: boolean;
    is_internal_note?: boolean;
    user_id?: string | null;
    createdAt?: string | number | Date;
    created_at?: string | number | Date;
}

export interface Message {
    _id?: string;
    id?: string;
    user_id?: string | null;
    name: string;
    email: string;
    message: string;
    status: 'unread' | 'read' | 'replied' | 'closed';
    initiatedByAdmin?: boolean;
    initiated_by_admin?: boolean;
    replies?: Reply[];
    message_replies?: Reply[];
    createdAt?: string | number | Date;
    created_at?: string | number | Date;
    updatedAt?: string;
    updated_at?: string;
}

export type ViewState = 'list' | 'thread' | 'new';
