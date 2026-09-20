'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, FileText, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import { Candidate, Evidence } from '@/lib/types';

interface SearchResult {
  candidate: Candidate;
  matchScore: number;
  reason: string;
  matchedEvidence: Evidence[];
}

export default function NaturalLanguageSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const sampleQueries = [
    'Show candidates with high throughput Kafka streaming experience',
    'Engineers with Kubernetes and zero-downtime database migration',
    'Candidates with distributed saga transactions and microservices',
    'Strong mentorship and architecture review board background'
  ];

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    try {
      setSearching(true);
      setSearched(true);
      setQuery(queryText);

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2 border-b border-neutral-300/80 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-mono font-semibold text-neutral-800 shadow-2xs">
          <span className="tracking-wider uppercase">Evidence-Backed Retrieval (PRD §19)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-[#0F0F0F]">
          Natural-Language Candidate Search
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl font-sans">
          Ask complex qualitative questions across the candidate pool. Every match is synthesized with verbatim source evidence and confidence citations.
        </p>
      </div>

      {/* Search Input Bar (Landing Page Aesthetic) */}
      <div className="rounded-2xl border-2 border-black bg-white p-5 shadow-sm space-y-3.5">
        <form onSubmit={e => { e.preventDefault(); handleSearch(query); }} className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-neutral-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask anything, e.g. 'Show candidates with distributed systems and Kafka scale'..."
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 pl-12 pr-32 py-3.5 text-sm text-[#0F0F0F] placeholder-neutral-400 focus:border-black focus:outline-hidden font-sans shadow-inner"
          />
          <button
            type="submit"
            disabled={searching || !query}
            className="absolute right-2 rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-4 py-2 text-xs font-display font-bold text-white disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>{searching ? 'Synthesizing...' : 'Search'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-neutral-500 font-mono font-medium">Quick Probes:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSearch(q)}
              className="rounded-lg border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 hover:border-black px-2.5 py-1 text-neutral-700 hover:text-black transition-all cursor-pointer font-medium"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {searching && (
          <div className="py-16 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0F0F0F] border-t-transparent" />
            <p className="text-xs font-mono text-neutral-600">Retrieving candidates & extracting source citations...</p>
          </div>
        )}

        {!searching && searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>Found <strong className="text-[#0F0F0F]">{results.length}</strong> matching candidates</span>
              <span>Sorted by evidence relevance</span>
            </div>

            {results.length === 0 ? (
              <div className="rounded-xl border border-neutral-300/80 bg-white p-8 text-center text-neutral-600 shadow-xs">
                <p className="text-sm font-bold text-[#0F0F0F]">No candidates matched the exact search criteria.</p>
                <p className="text-xs text-neutral-500 mt-1">Try broadening terms or searching for individual skills like Go, Kafka, or Kubernetes.</p>
              </div>
            ) : (
              results.map(res => (
                <div 
                  key={res.candidate.id}
                  className="rounded-xl border border-neutral-300/80 bg-white p-6 space-y-4 hover:border-black transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-display font-bold text-[#0F0F0F]">{res.candidate.name}</h3>
                        <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-800">
                          {res.candidate.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">{res.candidate.currentTitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-neutral-100 px-3 py-1.5 border border-neutral-200 text-center">
                        <span className="text-[10px] text-neutral-500 block uppercase font-mono">Match Score</span>
                        <span className="text-sm font-display font-bold text-emerald-700">{res.matchScore}%</span>
                      </div>
                      <Link
                        href={`/candidates/${res.candidate.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors shadow-2xs cursor-pointer"
                      >
                        <span>Candidate Workspace</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* AI Match Reason */}
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-800 leading-relaxed">
                    <span className="font-bold text-[#0F0F0F] block mb-0.5">Synthesis Rationale:</span>
                    <p>{res.reason}</p>
                  </div>

                  {/* Matched Evidence Snippets */}
                  {res.matchedEvidence.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#FF3B30]" />
                        <span>Traceable Source Evidence ({res.matchedEvidence.length})</span>
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {res.matchedEvidence.map(ev => (
                          <div 
                            key={ev.id}
                            className="rounded-lg bg-neutral-50 p-3 border border-neutral-200 text-xs text-neutral-800 font-mono"
                          >
                            <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-1 font-semibold">
                              <span>{ev.sourceDoc}</span>
                              <span className="text-neutral-400">{ev.section}</span>
                            </div>
                            <p className="italic text-[#0F0F0F] bg-white p-2 rounded border border-neutral-200">
                              &ldquo;{ev.snippet}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
