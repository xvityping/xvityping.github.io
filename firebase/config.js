/* ================================================
   XVITYPING — FIREBASE CONFIG
   firebase/config.js

   HOW TO SETUP:
   1. Go to https://console.firebase.google.com
   2. Create a new project (e.g. "xvityping")
   3. Add a Web App → copy the config below
   4. Enable Firestore Database (production mode)
   5. Enable Anonymous Authentication
   6. Set Firestore rules (see bottom of this file)
================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

/* ================================================
   FIRESTORE SECURITY RULES
   Paste these in Firebase Console → Firestore → Rules

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       // Visitors — anyone can write their own session
       match /visitors/{docId} {
         allow read:  if false;          // admin only via SDK
         allow write: if true;           // anonymous tracking
       }

       // Daily stats — read for admin, write for tracker
       match /daily_stats/{date} {
         allow read:  if false;
         allow write: if true;
       }

       // Sessions — write only
       match /sessions/{docId} {
         allow read:  if false;
         allow write: if true;
       }

       // Admin stats — read only via admin auth
       match /admin_meta/{docId} {
         allow read:  if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
================================================ */

/* ================================================
   TRACKING FEATURE FLAGS
   Set false to disable specific tracking
================================================ */

const TRACKING = {
  enabled:       true,   // master switch
  visitors:      true,   // log each page visit
  sessions:      true,   // log typing session data
  dailyStats:    true,   // aggregate daily counters
  pageTime:      true,   // track time on page
};

/* Admin panel path — change if you want */
const ADMIN_PATH = 'xvi7admin';
