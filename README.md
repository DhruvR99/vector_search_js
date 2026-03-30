# Vector Search Demo

This project is a complete, static demo of vector similarity search. It is designed to run directly, so it does not require a backend server, a database, or any build step.

## Creator

Created by [Dhruv](https://www.linkedin.com/in/dhruv-rana-181707194/?skipRedirect=true).

## What the demo shows

- A JSON file is used as the data source.
- Each science article in the JSON file contains a precomputed embedding vector.
- The browser loads the JSON dataset with `fetch()`.
- A small JavaScript encoder converts the user's query into the same vector space.
- Cosine similarity is computed entirely on the client side to rank the most relevant articles.

## Project structure

```text
.
├── app.js
├── data
│   └── articles.json
├── index.html
├── README.md
└── styles.css
```

## How the embeddings work

This demo uses a lightweight, easy-to-read embedding approach instead of a large ML model:

- The vector space has 10 dimensions.
- Each dimension represents a broad science theme such as `Space`, `Climate`, `Ocean`, or `Neuroscience`.
- Article embeddings are stored directly in `data/articles.json`.
- Query embeddings are created in `app.js` by matching query terms against a small theme keyword list.

This keeps the demo understandable while still showing the real vector-search workflow:

1. Encode query into a vector
2. Compare query vector with stored document vectors
3. Sort by similarity score
4. Display the best matches

## Run locally

One simple option:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Customizing the dataset

Update [`data/articles.json`](/vector_search/data/articles.json) to:

- add more articles
- change titles, summaries, and categories
- replace the embedding arrays with your own vectors

If you change the number or meaning of embedding dimensions, also update the `THEMES` array in [`app.js`](/vector_search/app.js) so query encoding matches the stored vectors.

## Why this works well for a demo

- Very small codebase
- No API keys
- No database setup
- Easy to inspect and explain
- Good starting point for replacing the demo encoder with real embeddings later
