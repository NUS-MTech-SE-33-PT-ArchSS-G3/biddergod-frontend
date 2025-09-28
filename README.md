# BidderGod

A modern auction platform frontend built with React, TypeScript, Tailwind CSS, and AWS Amplify. BidderGod provides a complete auction experience with real-time bidding capabilities, advanced search and filtering, and secure user authentication.

**Repository**: https://github.com/NUS-MTech-SE-33-PT-ArchSS-G3/biddergod-frontend.git

## Overview

BidderGod is a professional auction platform featuring a clean, minimalist design built with modern web technologies. The application integrates AWS Amplify for backend services and uses Tailwind CSS for a responsive, mobile-first user interface.

## Features

### 🎯 Auction Platform
- **Modern Auction Listings**: Responsive grid displaying auction items with rich details
- **Advanced Search & Filtering**: Real-time search with category filtering and multiple sorting options
- **Professional Auction Cards**: Clean design showing images, pricing, time remaining, and bid counts
- **Responsive Design**: Optimized for mobile, tablet, and desktop experiences

### 🔐 Authentication & Security
- **AWS Amplify Authentication**: Secure user authentication with Amazon Cognito
- **Custom Auth Wrapper**: Seamless integration with modern UI components
- **Token Management**: Developer tools for API testing and token handling

### 🎨 User Interface
- **Tailwind CSS**: Modern, utility-first styling with consistent design system
- **Minimalist Design**: Clean, professional interface with indigo/purple branding
- **Interactive Elements**: Smooth transitions, hover states, and responsive feedback
- **Accessibility**: Proper contrast ratios and keyboard navigation support

### 🛠 Technical Features
- **React 18**: Latest React with TypeScript for type safety
- **Vite**: Fast development server and optimized build process
- **Component Architecture**: Modular, reusable React components
- **Mock Data**: Realistic auction data with high-quality images for development

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- AWS CLI configured (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/NUS-MTech-SE-33-PT-ArchSS-G3/biddergod-frontend.git
cd biddergod-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start React dev server with HMR
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build

# AWS Amplify commands
npx ampx sandbox     # Start Amplify backend sandbox
npx ampx pipeline-deploy --branch main --app-id $AWS_APP_ID  # Deploy to AWS
```

## Component Architecture

### Core Components
- **MainContent**: Main application layout with navigation and routing
- **AuctionsGrid**: Auction listings with integrated search and filtering
- **AuctionCard**: Individual auction item display component
- **SearchAndFilter**: Advanced search interface with category and sort options
- **ApiTestingInterface**: Developer tools for API testing and authentication
- **AuthenticatorWrapper**: Custom authentication flow integration

### Styling System
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts
- **Color System**: Consistent indigo/purple gradient branding
- **Component Variants**: Conditional styling based on state and props

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Project Structure

```
src/
├── components/
│   ├── MainContent.tsx           # Main layout component
│   ├── AuctionsGrid.tsx          # Auction listings grid
│   ├── AuctionCard.tsx           # Individual auction card
│   ├── SearchAndFilter.tsx       # Search and filtering
│   ├── ApiTestingInterface.tsx   # API testing tools
│   └── AuthenticatorWrapper.tsx  # Authentication wrapper
├── App.tsx                       # Root application component
├── main.tsx                      # Application entry point
└── index.css                     # Global styles and Tailwind imports
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.