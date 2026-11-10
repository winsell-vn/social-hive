import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tìm kiếm | ChungToiXayWeb",
  robots: {
    index: false,
    follow: true,
  },
}

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

