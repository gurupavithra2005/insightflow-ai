import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'InsightFlow — Customer Feedback & Decision Platform',
  description: 'Turn Customer Feedback Into Clear Decisions. Understand customer sentiment, uncover recurring problems, and discover what deserves attention next.',
  openGraph: {
    title: 'InsightFlow — Customer Feedback & Decision Platform',
    description: 'Turn Customer Feedback Into Clear Decisions. Understand customer sentiment, uncover recurring problems, and discover what deserves attention next.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightFlow — Customer Feedback & Decision Platform',
    description: 'Turn Customer Feedback Into Clear Decisions. Understand customer sentiment, uncover recurring problems, and discover what deserves attention next.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
