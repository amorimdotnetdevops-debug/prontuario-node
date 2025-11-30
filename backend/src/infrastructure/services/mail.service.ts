import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
type MailerTransporter = {
  sendMail: (opts: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<void>;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: MailerTransporter | null = null;

  constructor(private readonly config: ConfigService) {}

  private getTransporter(): MailerTransporter | null {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP não configurado. Usando log de desenvolvimento.');
      return null;
    }
    const nm = nodemailer as unknown as {
      createTransport: (opts: {
        host: string;
        port: number;
        secure: boolean;
        auth: { user: string; pass: string };
      }) => MailerTransporter;
    };
    this.transporter = nm.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const base = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    const url = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    const from = this.config.get<string>('SMTP_FROM') ?? 'no-reply@localhost';
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.log(`Password reset for ${email}: ${url}`);
      return;
    }
    await transporter.sendMail({
      from,
      to: email,
      subject: 'Redefinição de senha',
      text: `Para redefinir sua senha, acesse: ${url}`,
      html: `<p>Para redefinir sua senha, clique no link:</p><p><a href="${url}">${url}</a></p>`,
    });
  }
}
