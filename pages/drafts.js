import React, { useEffect, useState } from "react";
import Link from "next/link";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("drafts_v1");
    if (saved) setDrafts(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("drafts_v1", JSON.stringify(drafts));
  }, [drafts]);

  function addDraft(e) {
    e?.preventDefault();
    if (!title.trim()) return alert("Title required");
    const d = {
      id: uid(),
      title: title.trim(),
      body: body,
      createdAt: new Date().toISOString(),
    };
    setDrafts([d, ...drafts]);
    setTitle("");
    setBody("");
  }

  function editDraft(id) {
    const d = drafts.find((x) => x.id === id);
    if (!d) return;
    setEditingId(id);
    setTitle(d.title);
    setBody(d.body);
  }

  function saveEdit(e) {
    e?.preventDefault();
    setDrafts(
      drafts.map((d) => (d.id === editingId ? { ...d, title, body } : d))
    );
    setEditingId(null);
    setTitle("");
    setBody("");
  }

  function removeDraft(id) {
    if (!confirm("Delete draft?")) return;
    setDrafts(drafts.filter((d) => d.id !== id));
  }

  async function publishAll() {
    if (drafts.length === 0) {
      alert("No drafts to publish");
      return;
    }
    if (!confirm(`Publish ${drafts.length} drafts to GitHub?`)) return;
    setStatus("Publishing...");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Publish failed");
      setStatus("Published successfully. See API response in console.");
      console.log("publish result", data);
      // on success, remove published drafts
      setDrafts([]);
    } catch (err) {
      console.error(err);
      setStatus("Error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container bg-white shadow rounded p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Drafts</h1>
          <Link href="/">
            <p className="px-4 py-2 bg-indigo-600 text-white rounded">
              Back Home
            </p>
          </Link>
        </div>

        <form
          onSubmit={editingId ? saveEdit : addDraft}
          className="mb-6 space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border p-2 rounded"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Body (markdown allowed)"
            className="w-full border p-2 rounded"
          ></textarea>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              type="submit"
            >
              {editingId ? "Save" : "Add Draft"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setBody("");
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={publishAll}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded"
            >
              Publish All
            </button>
          </div>
        </form>

        <div className="mb-4 text-sm text-gray-600">{status}</div>

        <div>
          <h2 className="text-lg font-medium mb-2">
            Saved Drafts ({drafts.length})
          </h2>
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="border rounded p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editDraft(d.id)}
                      className="px-3 py-1 bg-yellow-400 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeDraft(d.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {d.body}
                </div>
              </div>
            ))}
            {drafts.length === 0 && (
              <div className="text-gray-500">No drafts yet. Add one above.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
