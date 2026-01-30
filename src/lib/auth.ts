import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: process.env.APP_USER,
        pass: process.env.APP_PASSWORD,
    },
});


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    trustedOrigins: [process.env.APP_URL || "http://localhost:4000"],
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "CUSTOMER",
                required: false
            },
            phone: {
                type: "string",
                required: true
            },
            status: {
                type: "string",
                defaultValue: "ACTIVE",
                required: false
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url, token }, request) => {
            try {
                const verificationUrl = `${process.env.APP_URL}/verify-email?token=${token}`;
                const info = await transporter.sendMail({
                    from: '"Medistore" <medistore@gmail.com>',
                    to: user.email,
                    subject: "Verify your email address",
                    text: `Please verify your email address by clicking on this link: ${url}`, // Plain-text version of the message
                    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
      <tr>
        <td align="center">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;"
          >
            <!-- Header -->
            <tr>
              <td style="background-color: #16a34a; padding: 20px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff;">MediStore</h1>
                <p style="margin: 5px 0 0; color: #dcfce7;">
                  Your Trusted Online Medicine Shop
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px; color: #111827;">
                <h2 style="margin-top: 0;">Verify your email address</h2>

                <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                  Hi <strong>${user.name ?? "there"}</strong>,
                </p>

                <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                  Thanks for signing up to <strong>MediStore</strong>!  
                  Please confirm your email address by clicking the button below.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a
                    href="${verificationUrl}"
                    style="
                      background-color: #16a34a;
                      color: #ffffff;
                      padding: 12px 24px;
                      text-decoration: none;
                      border-radius: 6px;
                      font-weight: bold;
                      display: inline-block;
                    "
                  >
                    Verify Email
                  </a>
                </div>

                <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>

                <p style="font-size: 13px; color: #2563eb; word-break: break-all;">
                  ${verificationUrl}
                </p>

                <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
                  If you didn’t create an account, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 15px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                  © ${new Date().getFullYear()} MediStore. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`, // HTML version of the message
                });

                console.log("Message sent:", info.messageId);
            } catch (error) {
                console.error("Error sending verification email:", error);
                throw new Error("Could not send verification email");
            }

        },
    },
});