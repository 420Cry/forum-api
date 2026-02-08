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
        console.log(
          '[Firebase] Initialized with project:',
          credential.projectId,
        );
      } catch {
        // Ignore if invalid JSON
      }
    } else if (credentialsPath) {
      const absPath = resolve(process.cwd(), credentialsPath);
      if (!existsSync(absPath)) {
        console.error(
          '[Firebase] Credentials file not found:',
          absPath,
          '\n  Download from: Firebase Console → forum-d5f6c → Project Settings → Service Accounts → Generate new private key\n  Save as forum-d5f6c-firebase-adminsdk.json in forum-api root',
        );
        return;
      }
      try {
        const file = readFileSync(absPath, 'utf8');
        const credential = JSON.parse(file) as admin.ServiceAccount;
        this.app = admin.initializeApp({
          credential: admin.credential.cert(credential),
        });
        console.log(
          '[Firebase] Initialized with project:',
          credential.projectId,
        );
        const projectId =
          (credential as { project_id?: string }).project_id ??
          credential.projectId;
        if (projectId !== 'forum-d5f6c') {
          console.error(
            '[Firebase] WRONG PROJECT: credentials are for "' +
              projectId +
              '" but forum-app uses "forum-d5f6c".',
            '\n  Download the correct file: Firebase Console → forum-d5f6c → Project Settings → Service Accounts → Generate new private key',
          );
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(
          '[Firebase] Failed to load credentials from',
          absPath,
          'err:',
          errMsg,
        );
      }
    } else {
      console.warn(
        '[Firebase] No credentials configured (FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_APPLICATION_CREDENTIALS)',
      );
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
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[Firebase] Token verification failed:', errMsg);
      const hint = /Expected ["']([^"']+)["'] but got ["']([^"']+)["']/.exec(
        errMsg,
      )
        ? 'Firebase project mismatch: backend and frontend must use the same project. Download service account from forum-d5f6c.'
        : errMsg;
      return { error: hint };
    }
  }

  get isEnabled(): boolean {
    return !!this.app;
  }
}
