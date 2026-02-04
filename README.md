# Headless WordPress E-Commerce Frontend

A modern, high-performance headless e-commerce storefront built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**. Connects to WordPress/WooCommerce as a headless CMS for content and product management.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)

![GitHub stars](https://img.shields.io/github/stars/wpacademy/nextjs-woocommerce-frontend?style=social)
![GitHub forks](https://img.shields.io/github/forks/wpacademy/nextjs-woocommerce-frontend?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/wpacademy/nextjs-woocommerce-frontend?style=social)
![GitHub license](https://img.shields.io/github/license/wpacademy/nextjs-woocommerce-frontend)

<img width="1920" height="1080" alt="preview" src="https://github.com/user-attachments/assets/26009a55-84aa-4a17-9f45-164299fc1f4a" />

**[Live Demo](https://nextjswoo.msrbuilds.com/)**

## Features

- **Headless Architecture** - Decoupled frontend with WordPress/WooCommerce backend
- **Server-Side Rendering** - Fast initial page loads with Next.js App Router
- **Product Catalog** - Browse products with categories, filters, and search
- **Variable Products** - Support for product variations (size, color, etc.)
- **Shopping Cart** - Persistent cart with localStorage
- **User Authentication** - JWT-based login, registration, and account management
- **Checkout Flow** - Complete order processing through WooCommerce
- **Responsive Design** - Mobile-first design that works on all devices
- **Image Optimization** - Automatic image optimization with Next.js Image

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.6 (App Router) |
| UI Library | React 19.2.3 |
| Styling | Tailwind CSS v4 |
| State Management | Zustand 5.0.11 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Language | TypeScript 5 (strict mode) |

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** (recommended: Node.js 20)
- **npm**, **yarn**, **pnpm**, or **bun**
- **WordPress site** with the following plugins:
  - [WooCommerce](https://woocommerce.com/) - E-commerce functionality
  - [WPGraphQL](https://www.wpgraphql.com/) - GraphQL API
  - [JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) - User authentication

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/wpacademy/nextjs-woocommerce-frontend.git
cd nextjs-woocommerce-frontend
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your WordPress configuration:

```env
# WordPress Configuration
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
NEXT_PUBLIC_GRAPHQL_URL=https://your-wordpress-site.com/graphql

# WooCommerce REST API (from WooCommerce > Settings > Advanced > REST API)
WC_CONSUMER_KEY=ck_your_consumer_key
WC_CONSUMER_SECRET=cs_your_consumer_secret

# JWT Secret (must match JWT_AUTH_SECRET_KEY in wp-config.php)
JWT_SECRET=your-jwt-secret-key

# Frontend URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## WordPress Setup

### WooCommerce REST API Keys

1. Go to **WooCommerce > Settings > Advanced > REST API**
2. Click **Add Key**
3. Set **Description** (e.g., "Headless Frontend")
4. Set **User** to an admin user
5. Set **Permissions** to **Read/Write**
6. Click **Generate API Key**
7. Copy the **Consumer Key** and **Consumer Secret** to your `.env.local`

### JWT Authentication Setup

1. Install and activate the [JWT Authentication plugin](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)
2. Add to your `wp-config.php`:

```php
define('JWT_AUTH_SECRET_KEY', 'your-unique-secret-key');
define('JWT_AUTH_CORS_ENABLE', true);
```

3. Add to your `.htaccess` (Apache) or nginx config:

```apache
RewriteEngine on
RewriteCond %{HTTP:Authorization} ^(.*)
RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
```

### WPGraphQL Setup

1. Install and activate [WPGraphQL](https://www.wpgraphql.com/)
2. Install [WPGraphQL for WooCommerce](https://github.com/wp-graphql/wp-graphql-woocommerce) (optional, for GraphQL product queries)
3. Test your GraphQL endpoint at `https://your-site.com/graphql`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── account/           # User account pages
│   ├── product/[slug]/    # Product detail pages
│   ├── shop/              # Product listing
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Header, Footer
│   ├── product/           # Product components
│   ├── cart/              # Cart components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── graphql.ts         # GraphQL client
│   ├── woocommerce.ts     # WooCommerce API client
│   ├── auth.ts            # Authentication utilities
│   └── utils.ts           # Helper functions
├── stores/                # Zustand state stores
└── types/                 # TypeScript definitions
```

## Deployment

### Deploy to Vercel

The easiest way to deploy this Next.js app:

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"Add New Project"**
4. Import your repository
5. Configure environment variables:
   - Add all variables from `.env.local`
   - Ensure `NEXT_PUBLIC_SITE_URL` points to your Vercel domain
6. Click **Deploy**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wpacademy/nextjs-woocommerce-frontend)

**Vercel Environment Variables:**

```
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
NEXT_PUBLIC_GRAPHQL_URL=https://your-wordpress-site.com/graphql
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx
JWT_SECRET=your-secret
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

### Deploy to Netlify

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com) and sign in
3. Click **"Add new site"** > **"Import an existing project"**
4. Connect your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
6. Add environment variables in **Site settings > Environment variables**
7. Install the **Next.js plugin**:
   - Go to **Plugins** > Search "Next.js" > Install **@netlify/plugin-nextjs**
8. Click **Deploy site**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/wpacademy/nextjs-woocommerce-frontend)

**Netlify Configuration (`netlify.toml`):**

Create a `netlify.toml` file in your project root:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Netlify Environment Variables:**

Add these in **Site settings > Environment variables**:

```
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
NEXT_PUBLIC_GRAPHQL_URL=https://your-wordpress-site.com/graphql
WC_CONSUMER_KEY=ck_xxxxx
WC_CONSUMER_SECRET=cs_xxxxx
JWT_SECRET=your-secret
NEXT_PUBLIC_SITE_URL=https://your-app.netlify.app
```

### Deploy with Docker

Build and run with Docker:

```bash
# Build the image
docker build -t headless-wp-frontend .

# Run the container
docker run -p 3000:3000 --env-file .env.local headless-wp-frontend
```

Or use Docker Compose:

```bash
docker-compose up
```

### Deploy to Other Platforms

This project outputs a standalone build, making it compatible with:

- **Railway** - Connect repo, add env vars, deploy
- **Render** - Use Docker or Node.js environment
- **DigitalOcean App Platform** - Connect repo, configure env vars
- **AWS Amplify** - Import from Git, add env vars
- **Google Cloud Run** - Use the included Dockerfile

## Configuration

### Image Domains

To allow images from your WordPress site, update `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-wordpress-site.com',
    },
    {
      protocol: 'https',
      hostname: '*.wp.com',
    },
  ],
},
```

### CORS Configuration

Ensure your WordPress site allows requests from your frontend domain. Add to `wp-config.php`:

```php
header("Access-Control-Allow-Origin: https://your-frontend-domain.com");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
```

Or use a CORS plugin like [WP CORS](https://wordpress.org/plugins/wp-cors/).

## Troubleshooting

### Common Issues

**CORS Errors**
- Ensure WordPress allows your frontend origin
- Check JWT plugin CORS settings
- Verify `.htaccess` configuration

**401 Unauthorized Errors**
- Verify WooCommerce API credentials
- Check that API keys have Read/Write permissions
- Ensure the user associated with API keys is an admin

**GraphQL Errors**
- Verify WPGraphQL plugin is active
- Test queries at `your-site.com/graphql`
- Check for PHP errors in WordPress

**Images Not Loading**
- Add your WordPress domain to `next.config.ts` remote patterns
- Ensure images are publicly accessible

**Cart Not Persisting**
- Check browser localStorage is enabled
- Clear localStorage and try again

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [GPL 3.0](LICENSE).

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [WooCommerce](https://woocommerce.com/) - E-commerce for WordPress
- [WPGraphQL](https://www.wpgraphql.com/) - GraphQL API for WordPress
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
