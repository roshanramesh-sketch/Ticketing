export interface Ticket {
  id: number;
  subject: string;
  content: string;
  status: "open" | "in_progress" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  requester_id: number;
  assignee_id?: number;
  created_time: string;
  updated_time: string;
  archived_time?: string;
  bin_id?: number;
  is_duplicate_of?: number;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_email: string;
  message_body: string;
  message_type: "EMAIL" | "COMMENT";
  message_id_header?: string;
  timestamp: string;
}

export interface KBItem {
  id: number;
  title: string;
  content: string;
  category: string;
  author_id: number;
  created_time: string;
  source_ticket_id?: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  total_tickets_created: number;
  total_tickets_archived: number;
  tickets_created_today: number;
  tickets_open_today: number;
  tickets_open: number;
  tickets_archived_today: number;
}

export interface TicketBin {
  id: number;
  name: string;
  description?: string;
  manager_id?: number;
  created_time: string;
}
