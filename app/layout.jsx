import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Mandarin Travel Phrasebook',
  description:
    'A free phrasebook for Chengdu, Shangri-La (Diqing), Lijiang and Shenzhen. Listen to high-quality Chinese audio, then practise with in-browser speech recognition.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Classic scripts (not bundled) so the remote transformers.js import in
            offline.js keeps working and practice/offline stay DOM-free. */}
        <Script src="/js/practice.js" strategy="beforeInteractive" />
        <Script src="/js/offline.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
