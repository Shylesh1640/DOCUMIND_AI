import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DocuMind AI — Your documents. Your knowledge. Your AI.',
  description:
    'Intelligent document-grounded AI assistant powered by RAG (Retrieval-Augmented Generation). Upload your documents and ask questions grounded in your knowledge base.',
  keywords: ['AI', 'RAG', 'document assistant', 'knowledge base', 'Groq', 'ChromaDB'],
  openGraph: {
    title: 'DocuMind AI',
    description: 'Your documents. Your knowledge. Your AI.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-dark-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
