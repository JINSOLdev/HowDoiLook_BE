import admin from 'firebase-admin';

type FirebaseConfig = admin.ServiceAccount & {
  private_key?: string
}

const raw = process.env.FIREBASE_CONFIG;

if (!raw) {
  console.error('.env에 FIREBASE_CONFIG 내용 없음');
  process.exit(1);
}

let serviceAccount: FirebaseConfig;

try {
  serviceAccount = JSON.parse(raw) as FirebaseConfig;

  // 줄바꿈 복원
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (error) {
  console.error('FIREBASE_CONFIG 파싱 실패:', error);
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://nb02-how-do-i-look-storage.firebasestorage.app',
  });
}

const bucket = admin.storage().bucket();
export default bucket;
