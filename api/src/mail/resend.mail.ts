import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { MailPayload, MailService } from "./mail.service";

export class ResendMailService implements MailService {
  async send(payload: MailPayload): Promise<void> {
    if (!env.RESEND_API_KEY) {
      throw new AppError(
        "RESEND_API_KEY est requis lorsque MAIL_DRIVER=resend",
        500,
        "MAIL_CONFIG_ERROR"
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
        html: payload.html ?? `<pre>${payload.text}</pre>`,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError(
        "Échec de l'envoi de l'e-mail via Resend",
        502,
        "MAIL_SEND_FAILED",
        body
      );
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;
    await this.send({
      to,
      subject: "Vérifiez votre adresse e-mail — IREDUC",
      text: `Bienvenue sur IREDUC.\n\nPour vérifier votre e-mail, utilisez ce jeton : ${token}\nOu ouvrez : ${link}\n\nCe lien expire dans 24 heures.`,
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
