import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ChungToiXayWeb',
    default: 'ChungToiXayWeb - Thiết kế Website Chuyên Nghiệp',
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

