import React from 'react'
import rss from './assets/unfurl_rss.json'

const total = rss.length
const description = `Hi, I'am JiangWeixian. I find some awesome and cool products, fresh-new konwledge and valuable experience sharing. Now I want to share almost ${total}+ items with you!`
const url =
  import.meta.env.MODE === 'production'
    ? 'https://whatiread2022.vercel.app'
    : 'http://localhost:5173'
const title = 'What I Read In 2022?'
const image = `${url}/whatiread2022.png`

const Document = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📖</text></svg>"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Carter+One&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:image" content={image} />
        <meta property="og:image:alt" content="what-i-read-2022" />
        <meta property="og:description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:creator" content="@jiangweixian" />
        <meta name="twitter:site" content="@jiangweixian" />
        <meta name="twitter:url" content={url} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta
          name="twitter:image:alt"
          content="A text description of the image conveying the essential nature of an image to users who are visually impaired. Maximum 420 characters."
        />
        <meta itemProp="name" content={title} />
        <meta itemProp="image" content={image} />
        <meta name="description" itemProp="description" content={description} />
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
  )
}

export default Document
