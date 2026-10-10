export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export interface MailService {
  send(payload: MailPayload): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}
