import React, { useState, useMemo } from 'react';
import {
  Code2,
  Cpu,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BookOpen,
  Lightbulb,
  GitBranch,
  HelpCircle,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  EDUCATIONAL_MODULES,
  OOP_CONCEPTS,
  ConceptStatus,
  ModuleId,
  OopConcept,
} from '@/data/oopConceptsData';
import { CppCodeBlock } from '@/components/oop/CppCodeBlock';
import { ArchitectureDiagrams } from '@/components/oop/ArchitectureDiagrams';
import { DiscountStrategySimulator, ObjectSlicingDemo } from '@/components/oop/InteractiveDemos';
import { ConceptQuiz } from '@/components/oop/ConceptQuiz';

type ActiveView = ModuleId | 'ALL' | 'DIAGRAMS' | 'QUIZ';

export const OopConceptsPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConceptStatus>('ALL');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'a-classes-encapsulation': true,
    'b-abstract-strategy': true,
    'c-diamond-virtual-inheritance': true,
    'd-friend-class-functions': true,
    'e-repository-template': true,
    'f-raii-sqlite': true,
  });

  // Dynamic audit counts
  const auditStats = useMemo(() => {
    const verified = OOP_CONCEPTS.filter((c) => c.status === 'VERIFIED').length;
    const partial = OOP_CONCEPTS.filter((c) => c.status === 'PARTIALLY VERIFIED').length;
    const notFound = OOP_CONCEPTS.filter((c) => c.status === 'NOT FOUND').length;
    return { total: OOP_CONCEPTS.length, verified, partial, notFound };
  }, []);

  const isSearching = searchQuery.trim().length > 0 || statusFilter !== 'ALL';

  const filteredConcepts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return OOP_CONCEPTS.filter((c) => {
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesModule =
        isSearching || activeView === 'ALL'
          ? true
          : activeView === 'DIAGRAMS' || activeView === 'QUIZ'
          ? false
          : c.moduleId === activeView;
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.symbolName.toLowerCase().includes(q) ||
        c.sourcePath.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.explanation.toLowerCase().includes(q);

      return matchesStatus && matchesModule && matchesQuery;
    });
  }, [searchQuery, statusFilter, activeView, isSearching]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllVisible = () => {
    const next: Record<string, boolean> = { ...expandedIds };
    filteredConcepts.forEach((c) => {
      next[c.id] = true;
    });
    setExpandedIds(next);
  };

  const collapseAllVisible = () => {
    const next: Record<string, boolean> = { ...expandedIds };
    filteredConcepts.forEach((c) => {
      next[c.id] = false;
    });
    setExpandedIds(next);
  };

  const getStatusBadge = (status: ConceptStatus) => {
    if (status === 'VERIFIED') {
      return (
        <Badge variant="success" className="text-[10px] gap-1 shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          VERIFIED
        </Badge>
      );
    }
    if (status === 'PARTIALLY VERIFIED') {
      return (
        <Badge variant="warning" className="text-[10px] gap-1 shrink-0">
          <AlertTriangle className="w-3 h-3" />
          PARTIALLY VERIFIED
        </Badge>
      );
    }
    return (
      <Badge variant="danger" className="text-[10px] gap-1 shrink-0">
        <XCircle className="w-3 h-3" />
        NOT FOUND
      </Badge>
    );
  };

  const renderConceptCard = (concept: OopConcept) => {
    const isExpanded = !!expandedIds[concept.id];

    return (
      <Card
        key={concept.id}
        className={`transition-all border ${
          isExpanded ? 'border-slate-300 shadow-sm' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleExpand(concept.id)}
          className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-inset"
          aria-expanded={isExpanded}
        >
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                MODULE {concept.moduleId}
              </span>
              {getStatusBadge(concept.status)}
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded truncate max-w-full">
                {concept.symbolName}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
              {concept.name}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{concept.summary}</p>
            <div className="text-[11px] font-mono text-slate-400">
              Source: <span className="text-slate-600">{concept.sourcePath}</span>
            </div>
          </div>

          <div className="shrink-0 mt-1 p-1.5 rounded-lg bg-slate-100 text-slate-600">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  How It Works in C++17
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{concept.explanation}</p>
              </div>

              <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/80 p-3.5 space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
                  Why It Matters in This Project
                </div>
                <p className="text-xs text-emerald-950/90 leading-relaxed">
                  {concept.whyItMatters}
                </p>
              </div>
            </div>

            {concept.auditNote && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{concept.auditNote}</span>
              </div>
            )}

            <CppCodeBlock
              code={concept.codeExcerpt}
              sourcePath={concept.sourcePath}
              isSimplified={concept.isSimplified}
            />
          </div>
        )}
      </Card>
    );
  };

  const activeModuleMeta = EDUCATIONAL_MODULES.find((m) => m.id === activeView);

  return (
    <div className="space-y-6">
      {/* 1. Introductory Hero Section */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white overflow-hidden shadow-md">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                C++17 Academic Architecture Explorer • Verified Against Production Code
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
                <Code2 className="w-7 h-7 text-emerald-400 shrink-0" />
                Supermarket System OOP Concepts Explorer
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Why OOP here? A real supermarket billing system must guard against negative inventory, handle perishable vs. non-perishable rules polymorphically, apply interchangeable discount policies in exact integer paise, and guarantee ACID SQLite rollback if checkout fails. Every concept below maps directly to verified source files inside{' '}
                <code className="font-mono text-emerald-300 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  Supermarket_Management_System/backend/
                </code>
                .
              </p>
            </div>

            {/* Verified Audit Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 shrink-0">
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Audited</div>
                <div className="text-xl font-extrabold font-mono text-white">{auditStats.total}</div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">Verified</div>
                <div className="text-xl font-extrabold font-mono text-emerald-400">
                  {auditStats.verified}
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300">Partial</div>
                <div className="text-xl font-extrabold font-mono text-amber-400">
                  {auditStats.partial}
                </div>
              </div>
              <div className="rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">Modules</div>
                <div className="text-xl font-extrabold font-mono text-cyan-300">6</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Search & Status Filter Toolbar */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                aria-label="Search OOP concepts, C++ class names, or backend file paths"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search C++ concepts, class names (Product, IDiscountStrategy, RAII), or file paths..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filter concepts by audit verification status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ConceptStatus)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="PARTIALLY VERIFIED">Partially Verified</option>
              </select>

              {filteredConcepts.length > 0 && (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={expandAllVisible}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllVisible}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 transition-colors"
                  >
                    Collapse
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Main Responsive Layout: Sidebar Navigation + Interactive Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation (6 Modules + Diagrams + Quiz) */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-3 lg:sticky lg:top-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2.5">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Curriculum Modules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
              <nav aria-label="OOP Explorer Sections" className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1">
                  {EDUCATIONAL_MODULES.map((mod) => {
                    const count = OOP_CONCEPTS.filter((c) => c.moduleId === mod.id).length;
                    const isActive = !isSearching && activeView === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setActiveView(mod.id);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <div
                            className={`text-[10px] font-mono font-bold ${
                              isActive ? 'text-emerald-100' : 'text-slate-400'
                            }`}
                          >
                            {mod.code}
                          </div>
                          <div className="text-xs font-semibold truncate">{mod.title}</div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-2 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                  <button
                    type="button"
                    aria-current={!isSearching && activeView === 'DIAGRAMS' ? 'page' : undefined}
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setActiveView('DIAGRAMS');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      !isSearching && activeView === 'DIAGRAMS'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <GitBranch className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span className="text-xs font-semibold">Class Hierarchy Diagrams</span>
                  </button>

                  <button
                    type="button"
                    aria-current={!isSearching && activeView === 'QUIZ' ? 'page' : undefined}
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setActiveView('QUIZ');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      !isSearching && activeView === 'QUIZ'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 shrink-0 text-indigo-500" />
                    <span className="text-xs font-semibold">Knowledge Check Quiz (7 Qs)</span>
                  </button>

                  <button
                    type="button"
                    aria-current={!isSearching && activeView === 'ALL' ? 'page' : undefined}
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('ALL');
                      setActiveView('ALL');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      !isSearching && activeView === 'ALL'
                        ? 'bg-slate-200 text-slate-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>View All {auditStats.total} Concepts</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Pane */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
          {/* Active Search Notice */}
          {isSearching && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
              <span>
                Filtered View: Showing <strong>{filteredConcepts.length}</strong> matching concept(s)
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="font-semibold underline hover:text-indigo-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Diagrams View */}
          {!isSearching && activeView === 'DIAGRAMS' && <ArchitectureDiagrams />}

          {/* Quiz View */}
          {!isSearching && activeView === 'QUIZ' && <ConceptQuiz />}

          {/* Module Header Banner */}
          {!isSearching && activeModuleMeta && (
            <Card className="border-slate-200 bg-slate-50/70">
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="default" className="font-mono text-[10px]">
                    {activeModuleMeta.code}
                  </Badge>
                  <span className="text-xs font-medium text-slate-500">
                    {activeModuleMeta.subtitle}
                  </span>
                </div>
                <CardTitle className="text-lg text-slate-900">{activeModuleMeta.title}</CardTitle>
                <CardDescription className="text-xs text-slate-600 leading-relaxed">
                  {activeModuleMeta.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Interactive Module-Specific Labs */}
          {!isSearching && activeView === 'B' && <DiscountStrategySimulator />}
          {!isSearching && activeView === 'C' && (
            <>
              <ArchitectureDiagrams />
              <ObjectSlicingDemo />
            </>
          )}

          {/* Expandable Concept Cards */}
          {(isSearching || (activeView !== 'DIAGRAMS' && activeView !== 'QUIZ')) && (
            <div className="space-y-3">
              {filteredConcepts.length === 0 ? (
                <Card className="p-10 text-center text-xs text-slate-500">
                  No OOP concepts match your search query. Try searching for{' '}
                  <code className="font-mono">Product</code>, <code className="font-mono">RAII</code>, or{' '}
                  <code className="font-mono">dynamic_cast</code>.
                </Card>
              ) : (
                filteredConcepts.map(renderConceptCard)
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
