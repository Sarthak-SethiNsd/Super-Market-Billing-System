import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Calculator, Cpu, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

type SimStrategy = 'NONE' | 'PERCENTAGE' | 'FIXED';
type DerivedDemoClass = 'Perishable' | 'NonPerishable';

const SAMPLE_ITEMS = [
  { label: 'Basmati Rice 5kg (₹250)', price: '250', strat: 'PERCENTAGE' as SimStrategy, val: '10' },
  { label: 'Organic Milk 1L (₹62)', price: '62', strat: 'FIXED' as SimStrategy, val: '12' },
  { label: 'Zero Price (₹0)', price: '0', strat: 'PERCENTAGE' as SimStrategy, val: '25' },
  { label: '100% Off (₹185.50)', price: '185.50', strat: 'PERCENTAGE' as SimStrategy, val: '100' },
  { label: 'Fixed > Price (₹300 off ₹250)', price: '250', strat: 'FIXED' as SimStrategy, val: '300' },
];

export const DiscountStrategySimulator: React.FC = () => {
  const [priceInput, setPriceInput] = useState<string>('250');
  const [strategy, setStrategy] = useState<SimStrategy>('PERCENTAGE');
  const [strategyInput, setStrategyInput] = useState<string>('10');

  const parsedPrice = Number(priceInput);
  const isPriceMalformed = priceInput.trim() === '' || !Number.isFinite(parsedPrice);
  const isPriceNegative = Number.isFinite(parsedPrice) && parsedPrice < 0;
  const effectivePriceRupees = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0;
  const priceInPaise = Math.round(effectivePriceRupees * 100);

  const parsedParam = Number(strategyInput);
  const isParamMalformed =
    strategy !== 'NONE' && (strategyInput.trim() === '' || !Number.isFinite(parsedParam));

  let validationException: string | null = null;
  if (isPriceNegative) {
    validationException = 'Product::setPriceInPaise throws std::invalid_argument("Product price cannot be negative")';
  } else if (strategy === 'PERCENTAGE' && Number.isFinite(parsedParam) && (parsedParam < 0 || parsedParam > 100)) {
    validationException = 'PercentageDiscount::PercentageDiscount throws std::invalid_argument("Discount percentage must be between 0.0 and 100.0")';
  } else if (strategy === 'FIXED' && Number.isFinite(parsedParam) && parsedParam < 0) {
    validationException = 'FixedAmountDiscount::FixedAmountDiscount throws std::invalid_argument("Fixed discount amount cannot be negative")';
  } else if (isPriceMalformed || isParamMalformed) {
    validationException = 'Malformed or empty numeric input — non-finite values default to 0 in simulator preview.';
  }

  let discountPaise = 0;
  let cppClassName: 'NoDiscount' | 'PercentageDiscount' | 'FixedAmountDiscount' = 'NoDiscount';
  let cppConstructorArg = '';
  let cppExpression = 'return 0;';
  let isFixedCapped = false;

  if (strategy === 'PERCENTAGE') {
    const validPct = Number.isFinite(parsedParam) ? parsedParam : 0;
    const clampedPct = Math.min(100, Math.max(0, validPct));
    cppClassName = 'PercentageDiscount';
    cppConstructorArg = clampedPct.toFixed(1);

    if (priceInPaise <= 0 || clampedPct <= 0) {
      discountPaise = 0;
      cppExpression = `priceInPaise <= 0 || percent <= 0.0 -> 0 paise`;
    } else {
      discountPaise = Math.round((priceInPaise * clampedPct) / 100.0);
      cppExpression = `std::round((${priceInPaise} * ${clampedPct.toFixed(1)}) / 100.0) -> ${discountPaise} paise`;
    }
  } else if (strategy === 'FIXED') {
    const validRupees = Number.isFinite(parsedParam) && parsedParam > 0 ? parsedParam : 0;
    const flatPaise = Math.round(validRupees * 100);
    cppClassName = 'FixedAmountDiscount';
    cppConstructorArg = String(flatPaise);

    if (priceInPaise <= 0 || flatPaise <= 0) {
      discountPaise = 0;
      cppExpression = `priceInPaise <= 0 || amountInPaise <= 0 -> 0 paise`;
    } else {
      isFixedCapped = flatPaise > priceInPaise;
      discountPaise = Math.min(priceInPaise, flatPaise);
      cppExpression = `std::min(${priceInPaise}, ${flatPaise}) -> ${discountPaise} paise`;
    }
  }

  const finalPaise = Math.max(0, priceInPaise - discountPaise);

  return (
    <Card className="border-purple-200 bg-purple-50/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
            <Calculator className="w-4 h-4 text-purple-600" />
            Interactive Strategy Pattern &amp; Paise Math Simulator
          </CardTitle>
          <Badge variant="admin" className="text-[10px]">
            Educational Simulation (Non-Transactional)
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Mirrors exact C++ <code className="font-mono">IDiscountStrategy</code> integer paise arithmetic in <code className="font-mono">src/models/Discount.cpp</code> (client-side preview only — does not persist or bill).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preset & Boundary Case Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-600 mr-1">Test Cases:</span>
          {SAMPLE_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setPriceInput(item.price);
                setStrategy(item.strat);
                setStrategyInput(item.val);
              }}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-slate-200 hover:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 text-slate-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="sim-unit-price" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Unit Price (₹)
            </label>
            <input
              id="sim-unit-price"
              type="number"
              step="0.50"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
            />
          </div>

          <div>
            <label htmlFor="sim-strategy" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Concrete Strategy
            </label>
            <select
              id="sim-strategy"
              value={strategy}
              onChange={(e) => {
                const val = e.target.value as SimStrategy;
                setStrategy(val);
                if (val === 'PERCENTAGE' && Number(strategyInput) > 100) setStrategyInput('10');
              }}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
            >
              <option value="NONE">NoDiscount</option>
              <option value="PERCENTAGE">PercentageDiscount</option>
              <option value="FIXED">FixedAmountDiscount</option>
            </select>
          </div>

          <div>
            <label htmlFor="sim-param" className="block text-[11px] font-semibold text-slate-700 mb-1">
              {strategy === 'PERCENTAGE'
                ? 'Percentage (0 – 100%)'
                : strategy === 'FIXED'
                ? 'Flat Deduction (₹)'
                : 'No Parameter'}
            </label>
            <input
              id="sim-param"
              type="number"
              step="1"
              disabled={strategy === 'NONE'}
              value={strategy === 'NONE' ? '0' : strategyInput}
              onChange={(e) => setStrategyInput(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-600"
            />
          </div>
        </div>

        {/* C++ Domain Invariant Notice */}
        {validationException && (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 flex items-start gap-2 text-xs text-rose-900"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Backend Guard Triggered: </span>
              <code className="font-mono text-[11px]">{validationException}</code>
            </div>
          </div>
        )}

        {/* C++ Execution Trace */}
        <div className="rounded-xl bg-slate-900 text-slate-100 p-3.5 font-mono text-xs space-y-1.5 overflow-x-auto">
          <div className="text-slate-400 text-[11px]">
            // Simulated Polymorphic Strategy Trace (C++17 Integer Paise Arithmetic)
          </div>
          <div className="whitespace-nowrap">
            <span className="text-purple-400">std::shared_ptr&lt;IDiscountStrategy&gt;</span> strategy ={' '}
            <span className="text-cyan-300">std::make_shared&lt;{cppClassName}&gt;</span>(
            {cppConstructorArg});
          </div>
          <div className="whitespace-nowrap">
            <span className="text-cyan-300">int64_t</span> discount = strategy-&gt;calculateDiscount({priceInPaise});{' '}
            <span className="text-slate-400">// {cppExpression}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/70 rounded-lg p-2">
              <div className="text-[10px] text-slate-400">Original (Paise)</div>
              <div className="text-sm font-bold text-white">{priceInPaise} p</div>
              <div className="text-[10px] text-slate-400">₹{(priceInPaise / 100).toFixed(2)}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-2">
              <div className="text-[10px] text-amber-300">Discount Deducted</div>
              <div className="text-sm font-bold text-amber-400">-{discountPaise} p</div>
              <div className="text-[10px] text-amber-300">-₹{(discountPaise / 100).toFixed(2)}</div>
            </div>
            <div className="bg-emerald-950/70 border border-emerald-800 rounded-lg p-2">
              <div className="text-[10px] text-emerald-300">Final Payable</div>
              <div className="text-sm font-bold text-emerald-400">{finalPaise} p</div>
              <div className="text-[10px] text-emerald-300">₹{(finalPaise / 100).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-600">
          <Info className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
          <span>
            {isFixedCapped ? (
              <strong className="text-emerald-800">
                Cap Applied: Fixed deduction exceeded item price, so{' '}
                <code className="font-mono">std::min(priceInPaise, amountInPaise)</code> capped the deduction at {priceInPaise} p and kept payable total at ₹0.00.
              </strong>
            ) : (
              <>
                <code className="font-mono">FixedAmountDiscount::calculateDiscount</code> caps deductions at{' '}
                <code className="font-mono">std::min(priceInPaise, amountInPaise)</code>, and{' '}
                <code className="font-mono">IDiscountStrategy::getDiscountedPrice</code> floors payable amounts at zero.
              </>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export const ObjectSlicingDemo: React.FC = () => {
  const [mode, setMode] = useState<'VALUE' | 'BASE_REF_OR_PTR'>('VALUE');
  const [derivedClass, setDerivedClass] = useState<DerivedDemoClass>('Perishable');

  const isPerishable = derivedClass === 'Perishable';

  return (
    <Card className="border-amber-200 bg-amber-50/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
              <Cpu className="w-4 h-4 text-amber-600" />
              Interactive Object Slicing Lab ({derivedClass} &rarr; Product)
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Compares by-value copying into <code className="font-mono">Product</code> against passing/storing via{' '}
              <code className="font-mono">const Product&amp;</code> or{' '}
              <code className="font-mono">std::shared_ptr&lt;Product&gt;</code> for{' '}
              <code className="font-mono">Perishable</code> and <code className="font-mono">NonPerishable</code>.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Derived Class Switcher */}
            <div className="inline-flex rounded-lg bg-white border border-slate-200 p-0.5" role="group" aria-label="Choose derived Product subclass">
              {(['Perishable', 'NonPerishable'] as const).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  aria-pressed={derivedClass === cls}
                  onClick={() => setDerivedClass(cls)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 ${
                    derivedClass === cls
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            {/* Copy vs Reference/Smart Pointer Toggle */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200" role="group" aria-label="Object transfer mechanism">
              <button
                type="button"
                aria-pressed={mode === 'VALUE'}
                onClick={() => setMode('VALUE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 ${
                  mode === 'VALUE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assign by Value
              </button>
              <button
                type="button"
                aria-pressed={mode === 'BASE_REF_OR_PTR'}
                onClick={() => setMode('BASE_REF_OR_PTR')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  mode === 'BASE_REF_OR_PTR'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Product&amp; / shared_ptr&lt;Product&gt;
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Derived Object */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-2">
              <span className="font-mono">
                Source: {derivedClass} item
              </span>
              <Badge variant="outline" className="text-[10px]">
                Dynamic Type: {derivedClass}
              </Badge>
            </div>
            <div className="font-mono text-[11px] space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {isPerishable ? (
                <>
                  <div>id: 104 | name: &quot;Fresh Curd 500g&quot;</div>
                  <div>priceInPaise: 4000 | stock: 15</div>
                  <div className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Derived State &mdash; expiryDate: &quot;2026-11-12&quot;
                  </div>
                  <div className="text-indigo-700 pt-0.5">
                    virtual dispatch &rarr; Perishable::display() / getType()
                  </div>
                </>
              ) : (
                <>
                  <div>id: 103 | name: &quot;Iodized Salt 1kg&quot;</div>
                  <div>priceInPaise: 3000 | stock: 50</div>
                  <div className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    Derived Overrides &mdash; display(), getProductTypeString()
                  </div>
                  <div className="text-indigo-700 pt-0.5">
                    virtual dispatch &rarr; NonPerishable::display()
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Target Expression */}
          <div
            className={`rounded-xl border p-3.5 space-y-2 ${
              mode === 'VALUE'
                ? 'border-rose-300 bg-rose-50/40'
                : 'border-emerald-300 bg-emerald-50/40'
            }`}
          >
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] truncate">
                {mode === 'VALUE'
                  ? `Product sliced = item; // Copy by value`
                  : `const Product& ref = item; // or shared_ptr<Product>`}
              </span>
              {mode === 'VALUE' ? (
                <Badge variant="danger" className="text-[10px] gap-1 shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  SLICED
                </Badge>
              ) : (
                <Badge variant="success" className="text-[10px] gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  PRESERVED
                </Badge>
              )}
            </div>

            <div className="font-mono text-[11px] space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
              {mode === 'VALUE' ? (
                <>
                  <div className="text-rose-700 font-semibold">
                    Dynamic Type of &apos;sliced&apos;: Product (new base copy)
                  </div>
                  {isPerishable ? (
                    <>
                      <div>id: 104 | name: &quot;Fresh Curd 500g&quot; | stock: 15</div>
                      <div className="text-rose-600 line-through bg-rose-50 px-1.5 py-0.5 rounded">
                        expiryDate: &quot;2026-11-12&quot; (Sliced away by Product(const Product&amp;))
                      </div>
                    </>
                  ) : (
                    <>
                      <div>id: 103 | name: &quot;Iodized Salt 1kg&quot; | stock: 50</div>
                      <div className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        Derived identity sliced away &mdash; calls base Product::display()
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="text-emerald-700 font-semibold">
                    Dynamic Type Preserved: {derivedClass}
                  </div>
                  {isPerishable ? (
                    <>
                      <div>id: 104 | name: &quot;Fresh Curd 500g&quot; | stock: 15</div>
                      <div className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        + expiryDate: &quot;2026-11-12&quot; intact (virtual dispatch &rarr; Perishable)
                      </div>
                    </>
                  ) : (
                    <>
                      <div>id: 103 | name: &quot;Iodized Salt 1kg&quot; | stock: 50</div>
                      <div className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Virtual dispatch &rarr; NonPerishable::display() intact
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Display Output Comparison */}
        <div className="rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
          <div className="text-slate-400 text-[11px] mb-1">
            // Resulting C++ Output of {mode === 'VALUE' ? 'sliced.display()' : 'ref.display() / ptr->display()'}
          </div>
          {mode === 'VALUE' ? (
            <div className="text-rose-300">
              {isPerishable
                ? '[ID: 104] Fresh Curd 500g | Price: Rs.40.00 | Stock: 15'
                : '[ID: 103] Iodized Salt 1kg | Price: Rs.30.00 | Stock: 50'}
            </div>
          ) : (
            <div className="text-emerald-300">
              {isPerishable
                ? '[Perishable] [ID: 104] Fresh Curd 500g | Price: Rs.40.00 | Stock: 15 | Expiry: 2026-11-12'
                : '[Non-Perishable] [ID: 103] Iodized Salt 1kg | Price: Rs.30.00 | Stock: 50'}
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          In C++, assigning or passing a derived object by value to a <code className="font-mono">Product</code> copies only the <code className="font-mono">Product</code> subobject, slicing off derived state (<code className="font-mono">expiryDate</code>) and creating a base <code className="font-mono">Product</code> value. Using a polymorphic base reference (<code className="font-mono">const Product&amp;</code>) or pointer (<code className="font-mono">Product*</code> / <code className="font-mono">std::shared_ptr&lt;Product&gt;</code>) avoids copying by value and preserves virtual dispatch to the derived override.
        </p>
      </CardContent>
    </Card>
  );
};
