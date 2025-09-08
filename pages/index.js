import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

export default function Home({ markdown, sourcePath }) {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container bg-white shadow rounded p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Markdown from GitHub</h1>
          <Link href="/drafts">
            <p className="px-4 py-2 bg-indigo-600 text-white rounded">
              Manage Drafts
            </p>
          </Link>
        </div>

        <div className="prose max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdown || "No content found."}
          </ReactMarkdown>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          Source: <code>{sourcePath}</code>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const {
    MARKDOWN_SOURCE_PATH = process.env.MARKDOWN_SOURCE_PATH ||
      "content/hello.md",
    GITHUB_OWNER = process.env.GITHUB_OWNER,
    GITHUB_REPO = process.env.GITHUB_REPO,
  } = process.env;

  if (!GITHUB_OWNER || !GITHUB_REPO) {
    return {
      props: {
        markdown:
          "# Missing repository configuration\nPlease set GITHUB_OWNER and GITHUB_REPO in environment.",
        sourcePath: MARKDOWN_SOURCE_PATH,
      },
    };
  }

  const owner = GITHUB_OWNER;
  const repo = GITHUB_REPO;
  const path = MARKDOWN_SOURCE_PATH;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
    path
  )}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        props: {
          markdown: `# Failed to fetch file\nStatus: ${res.status} ${res.statusText}\n\n${text}`,
          sourcePath: path,
        },
      };
    }
    const data = await res.json();
    // content is base64
    const content = Buffer.from(data.content || "", "base64").toString("utf-8");
    return { props: { markdown: content, sourcePath: path } };
  } catch (err) {
    return {
      props: {
        markdown: `# Error fetching file\n${String(err)}`,
        sourcePath: path,
      },
    };
  }
}
