export interface DigestRecipient {
  userId: string;
  email: string;
  name: string;
  items: Array<{ title: string; topic: string | null; type: string; sourceUrl: string }>;
}

export interface NotificationResult {
  sent: number;
  skipped: number;
  errors: string[];
}
