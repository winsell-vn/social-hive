import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cài đặt | ChungToiXayWeb",
  robots: {
    index: false,
    follow: true,
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

