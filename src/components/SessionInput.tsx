"use client";

import { useState } from "react";

const SAMPLE = {
  prompt:
    "Build me a React component that fetches user data from an API and displays it in a table with sorting.",
  aiResponse: `import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [sortKey, setSortKey] = useState<keyof User>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const sorted = [...users].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: keyof User) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <table>
      <thead>
        <tr>
          {(['name', 'email', 'role'] as const).map(key => (
            <th key={key} onClick={() => toggleSort(key)} style={{cursor: 'pointer'}}>
              {key} {sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}`,
  modifications: `I kept the sorting logic but added error handling and a loading state:

import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof User>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // ... rest same as AI version
}`,
};

interface SessionInputProps {
  onSubmit: (sessionText: string) => void;
  isLoading: boolean;
}

const TEXTAREA_BASE =
  "w-full resize-none overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/40 focus:border-[var(--color-ground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ground)]";

export function SessionInput({ onSubmit, isLoading }: SessionInputProps) {
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [modifications, setModifications] = useState("");

  const totalChars = prompt.length + aiResponse.length + modifications.length;
  const canSubmit = prompt.trim().length > 0 && aiResponse.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const combined = `## My Prompt\n${prompt.trim()}\n\n## AI Response\n${aiResponse.trim()}\n\n## What I Actually Used\n${modifications.trim() || "(No modifications — accepted as-is)"}`;
    onSubmit(combined);
  };

  const loadSample = () => {
    setPrompt(SAMPLE.prompt);
    setAiResponse(SAMPLE.aiResponse);
    setModifications(SAMPLE.modifications);
  };

  return (
    <div className="w-full max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <p className="text-sm text-[var(--color-muted)]">
          Fill in the three parts of your coding session.
        </p>
        <button
          type="button"
          onClick={loadSample}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          Load sample
        </button>
      </div>

      {/* 1. Your Prompt */}
      <div className="border-l-2 border-[var(--color-ground)] pl-4">
        <label className="mb-1.5 block text-sm">
          <span className="font-semibold text-[var(--color-ground)]">Your Prompt</span>
          <span className="ml-1.5 text-[var(--color-muted)]">what you asked the AI</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Build a React component that fetches user data and displays it in a sortable table..."
          className={`h-24 ${TEXTAREA_BASE}`}
          disabled={isLoading}
        />
      </div>

      {/* 2. AI Response */}
      <div className="border-l-2 border-[var(--color-edge)] pl-4">
        <label className="mb-1.5 block text-sm">
          <span className="font-semibold text-[var(--color-edge)]">AI Response</span>
          <span className="ml-1.5 text-[var(--color-muted)]">the code the AI generated</span>
        </label>
        <textarea
          value={aiResponse}
          onChange={(e) => setAiResponse(e.target.value)}
          placeholder="Paste the AI-generated code here..."
          className={`h-48 ${TEXTAREA_BASE}`}
          disabled={isLoading}
        />
      </div>

      {/* 3. Your Modifications */}
      <div className="border-l-2 border-[var(--color-zone)] pl-4">
        <label className="mb-1.5 block text-sm">
          <span className="font-semibold text-[var(--color-zone)]">Your Modifications</span>
          <span className="ml-1.5 text-[var(--color-muted)]">what you changed or kept (optional)</span>
        </label>
        <textarea
          value={modifications}
          onChange={(e) => setModifications(e.target.value)}
          placeholder="Describe what you changed, or paste your final version. Leave empty if you accepted the AI output as-is."
          className={`h-36 ${TEXTAREA_BASE}`}
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          {totalChars > 0
            ? `${totalChars.toLocaleString()} characters`
            : "Fill in at least the prompt and AI response"}
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="rounded-xl bg-[var(--color-ground)] px-6 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? "Analyzing..." : "Analyze Session"}
        </button>
      </div>
    </div>
  );
}
