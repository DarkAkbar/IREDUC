import nodemailer from "nodemailer";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { MailPayload, MailService } from "./mail.service";

export class SmtpMailService implements MailService {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  async send(payload: MailPayload): Promise<void> {
    if (!env.SMTP_HOST) {
      throw new AppError(
        "SMTP_HOST est requis lorsque MAIL_DRIVER=smtp",
        500,
        "MAIL_CONFIG_ERROR"
      );
    }

    await this.transporter.sendMail({
      from: env.MAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html ?? `<pre>${payload.text}</pre>`,
    });
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    code?: string
  ): Promise<void> {
    const link = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;
    const codeLine = code
      ? `\nCode à 6 chiffres (valable 24 h) : ${code}\n`
      : "";
    await this.send({
      to,
      subject: "Vérifiez votre adresse e-mail — IREDUC",
      text: `Bienvenue sur IREDUC.\n${codeLine}\nPour vérifier votre e-mail, saisissez le code dans l'application ou ouvrez : ${link}\n\nCe lien et le code expirent dans 24 heures.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.APP_URL}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: "Réinitialisation du mot de passe — IREDUC",
      text: `Vous avez demandé la réinitialisation de votre mot de passe.\n\nJeton : ${token}\nLien : ${link}\n\nCe lien expire dans 24 heures.`,
    });
  }
}
