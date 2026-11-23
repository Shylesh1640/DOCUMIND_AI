import Link from 'next/link';
import { Brain, FileText, Search, MessageSquare, ArrowRight, Zap, Shield, Database } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-800/50 backdrop-blur-md bg-dark-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-navy-600/20 rounded-lg border border-navy-500/30">
                <Brain className="w-6 h-6 text-navy-300" />
              </div>
              <span className="text-lg font-bold text-white">DocuMind AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/chat"
                className="btn-primary flex items-center gap-2 text-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-900/50 border border-navy-700/50 text-navy-300 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Powered by RAG + OpenAI + pgvector
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-white">Your documents.</span>
            <br />
            <span className="text-gradient">Your knowledge.</span>
            <br />
            <span className="text-white">Your AI.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-dark-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            DocuMind AI is an intelligent research assistant that answers questions
            using{' '}
            <strong className="text-dark-100">only</strong> information from your
            uploaded documents — with source citations, no hallucinations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat"
              className="btn-primary flex items-center gap-2 text-base px-6 py-3"
            >
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="https://github.com/yourusername/documind-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2 text-base px-6 py-3"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 animate-slide-up">
          <FeatureCard
            icon={<FileText className="w-6 h-6 text-navy-300" />}
            title="Document Ingestion"
            description="Upload PDF, TXT, and DOCX files. Documents are automatically chunked, embedded, and indexed into a vector database."
          />
          <FeatureCard
            icon={<Search className="w-6 h-6 text-blue-300" />}
            title="Vector Similarity Search"
            description="Every question triggers a semantic search across your knowledge base using OpenAI embeddings and pgvector cosine similarity."
          />
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6 text-purple-300" />}
            title="Grounded Answers"
            description="Responses are strictly grounded in retrieved document passages. Citations show exactly which document and excerpt was used."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-4">How It Works</h2>
        <p className="text-dark-300 text-center mb-16 max-w-2xl mx-auto">
          A genuine Retrieval-Augmented Generation (RAG) pipeline — not a ChatGPT wrapper.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Upload', desc: 'Upload your PDF, TXT, or DOCX documents to the knowledge base.', icon: '📤' },
            { step: '02', title: 'Index', desc: 'Text is extracted, chunked into ~600 token segments, and embedded with OpenAI.', icon: '🔢' },
            { step: '03', title: 'Retrieve', desc: 'Your question is embedded and matched against stored vectors using cosine similarity.', icon: '🔍' },
            { step: '04', title: 'Answer', desc: 'GPT generates an answer grounded only in the retrieved document passages.', icon: '💬' },
          ].map((item) => (
            <div key={item.step} className="glass-card p-6 relative">
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="text-xs font-mono text-navy-400 mb-2">{item.step}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-dark-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-card p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TrustItem
              icon={<Shield className="w-8 h-8 text-green-400" />}
              title="No Hallucinations"
              desc="Engineered system prompt ensures the AI only answers from your documents. It explicitly refuses to invent information."
            />
            <TrustItem
              icon={<Database className="w-8 h-8 text-blue-400" />}
              title="Secure Storage"
              desc="Documents stored in Supabase PostgreSQL with pgvector. API keys never exposed to the browser."
            />
            <TrustItem
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Always Cited"
              desc="Every answer includes source citations with document name, chunk index, and the exact retrieved passage."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-8 px-4 sm:px-6 text-center text-dark-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-navy-500" />
          <span className="text-dark-400 font-medium">DocuMind AI</span>
        </div>
        <p>Built with Next.js, OpenAI, Supabase pgvector, and Vercel.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card p-6 hover:border-navy-700/50 transition-all duration-300 hover:-translate-y-1">
      <div className="p-2.5 bg-dark-900/50 rounded-lg w-fit mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-dark-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-dark-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
