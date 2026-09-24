# Product Admin Dashboard

A responsive Product Admin Dashboard built with Next.js, TypeScript, Tailwind CSS, Axios, and DummyJSON.

## Features

- Login authentication using DummyJSON
- Protected product routes
- Product listing with responsive table/cards
- Pagination with configurable page size
- Search with debounce and request cancellation
- Category filtering
- Sorting by title, price, and rating
- Product details with images and reviews
- Add product
- Edit product
- Delete product with confirmation
- Form validation
- Loading, error, empty, and retry states
- URL-based pagination, search, filter, and sorting
- Shared Axios instance with authentication interceptor
- Responsive desktop and mobile UI

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Axios
- DummyJSON API

## Getting Started

```bash
npm install
npm run dev

## Demo Login

**Username:** `emilys`

**Password:** `emilyspass`

## API Notes

DummyJSON supports product creation, updates, and deletion as simulated API operations. These changes are not permanently persisted by the API.

To provide a usable dashboard experience, created and edited products are stored locally in the browser using `localStorage`. Deleted products are also tracked locally so that simulated mutations remain reflected in the UI.

## Search Race-Condition Handling

Search requests use `AbortController` so that previous requests can be cancelled when the search query changes. This prevents stale search responses from replacing newer results.

## Assignment Notes

### Key implementation choices

- App Router with reusable components
- Axios service layer for API communication
- URL query parameters for pagination, search, category, and sorting
- Local storage for simulated mutation persistence
- Responsive table/card layouts

### Problem and Fix

DummyJSON product mutations are simulated and are not permanently reflected in subsequent API requests. This caused newly created or edited products to disappear from the product list.

The application solves this by storing created and edited products locally and merging them with API results. Deleted product IDs are also stored locally.

### AI Assistance

AI was used as a development aid for understanding implementation approaches, debugging issues, improving UI details, and reviewing parts of the code. I tested, understood, and adapted the suggestions while building the application.
