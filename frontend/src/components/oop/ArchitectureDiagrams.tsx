import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { GitBranch, Layers, Users, Receipt, Database, MousePointerClick } from 'lucide-react';

interface NodeInfo {
  id: string;
  name: string;
  stereotype: string;
  file: string;
  base: string;
  members: string;
  role: string;
}

const NODE_DETAILS: Record<string, NodeInfo> = {
  Product: {
    id: 'Product',
    name: 'Product',
    stereotype: 'Base Class (Polymorphic)',
    file: 'backend/include/models/Product.hpp',
    base: 'None',
    members: 'id, sku, name, priceInPaise, stock, shared_ptr<IDiscountStrategy>, static totalProducts',
    role: 'Base entity managing paise pricing, Rule of Five lifecycle, stock invariants, and nested StockInfo.',
  },
  StockInfo: {
    id: 'StockInfo',
    name: 'Product::StockInfo',
    stereotype: 'Nested Class',
    file: 'backend/include/models/Product.hpp',
    base: 'None (Scoped inside Product)',
    members: 'int reserved, int available',
    role: 'Encapsulates partitioned inventory quantities without polluting global namespace.',
  },
  Perishable: {
    id: 'Perishable',
    name: 'Perishable',
    stereotype: 'Derived Class',
    file: 'backend/include/models/Perishable.hpp',
    base: 'public Product',
    members: 'std::string expiryDate',
    role: 'Specializes Product with expiration tracking and overrides display(), getType(), getProductTypeString().',
  },
  NonPerishable: {
    id: 'NonPerishable',
    name: 'NonPerishable',
    stereotype: 'Derived Class',
    file: 'backend/include/models/NonPerishable.hpp',
    base: 'public Product',
    members: 'Inherits Product state',
    role: 'Models durable packaged items and overrides virtual display() & type identification hooks.',
  },
  IDiscountStrategy: {
    id: 'IDiscountStrategy',
    name: 'IDiscountStrategy',
    stereotype: 'Abstract Interface',
    file: 'backend/include/strategies/IDiscountStrategy.hpp',
    base: 'None (5 pure virtual methods)',
    members: 'virtual ~IDiscountStrategy() = default, calculateDiscount() = 0, clone() = 0',
    role: 'Defines polymorphic discount contract returning unique_ptr<IDiscountStrategy> on clone().',
  },
  NoDiscount: {
    id: 'NoDiscount',
    name: 'NoDiscount',
    stereotype: 'Concrete Strategy',
    file: 'backend/include/models/Discount.hpp',
    base: 'public IDiscountStrategy',
    members: 'Stateless default strategy',
    role: 'Null-object strategy returning 0 paise deduction.',
  },
  PercentageDiscount: {
    id: 'PercentageDiscount',
    name: 'PercentageDiscount',
    stereotype: 'Concrete Strategy',
    file: 'backend/include/models/Discount.hpp',
    base: 'public IDiscountStrategy',
    members: 'double percent (validated [0.0, 100.0])',
    role: 'Computes percentage price deductions rounded to nearest paisa.',
  },
  FixedAmountDiscount: {
    id: 'FixedAmountDiscount',
    name: 'FixedAmountDiscount',
    stereotype: 'Concrete Strategy',
    file: 'backend/include/models/Discount.hpp',
    base: 'public IDiscountStrategy',
    members: 'int64_t amountInPaise',
    role: 'Applies flat deductions capped via std::min(priceInPaise, amountInPaise).',
  },
  Person: {
    id: 'Person',
    name: 'Person',
    stereotype: 'Virtual Base Class',
    file: 'backend/include/models/Person.hpp',
    base: 'None',
    members: 'protected: std::string name',
    role: 'Common root of Personnel diamond hierarchy with virtual ~Person().',
  },
  Employee: {
    id: 'Employee',
    name: 'Employee',
    stereotype: 'Virtual Derived',
    file: 'backend/include/models/Employee.hpp',
    base: 'virtual public Person',
    members: 'protected: std::string employeeId',
    role: 'Left diamond wing using virtual inheritance to share Person subobject.',
  },
  Customer: {
    id: 'Customer',
    name: 'Customer',
    stereotype: 'Virtual Derived',
    file: 'backend/include/models/Customer.hpp',
    base: 'virtual public Person',
    members: 'protected: int loyaltyPoints',
    role: 'Right diamond wing using virtual inheritance to share Person subobject.',
  },
  Manager: {
    id: 'Manager',
    name: 'Manager',
    stereotype: 'Multiple Inheritance Leaf',
    file: 'backend/include/models/Manager.hpp',
    base: 'public Employee, public Customer',
    members: 'private: std::string department',
    role: 'Directly initializes virtual base Person(n), eliminating duplicate name copies.',
  },
  Bill: {
    id: 'Bill',
    name: 'Bill',
    stereotype: 'Aggregate / Friend Class',
    file: 'backend/include/models/Bill.hpp',
    base: 'None',
    members: 'std::vector<BillItem> items, static int totalBillsCreated',
    role: 'Owns line-item snapshots via composition; friend class of Product; supports operator+ and stream I/O.',
  },
  BillItem: {
    id: 'BillItem',
    name: 'BillItem',
    stereotype: 'Immutable Snapshot Value',
    file: 'backend/include/models/BillItem.hpp',
    base: 'None',
    members: 'productId, name, unitPriceInPaise, unitDiscountInPaise, finalUnitPriceInPaise, quantity',
    role: 'Freezes product name, unit price, and discount at checkout time; defines operator+, ==, <<.',
  },
  Repositories: {
    id: 'Repositories',
    name: 'SQLite Repositories',
    stereotype: 'Repository Pattern',
    file: 'backend/include/repositories/ProductRepository.hpp, BillRepository.hpp, InventoryRepository.hpp',
    base: 'None (Aggregate DatabaseConnection&)',
    members: 'DatabaseConnection& db',
    role: 'Translates relational SQLite rows and transactions into strongly-typed domain entities.',
  },
  RAII_DB: {
    id: 'RAII_DB',
    name: 'DatabaseConnection / PreparedStatement / Transaction',
    stereotype: 'RAII Resource Wrappers',
    file: 'backend/include/database/',
    base: 'Non-copyable (= delete), Move-only',
    members: 'sqlite3* dbHandle, sqlite3_stmt* stmtHandle, bool completed',
    role: 'Guarantees connection closure, statement finalization, and exception-safe transaction rollback.',
  },
};

type DiagramTab = 'product' | 'strategy' | 'diamond' | 'billing' | 'database';

export const ArchitectureDiagrams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiagramTab>('product');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('Product');

  const handleSelectTab = (tab: DiagramTab, defaultNode: string) => {
    setActiveTab(tab);
    setSelectedNodeId(defaultNode);
  };

  const selectedInfo = NODE_DETAILS[selectedNodeId];

  const NodeButton: React.FC<{ id: string; badge?: string; subtitle?: string; accent?: string }> = ({
    id,
    badge,
    subtitle,
    accent = 'border-slate-300 bg-white hover:border-emerald-500',
  }) => {
    const isSelected = selectedNodeId === id;
    return (
      <button
        type="button"
        onClick={() => setSelectedNodeId(id)}
        aria-pressed={isSelected}
        className={`w-full sm:w-auto min-w-[175px] text-left px-4 py-3 rounded-xl border-2 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
          isSelected
            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
            : accent
        }`}
      >
        {badge && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">
            {badge}
          </div>
        )}
        <div className="font-mono text-sm font-bold text-slate-900">{NODE_DETAILS[id]?.name || id}</div>
        {subtitle && <div className="text-[11px] text-slate-600 mt-0.5">{subtitle}</div>}
      </button>
    );
  };

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-600" />
              Interactive C++ Class Hierarchy & Relationship Diagrams
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Click any class node to inspect its exact header file, base classes, members, and OOP role
            </CardDescription>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <MousePointerClick className="w-3.5 h-3.5 text-emerald-600" />
            Interactive Inspector
          </span>
        </div>

        {/* Diagram Switcher */}
        <div className="flex flex-wrap gap-1.5 pt-3" role="tablist" aria-label="Architecture diagram views">
          {[
            { id: 'product' as const, label: 'A. Product Hierarchy', icon: Layers, defaultNode: 'Product' },
            { id: 'strategy' as const, label: 'B. Discount Strategy', icon: GitBranch, defaultNode: 'IDiscountStrategy' },
            { id: 'diamond' as const, label: 'C. Diamond Inheritance', icon: Users, defaultNode: 'Manager' },
            { id: 'billing' as const, label: 'D. Bill Composition', icon: Receipt, defaultNode: 'Bill' },
            { id: 'database' as const, label: 'E. Repository & RAII DB', icon: Database, defaultNode: 'RAII_DB' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectTab(tab.id, tab.defaultNode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Diagram Canvas */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 sm:p-6 overflow-x-auto">
          {activeTab === 'product' && (
            <div className="flex flex-col items-center gap-4 min-w-[300px]">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <NodeButton id="Product" badge="Base Class • Virtual Dtor" subtitle="priceInPaise, stock, display()" />
                <div className="text-xs font-mono text-slate-500 px-2 py-1 rounded bg-white border border-slate-200">
                  ◆── nested class ──▶
                </div>
                <NodeButton id="StockInfo" badge="Nested Class" subtitle="reserved, available" />
              </div>
              <div className="text-xs font-mono text-emerald-700 font-semibold">
                ▲ public inheritance (IS-A)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <NodeButton id="Perishable" badge=": public Product" subtitle="+ expiryDate, override display()" />
                <NodeButton id="NonPerishable" badge=": public Product" subtitle="override display(), typeString()" />
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="flex flex-col items-center gap-4 min-w-[300px]">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <NodeButton id="Product" badge="Context Class" subtitle="holds shared_ptr<IDiscountStrategy>" />
                <div className="text-xs font-mono text-slate-500 px-2.5 py-1 rounded bg-white border border-slate-200">
                  ◇── aggregates ──▶
                </div>
                <NodeButton
                  id="IDiscountStrategy"
                  badge="Abstract Interface (= 0)"
                  subtitle="calculateDiscount(), clone()"
                  accent="border-purple-300 bg-purple-50/40 hover:border-purple-500"
                />
              </div>
              <div className="text-xs font-mono text-purple-700 font-semibold">
                ▲ implements pure virtual interface
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                <NodeButton id="NoDiscount" badge=": public IDiscountStrategy" subtitle="Returns 0 paise" />
                <NodeButton id="PercentageDiscount" badge=": public IDiscountStrategy" subtitle="0.0% – 100.0% off" />
                <NodeButton id="FixedAmountDiscount" badge=": public IDiscountStrategy" subtitle="Flat paise (capped)" />
              </div>
            </div>
          )}

          {activeTab === 'diamond' && (
            <div className="flex flex-col items-center gap-3 min-w-[300px]">
              <NodeButton
                id="Person"
                badge="Virtual Base Class"
                subtitle="std::string name"
                accent="border-indigo-300 bg-indigo-50/50 hover:border-indigo-500"
              />
              <div className="flex items-center justify-center gap-8 text-[11px] font-mono text-indigo-700 font-semibold">
                <span>↙ virtual public</span>
                <span>↘ virtual public</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                <NodeButton id="Employee" badge=": virtual public Person" subtitle="employeeId" />
                <NodeButton id="Customer" badge=": virtual public Person" subtitle="loyaltyPoints" />
              </div>
              <div className="flex items-center justify-center gap-8 text-[11px] font-mono text-emerald-700 font-semibold">
                <span>↘ public</span>
                <span>↙ public</span>
              </div>
              <NodeButton
                id="Manager"
                badge="Resolved Single Person Subobject"
                subtitle=": public Employee, public Customer"
                accent="border-emerald-300 bg-emerald-50/40 hover:border-emerald-500"
              />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 min-w-[300px]">
              <NodeButton id="Bill" badge="Aggregate Owner" subtitle="std::vector<BillItem> items" />
              <div className="flex flex-col items-center text-xs font-mono text-slate-600 px-2">
                <span>◆── composition (1 to *) ──▶</span>
                <span className="text-[10px] text-slate-400">value snapshots owned by Bill</span>
              </div>
              <NodeButton id="BillItem" badge="Immutable Line Snapshot" subtitle="unitPriceInPaise, operator+, ==" />
              <div className="flex flex-col items-center text-xs font-mono text-amber-700 px-2">
                <span>◀.. friend class Bill ..</span>
                <span className="text-[10px] text-slate-400">grants checkout stock access</span>
              </div>
              <NodeButton id="Product" badge="Catalog Entity" subtitle="friend class Bill;" />
            </div>
          )}

          {activeTab === 'database' && (
            <div className="flex flex-col items-center gap-4 min-w-[300px]">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <NodeButton id="Repositories" badge="Data Access Layer" subtitle="ProductRepository, BillRepository..." />
                <div className="text-xs font-mono text-slate-600 px-2 py-1 rounded bg-white border border-slate-200">
                  ── aggregates (&) / guards ──▶
                </div>
                <NodeButton
                  id="RAII_DB"
                  badge="SQLite RAII Wrappers"
                  subtitle="DatabaseConnection, PreparedStatement, Transaction"
                />
              </div>
              <p className="text-xs text-slate-600 text-center max-w-xl">
                Repositories borrow <code className="font-mono text-slate-800">DatabaseConnection&amp;</code> via constructor injection and open stack-scoped <code className="font-mono text-slate-800">PreparedStatement</code> and <code className="font-mono text-slate-800">Transaction</code> guards for exception-safe ACID execution.
              </p>
            </div>
          )}
        </div>

        {/* Selected Node Details Panel */}
        {selectedInfo && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900">{selectedInfo.name}</span>
                <Badge variant="success" className="text-[10px]">
                  {selectedInfo.stereotype}
                </Badge>
              </div>
              <span className="text-[11px] font-mono text-slate-500">{selectedInfo.file}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="font-semibold text-slate-700">Base Class(es): </span>
                <span className="font-mono text-slate-800">{selectedInfo.base}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Key Members: </span>
                <span className="font-mono text-slate-800">{selectedInfo.members}</span>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed pt-1">{selectedInfo.role}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
