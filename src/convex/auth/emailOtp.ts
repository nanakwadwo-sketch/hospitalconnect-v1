import { Email } from "@convex-dev/auth/providers/Email";
import { Resend } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        const randomBytes = new Uint8Array(bytes.length);
        crypto.getRandomValues(randomBytes);
        bytes.set(randomBytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const runtimeProcess = (globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }).process;

    const resendKey = runtimeProcess?.env?.AUTH_RESEND_KEY;

    if (!resendKey) {
      throw new Error("Missing AUTH_RESEND_KEY environment variable.");
    }

    const resend = new Resend(resendKey);

    const { error } = await resend.emails.send({
      from: "Kwahu Hospital <onboarding@resend.dev>", // change later to your domain
      to: [email],
      subject: "Your sign-in code",
      text: `Your verification code is: ${token}\n\nThis code expires in 15 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Kwahu Government Hospital</h2>
          <p>Your sign-in code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${token}</p>
          <p style="color: #666;">This code expires in 15 minutes.</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Could not send sign-in code: ${error.message}`);
    }
  },
});