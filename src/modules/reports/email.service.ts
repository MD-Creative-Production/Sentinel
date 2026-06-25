import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendReport(content: string, subject: string) {
    await this.transporter.sendMail({
      from: `Security Reports <${process.env.SMTP_USER}>`,
      to: process.env.REPORT_RECIPIENT,
      subject,
      text: content,
    });
  }
}
