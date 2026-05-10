import { Nunito_Sans} from "next/font/google";
import "./globals.css";
import Providers from "@/react-query/provider";

const nunito_sans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito_sans",
});

export const metadata = {
  title: "Cuffino",
  description: "Custom African Prints Just For You ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light scroll-smooth dm_sans" dir="ltr">
      <body className={`${nunito_sans.className} `}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
