import { env } from "../config/env";
import { MailPayload, MailService } from "./mail.service";

export class ConsoleMailService implements MailService {
  async send(payload: MailPayload): Promise<void> {
    console.log("──────────── E-mail (console) ────────────");
    console.log(`À : ${payload.to}`);
    console.log(`Sujet : ${payload.subject}`);
    console.log(payload.text);
    console.log("─────────────────────────────────────────");
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
    if (code) {
      console.log(`[VERIFY_EMAIL_CODE] ${to} → ${code}`);
    }
    await this.send({
      to,
      subject: "Vérifiez votre adresse e-mail — IREDUC",
      text: `Bienvenue sur IREDUC.\n${codeLine}\nPour vérifier votre e-mail, saisissez le code dans l'application ou ouvrez : ${link}\n\nJeton (lien) : ${token}\nCe lien et le code expirent dans 24 heures.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${env.APP_URL}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: "Réinitialisation du mot de passe — IREDUC",
      text: `Vous avez demandé la réinitialisation de votre mot de passe.\n\nJeton : ${token}\nLien : ${link}\n\nCe lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`,
    });
  }
}
