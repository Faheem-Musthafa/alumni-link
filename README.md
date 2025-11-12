# CampusLink - Mentorship & Career Guidance Platform

A role-based SaaS platform connecting students, alumni, and aspirants through verified mentorship and career guidance for Indian colleges.

## Features

- 🔐 **Role-based Authentication** - Student, Alumni, and Aspirant roles with Firebase Auth
- 👥 **Mentorship System** - Request and manage mentorship sessions with verified mentors
- 💬 **Real-time Chat** - Communicate with mentors and peers using Firestore
- 💼 **Job Postings** - Alumni can post jobs, internships, and referrals
- 📧 **Notifications** - Email and WhatsApp notifications via Resend and Twilio
- 📱 **Modern UI** - Built with Next.js, Tailwind CSS, and Shadcn/UI

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Notifications**: Resend (Email), Twilio (WhatsApp)
- **Hosting**: Vercel / Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- (Optional) Resend API key for email notifications
- (Optional) Twilio account for WhatsApp notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alumniLink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials:
   ```bash
   cp .env.local.example .env.local
   ```

   Required environment variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

   Optional (for notifications):
   - `RESEND_API_KEY` - For email notifications
   - `TWILIO_ACCOUNT_SID` - For WhatsApp notifications
   - `TWILIO_AUTH_TOKEN` - For WhatsApp notifications
   - `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp sender number

4. **Set up Firebase**

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Enable Storage
   - Deploy security rules:
     ```bash
     firebase deploy --only firestore:rules
     firebase deploy --only storage
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── (auth)/           # Authentication pages (login, signup)
│   ├── api/              # API routes (notifications)
│   ├── chat/             # Chat interface
│   ├── dashboard/        # Dashboard pages
│   ├── jobs/             # Job postings
│   ├── mentorship/       # Mentorship pages
│   └── profile/          # Profile management
├── components/
│   ├── layout/           # Layout components (sidebar, main layout)
│   └── ui/               # Shadcn/UI components
├── lib/
│   ├── firebase/         # Firebase configuration and utilities
│   └── services/         # Service layer (notifications, etc.)
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Features Implementation

### Authentication
- Role-based sign-up with Student, Alumni, and Aspirant roles
- Firebase Authentication with email/password
- Email verification flow
- Protected routes with middleware

### Mentorship System
- Students can request mentorship from alumni
- Alumni can accept/reject requests
- Status tracking (pending, accepted, rejected, completed)
- Session scheduling and feedback

### Real-time Chat
- One-on-one messaging using Firestore
- Real-time message updates
- Conversation management
- Message read status

### Job Postings
- Alumni can create job postings
- Students can browse and apply
- Application tracking
- Referral posting support

### Notifications
- Email notifications via Resend API
- WhatsApp notifications via Twilio API
- In-app notification system
- Notification preferences

## Firebase Security Rules

The project includes Firestore and Storage security rules:
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules

Deploy them using:
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy --only hosting`

## Development

### Code Style
- Uses ESLint for linting
- TypeScript for type safety
- Prettier for code formatting (optional)

### Adding Shadcn/UI Components
```bash
npx shadcn@latest add [component-name]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
