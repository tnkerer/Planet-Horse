import React from 'react'
import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps (ctx: DocumentContext) {
    const originalRenderPage = ctx.renderPage

    ctx.renderPage = () =>
      originalRenderPage({
        enhanceApp: (App) => App,
        enhanceComponent: (Component) => Component
      })

    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render () {
    return (
      <Html>
        <title>PlanetHorse</title>
        <Head>
          <link rel="icon" href="/favicon.ico"></link>

          <style>{`
          :where(html, body, *, *::before, *::after) {
            cursor: none !important;
          }
          input[type="text"],
          input[type="email"],
          input[type="search"],
          textarea,
          [contenteditable="true"] {
            cursor: text !important;        
          }
        `}</style>
        </Head>
        <body>
          <Main />
          <NextScript />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.1/p5.min.js" />
        </body>
      </Html>
    )
  }
}

export default MyDocument
