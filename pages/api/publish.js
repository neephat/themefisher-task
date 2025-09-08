import { Buffer } from "buffer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  const targetPath = process.env.GITHUB_TARGET_PATH || "content";

  if (!token || !owner || !repo) {
    return res.status(500).json({
      message:
        "Server not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in .env.local",
    });
  }

  const { drafts } = req.body;
  if (!Array.isArray(drafts)) {
    return res
      .status(400)
      .json({ message: "Invalid payload. `drafts` array required." });
  }

  const results = [];

  for (const d of drafts) {
    try {
      const filename = `${
        d.title
          .replace(/[^a-z0-9\- ]+/gi, "")
          .replace(/\s+/g, "-")
          .toLowerCase() || "untitled"
      }-${Date.now()}.md`;

      const path = `${targetPath}/${filename}`;
      const content = `# ${d.title}\n\n${d.body || ""}\n`;
      const b64 = Buffer.from(content, "utf-8").toString("base64");

      // const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(
        path
      )}`;

      const payload = {
        message: `Add draft: ${d.title}`,
        content: b64,
        branch,
      };

      let putRes = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let putData;
      try {
        putData = await putRes.json();
      } catch {
        putData = { message: "Failed to parse GitHub response" };
      }

      if (!putRes.ok) {
        console.error("GitHub API Error:", {
          status: putRes.status,
          statusText: putRes.statusText,
          response: putData,
        });

        results.push({
          draft: d.title,
          ok: false,
          status: putRes.status,
          error: putData.message || "Unknown error",
          documentation_url: putData.documentation_url || null,
        });
      } else {
        results.push({
          draft: d.title,
          ok: true,
          file: putData.content?.path,
          commit: putData.commit?.sha,
        });
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
      results.push({ draft: d.title, ok: false, error: String(err) });
    }
  }

  // If any draft failed, return 207 Multi-Status (partial success)
  const hasError = results.some((r) => !r.ok);
  res.status(hasError ? 207 : 200).json({ results });
}
