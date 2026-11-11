import React, { useState } from 'react';
import { Copy, Check, FileCode2, Info } from 'lucide-react';

interface CppCodeBlockProps {
  code: string;
  sourcePath: string;
  isSimplified?: boolean;
}

const KEYWORDS = new Set([
  'class', 'struct', 'public', 'private', 'protected', 'virtual', 'override', 'final',
  'const', 'static', 'friend', 'template', 'typename', 'return', 'if', 'else', 'for',
  'try', 'catch', 'throw', 'noexcept', 'delete', 'default', 'explicit', 'namespace',
  'using', 'enum', 'nullptr', 'true', 'false', 'this', 'auto', 'void', 'int', 'double',
  'bool', 'size_t', 'int64_t',
]);

const TYPES_AND_STD = new Set([
  'std', 'string', 'vector', 'optional', 'shared_ptr', 'unique_ptr', 'make_shared',
  'make_unique', 'function', 'unordered_map', 'mutex', 'ostream', 'istream', 'move',
  'round', 'min', 'max', 'find_if', 'copy_if', 'back_inserter', 'invalid_argument',
  'runtime_error', 'nullopt', 'Product', 'Perishable', 'NonPerishable', 'StockInfo',
  'Bill', 'BillItem', 'IDiscountStrategy', 'NoDiscount', 'PercentageDiscount',
  'FixedAmountDiscount', 'Discount', 'DiscountType', 'ProductType', 'Person',
  'Employee', 'Customer', 'Manager', 'Repository', 'ApiResponse', 'DatabaseConnection',
  'PreparedStatement', 'Transaction', 'dynamic_cast', 'static_cast', 'INT64_C', 'cerr',
]);

function highlightLine(line: string): React.ReactNode[] {
  // Handle single-line comments
  const commentIdx = line.indexOf('//');
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

  const nodes: React.ReactNode[] = [];
  // Tokenize string literals, numbers, identifiers, and punctuation
  const tokenRegex = /("(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[^\sA-Za-z0-9_"]+|\s+)/g;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(codePart)) !== null) {
    const token = match[0];
    if (token.startsWith('"')) {
      nodes.push(
        <span key={keyIdx++} className="text-amber-300">
          {token}
        </span>
      );
    } else if (/^\d/.test(token)) {
      nodes.push(
        <span key={keyIdx++} className="text-orange-300">
          {token}
        </span>
      );
    } else if (KEYWORDS.has(token)) {
      nodes.push(
        <span key={keyIdx++} className="text-purple-400 font-semibold">
          {token}
        </span>
      );
    } else if (TYPES_AND_STD.has(token)) {
      nodes.push(
        <span key={keyIdx++} className="text-cyan-300">
          {token}
        </span>
      );
    } else {
      nodes.push(<span key={keyIdx++}>{token}</span>);
    }
  }

  if (commentPart) {
    nodes.push(
      <span key={keyIdx++} className="text-slate-400 italic">
        {commentPart}
      </span>
    );
  }

  return nodes;
}

export const CppCodeBlock: React.FC<CppCodeBlockProps> = ({
  code,
  sourcePath,
  isSimplified = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-mono text-slate-300 truncate">{sourcePath}</span>
          {isSimplified && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium">
              <Info className="w-3 h-3" />
              Simplified Illustration
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 transition-colors"
          aria-label="Copy code excerpt"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-slate-100">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-slate-900/60">
                <td className="select-none pr-3 text-right text-slate-600 w-7 align-top">
                  {idx + 1}
                </td>
                <td className="whitespace-pre">{highlightLine(line)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
