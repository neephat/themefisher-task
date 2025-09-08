# Next.js GitHub Drafts Example

This project demonstrates:
- Fetching a Markdown file from a public GitHub repository and rendering it.
- A simple drafts manager (client-side, saved to localStorage) with create/edit/delete.
- "Publish All" button which commits each draft as a Markdown file to a GitHub repository via server-side API using a personal access token.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` in the project root with the following variables:
```
GITHUB_TOKEN=ghp_your_personal_access_token_here
GITHUB_OWNER=your-github-username-or-org
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main
GITHUB_TARGET_PATH=content  # path inside repo where markdown files will be written
MARKDOWN_SOURCE_PATH=content/hello.md  # the file to fetch and display on homepage (public repo)
```

`GITHUB_TOKEN` needs the `repo` scope (to create files in a repository). Keep it secret.

3. Run the dev server:
```bash
npm run dev
```

## Notes

- The token is only used server-side in the API route `/api/publish`.
- The drafts UI stores drafts in `localStorage` so they persist in your browser.
- `Publish All` will iterate drafts and call GitHub's Create/Update file endpoint for each draft. Each file will be committed separately.

