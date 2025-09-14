import "./globals.css";

export const metadata = {
  title: "MEENA - Your College Assistant",
  description: "MEENA is your smart college assistant, helping you with campus queries, schedules, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={` antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
