import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as nodemailer from "nodemailer";
import {initializeApp} from "firebase-admin/app";
import {getAppCheck} from "firebase-admin/app-check";
import type {Request} from "firebase-functions/v2/https";

initializeApp();
setGlobalOptions({maxInstances: 10});

const gmailAppPassword = defineSecret("GMAIL_APP_PASSWORD");

// SMTP認証(送信元)アカウント。実際の宛先はCONTACT_TO。
const SMTP_USER = "mkmk.0824f0824@gmail.com";
const CONTACT_TO = "muly.support@gmail.com";

const CATEGORY_LABELS: Record<string, string> = {
  bug: "不具合報告",
  feature: "機能要望",
  privacy: "プライバシーポリシーについて",
  other: "その他",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// お問い合わせフォームを載せるサイトのオリジン。
const ALLOWED_ORIGINS = [
  "https://muly.web.app",
  "https://muly.firebaseapp.com",
];

interface ContactPayload {
  name?: string;
  email?: string;
  category?: string;
  appVersion?: string;
  iosVersion?: string;
  message?: string;
}

/**
 * 自サイト(App Check登録済みアプリ)からのリクエストであることを検証する。
 * bot/外部スクリプトからの直接POSTを弾くための対策。
 * @param {Request} req Express request.
 * @return {Promise<boolean>} True if the App Check token is valid.
 */
async function isVerifiedAppCheckRequest(req: Request): Promise<boolean> {
  const token = req.header("X-Firebase-AppCheck");
  if (!token) return false;
  try {
    await getAppCheck().verifyToken(token);
    return true;
  } catch (err) {
    logger.warn("App Check verification failed", err);
    return false;
  }
}

export const submitContact = onRequest(
  {secrets: [gmailAppPassword]},
  async (req, res) => {
    // Hostingは別プロジェクト(musiclibrary-app)のmulyサイトにあるため
    // rewriteを跨げず、ページから直接このURLを叩く。許可オリジンは明示列挙する。
    const origin = req.header("Origin") ?? "";
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, X-Firebase-AppCheck");
      res.set("Access-Control-Max-Age", "3600");
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    if (!(await isVerifiedAppCheckRequest(req))) {
      res.status(401).json({error: "unauthorized"});
      return;
    }

    const body = (req.body ?? {}) as ContactPayload;
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const category = (body.category ?? "").toString().trim();
    const appVersion = (body.appVersion ?? "").toString().trim();
    const iosVersion = (body.iosVersion ?? "").toString().trim();
    const message = (body.message ?? "").toString().trim();

    if (!email || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({error: "invalid email"});
      return;
    }
    if (!category || !(category in CATEGORY_LABELS)) {
      res.status(400).json({error: "invalid category"});
      return;
    }
    if (!message) {
      res.status(400).json({error: "invalid message"});
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_USER,
        pass: gmailAppPassword.value(),
      },
    });

    const bodyLines = [
      `お問い合わせ種別: ${CATEGORY_LABELS[category]}`,
      `お名前: ${name || "(未入力)"}`,
      `メールアドレス: ${email}`,
      `アプリバージョン: ${appVersion || "(未入力)"}`,
      `iOSバージョン: ${iosVersion || "(未入力)"}`,
      "",
      "お問い合わせ内容:",
      message,
    ];

    try {
      await transporter.sendMail({
        from: `"MuLy お問い合わせ" <${SMTP_USER}>`,
        to: CONTACT_TO,
        replyTo: email,
        subject: `[MuLy] ${CATEGORY_LABELS[category]}からのお問い合わせ`,
        text: bodyLines.join("\n"),
      });
      res.status(200).json({ok: true});
    } catch (err) {
      logger.error("Failed to send contact email", err);
      res.status(500).json({error: "failed to send"});
    }
  }
);
