import { env } from "../config/env";
import { ConsoleMailService } from "./console.mail";
import { MailService } from "./mail.service";
import { ResendMailService } from "./resend.mail";
import { SmtpMailService } from "./smtp.mail";

let mailService: MailService | null = null;

export function getMailService(): MailService {
  if (!mailService) {
    switch (env.MAIL_DRIVER) {
      case "resend":
        mailService = new ResendMailService();
        break;
      case "smtp":
        mailService = new SmtpMailService();
        break;
      case "console":
      default:
        mailService = new ConsoleMailService();
        break;
    }
  }
  return mailService;
}

export type { MailService } from "./mail.service";
