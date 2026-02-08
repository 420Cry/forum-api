import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: admin.app.App | null = null;

  onModuleInit() {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const credentialsPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ??
      process.env.FIREBASE_APPLICATION_CREDENTIALS;

    if (serviceAccountJson) {
      try {
        const credential = JSON.parse(
          serviceAccountJson,
        ) as admin.ServiceAccount;
        this.app = admin.initializeApp({
          credential: admin.credential.cert(credential),
        });
      } catch {
        // Ignore if invalid JSON
      }
    } else if (credentialsPath) {
      const absPath = resolve(process.cwd(), credentialsPath);
      if (!existsSync(absPath)) {
        console.error('[Firebase] Credentials file not found:', absPath);
        return;
      }
      try {
        const file = readFileSync(absPath, 'utf8');
        const credential = JSON.parse(file) as admin.ServiceAccount;
        this.app = admin.initializeApp({
          credential: admin.credential.cert(credential),
        });
      } catch (err) {
        console.error(
          '[Firebase] Failed to load credentials:',
          err instanceof Error ? err.message : err,
        );
      }
    } else {
      console.warn('[Firebase] No credentials configured');
    }
  }

  async verifyIdToken(
    token: string,
  ): Promise<{ decoded: admin.auth.DecodedIdToken } | { error: string }> {
    if (!this.app) return { error: 'Firebase not initialized' };
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      return { decoded };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  get isEnabled(): boolean {
    return !!this.app;
  }
}
