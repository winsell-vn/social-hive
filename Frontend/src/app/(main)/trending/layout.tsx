import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Xu hướng | ChungToiXayWeb',
  description: 'Khám phá các bài viết và hashtag đang thịnh hành trên ChungToiXayWeb',
  openGraph: {
    title: 'Xu hướng | ChungToiXayWeb',
    description: 'Khám phá các bài viết và hashtag đang thịnh hành',
    type: 'website',
  },
};

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

