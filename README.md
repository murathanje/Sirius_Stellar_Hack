# Sirius Stellar AI Chat - A Passkey-Powered Agentic Wallet

This project is a Next.js application that implements a modern, secure, and intelligent Stellar wallet. It functions as an **Agentic Wallet**, where an AI assistant, powered by Google's Gemini 2.0 Flash model, can perform blockchain operations based on conversational commands from the user.

The core security of the wallet is built on **Passkey technology**, eliminating the need for traditional passwords or seed phrases. Users can create and access their wallets using device-level biometrics (like fingerprint or face ID) or a PIN.

## Features

- **️ Passkey-Based Security**: Create and manage your wallet without passwords. Secure, phishing-resistant, and user-friendly.
- ** Conversational AI Agent**: Interact with the Stellar network using natural language.
- **AI-Powered Transactions**:
  - **Balance Inquiry**: Ask the AI for the balance of any Stellar address.
  - **Token Transfers**: Initiate token transfers by simply telling the AI what you want to do (e.g., "Send 10 XLM to G..."). All transfers require secure confirmation via passkey.
- **Modern UI**: A clean and intuitive interface for managing your account, viewing your balance, and sending transfers manually.
- ** Client-Side Security**: Secret keys are never exposed to the server for transfers; all transactions initiated by the AI are signed on the client-side using the passkey credential.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org) (version 18.x or later recommended)
- [npm](https://www.npmjs.com), [yarn](https://yarnpkg.com), or [pnpm](https://pnpm.io)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd Sirius_Stellar_Hack
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables. Create a file named `.env.local` in the root of the project and add the following variables:

    ```env
    NEXT_PUBLIC_PARENT_SECRET_KEY=YOUR_STELLAR_SECRET_KEY
    NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
    NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY=YOUR_API_KEY
    ```
    
    Replace `YOUR_STELLAR_SECRET_KEY` with your actual Stellar account secret key.

### Running the Development Server

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
