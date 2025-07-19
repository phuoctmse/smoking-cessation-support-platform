# Smoking Cessation Support System

A progressive NestJS-based backend application that supports a comprehensive smoking cessation system. This platform provides features for user registration and subscription management, building personalized cessation plans (with stages and progress tracking), real-time notifications, and AI-powered profile recommendations.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The platform is designed to support smokers in their journey to quit smoking. It provides personalized cessation plans, progress tracking (days without smoking, money saved, health improvement), real-time notifications, stage-by-stage guidance, and community support. The system leverages GraphQL best practices to deliver a flexible and efficient API.

---

## Features

- **User Management:** Registration, authentication, and profile management for guest, member, coach, and admin roles.
- **Cessation Plans:** Create, update, and track personalized smoking cessation plans including sequential stages.
- **Progress Tracking:** Record smoking habits, health metrics, and plan progress.
- **Notifications:** Scheduled notifications for plan reminders, stage activations, and achievements.
- **Quiz & AI Mapping:** Capture quiz responses to map onto user profiles and generate personalized recommendations.
- **Subscription and Payment:** Manage member plans with subscription status and payment processing.
- **Content & Community:** Blog posts, ratings, feedback, and social sharing of achievements.

---

## Tech Stack

- **Framework:** [NestJS](https://docs.nestjs.com)
- **API:** GraphQL with Apollo
- **ORM:** Prisma
- **Database:** Postgres
- **Authentication:** JWT-based & Supabase Auth
- **Caching:** Redis
- **Search Engine:** Elasticsearch for advanced search and data indexing
- **Queue System:** BullMQ for background job processing
- **AI Services:** GoogleGenAI integrations for profile recommendations
- **Monitoring:** Sentry for error tracking and performance monitoring
- **File Storage:** Supabase Storage
- **Testing:** Jest for unit and end-to-end tests
- **Code Quality:** ESLint, Prettier
- **Scheduling:** NestJS Schedule for cron jobs

---

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/phuoctmse/smoking-cessation-support-platform.git
   cd smoking-cessation-support-platform
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the project root based on your configuration needs. Example:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/dbname
   JWT_SECRET=your-secret-key
   PORT=3000
   ```

4. **Set up Prisma:**

   Generate Prisma client and apply migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

---

## Running the Project

To start the application in development mode:

```bash
npm run start:dev
```

For production build and run:

```bash
npm run start:prod
```

The GraphQL endpoint is available at: `http://localhost:3000/graphql`

---

## Testing

Run unit tests:

```bash
npm run test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

Check test coverage:

```bash
npm run test:cov
```

---

## Deployment

When ready to deploy, refer to the [NestJS Deployment Guide](https://docs.nestjs.com/deployment). Steps typically include building the production bundle, setting environment variables, and configuring your hosting environment (e.g., AWS, Heroku, or other cloud services).

Example build and run for production:

```bash
npm run build
npm run start:prod
```

---

## API Documentation

This project exposes a GraphQL API. For detailed API documentation:
- Visit `/graphql` in your browser (with GraphQL Playground enabled during development).
- Refer to inline schema documentation provided within the GraphQL Playground.

---

## Contributing

Contributions are welcome! Please follow these guidelines:
- Ensure that all new code adheres to [SOLID Principles](https://en.wikipedia.org/wiki/SOLID).
- Write proper tests for any new feature or bug fix.
- Maintain consistency in coding style by following ESLint and Prettier rules.
- Open an issue for any major changes or discussion points.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Apollo GraphQL](https://www.apollographql.com/)
