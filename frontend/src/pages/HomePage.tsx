import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Lock,
  Menu,
  X,
  Car,
  Zap,
  HeartHandshake,
  Apple,
  Milk,
  Wheat,
  Coffee,
  Sparkle,
  BadgeCheck,
  Accessibility,
  ChevronDown
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const departments = [
    {
      id: 'produce',
      title: 'Fresh Fruits & Vegetables',
      icon: Apple,
      color: 'from-emerald-500 to-green-600',
      badge: 'Fresh Daily Stock',
      desc: 'Seasonal fruits, leafy greens, root vegetables, and cooking staples available for in-store selection.',
      highlights: ['Apples & Citrus', 'Leafy Greens', 'Potatoes & Onions', 'Seasonal Produce'],
    },
    {
      id: 'dairy',
      title: 'Dairy, Chilled & Eggs',
      icon: Milk,
      color: 'from-sky-500 to-blue-600',
      badge: 'Chilled Storage',
      desc: 'Milk, yogurts, butter, cheeses, and eggs stored in dedicated temperature-maintained refrigeration units.',
      highlights: ['Packaged Milk', 'Dairy Cheeses', 'Fresh Eggs', 'Butter & Curd'],
    },
    {
      id: 'bakery',
      title: 'Bakery & Bread',
      icon: Wheat,
      color: 'from-amber-500 to-orange-600',
      badge: 'Daily Replenished',
      desc: 'Artisanal breads, sandwich loaves, dinner rolls, and everyday bakery goods supplied daily.',
      highlights: ['Sandwich Loaves', 'Multigrain Breads', 'Buns & Rolls', 'Packaged Pastries'],
    },
    {
      id: 'staples',
      title: 'Grains, Spices & Pantry Staples',
      icon: Wheat,
      color: 'from-yellow-600 to-amber-700',
      badge: 'Pantry Range',
      desc: 'Quality rice varieties, pulses, cooking flours, edible oils, and packaged spices for household cooking.',
      highlights: ['Basmati & Raw Rice', 'Edible Oils', 'Pulses & Lentils', 'Wheat Flours'],
    },
    {
      id: 'beverages',
      title: 'Beverages, Teas & Coffees',
      icon: Coffee,
      color: 'from-rose-500 to-red-600',
      badge: 'Beverage Aisle',
      desc: 'Packaged teas, roast coffees, packaged fruit juices, mineral waters, and bottled beverages.',
      highlights: ['Packaged Teas', 'Ground Coffee', 'Fruit Beverages', 'Bottled Waters'],
    },
    {
      id: 'homecare',
      title: 'Home Care & Personal Essentials',
      icon: Sparkle,
      color: 'from-teal-500 to-emerald-700',
      badge: 'Household Range',
      desc: 'Laundry detergents, surface cleaners, paper goods, toiletries, and everyday household essentials.',
      highlights: ['Laundry Detergents', 'Surface Cleaners', 'Personal Care', 'Paper Products'],
    },
  ];

  const storeFacilities = [
    {
      icon: Car,
      title: 'Customer Parking Area',
      desc: 'Dedicated on-site parking spaces for customer vehicles during in-store shopping trips [Store Parking Details].',
    },
    {
      icon: Zap,
      title: 'Express Billing Lanes',
      desc: 'Dedicated checkout lanes for quick purchases and smaller baskets to keep wait times low.',
    },
    {
      icon: Accessibility,
      title: 'Store Accessibility',
      desc: 'Barrier-free entrances and accessible aisles designed for comfortable cart and wheelchair navigation.',
    },
    {
      icon: ShieldCheck,
      title: 'Clean Shopping Carts',
      desc: 'Regularly cleaned and maintained shopping carts and baskets available at store entrances.',
    },
    {
      icon: HeartHandshake,
      title: 'Customer Service Counter',
      desc: 'In-person help desk located near the store entrance for questions, billing receipts, and store information.',
    },
    {
      icon: Store,
      title: 'Fresh Pack & Assist',
      desc: 'Assistance available for packaging, item lookup, and weight verifications at physical service counters.',
    },
  ];

  const qualityPillars = [
    {
      title: 'Carefully Selected Stock',
      desc: 'Regular shelf replenishment and product checks across produce, dairy, and grocery departments.',
    },
    {
      title: 'Dedicated Chilled Displays',
      desc: 'Temperature-maintained display chillers for milk, dairy products, and refrigerated goods.',
    },
    {
      title: 'Clear Shelf Pricing',
      desc: 'Accurate and legible digital/shelf price tags corresponding to barcode scans at POS billing.',
    },
    {
      title: 'In-Store Customer Care',
      desc: 'Staff available on the floor and at the service desk to help resolve product questions.',
    },
  ];

  const faqs = [
    {
      q: 'Can I purchase items or place an order online through this website?',
      a: 'No. ApexMart is a physical brick-and-mortar supermarket. This website is strictly an informational company profile providing store hours, facilities, and product categories. All purchases and billing take place in person at our store checkout terminals.',
    },
    {
      q: 'What payment methods are accepted at the checkout counters?',
      a: 'In-store checkout counters accept standard commercial payment methods including major credit/debit cards, digital payments, and cash.',
    },
    {
      q: 'What are the store operating hours?',
      a: 'Store hours are subject to local scheduling. Standard placeholder: [Mon – Sun: 8:00 AM – 10:00 PM]. Please confirm with the store for holiday schedules.',
    },
    {
      q: 'What is the in-store return and exchange procedure?',
      a: 'For returns, exchanges, or item questions, please present your printed receipt at the in-store Customer Service Counter. Terms and return windows are governed by the in-store store policy [Store Policy Placeholder].',
    },
    {
      q: 'Where do store employees access the billing and management system?',
      a: 'Supermarket staff can access the internal Point of Sale (POS) and inventory system by clicking the "Staff Mode" button located in the website header or footer.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F1] text-[#303631] flex flex-col font-sans selection:bg-[#285943] selection:text-white">
      {/* Top Banner: Store Status & Configurable Placeholders */}
      <div className="bg-[#1f3029] text-[#d6e2dc] text-xs py-2 px-4 border-b border-[#334c41]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 text-[#d6e2dc] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#71836A]" />
              Hours: [Store Operating Hours - e.g. Mon–Sun: 8:00 AM – 10:00 PM]
            </span>
            <span className="hidden md:inline text-[#465a50]">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-[#b4c7be]">
              <MapPin className="w-3.5 h-3.5 text-[#71836A]" />
              [Store Address / Location Placeholder]
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 text-[#b4c7be]">
              <Phone className="w-3.5 h-3.5 text-[#71836A]" />
              <span>Contact: [Store Phone / Helpline]</span>
            </span>
            <span className="text-[#465a50]">|</span>
            {/* Secondary Staff Mode Entry Link */}
            <Link
              to="/staff"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#285943] hover:bg-[#1e4433] text-white border border-[#3d5a4d] transition-colors font-medium text-[11px]"
              title="Authorized employee and manager access only"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Mode</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Public Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E5E4DC] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded bg-[#285943] border border-[#3d5a4d] flex items-center justify-center text-white shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#303631] tracking-tight leading-tight">
                ApexMart
              </span>
              <span className="text-xs text-[#71836A] font-semibold tracking-wide">
                Supermarket & Grocery Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#777D76]">
            <a href="#departments" className="hover:text-[#285943] transition-colors">
              Departments
            </a>
            <a href="#quality" className="hover:text-[#285943] transition-colors">
              Store Standards
            </a>
            <a href="#services" className="hover:text-[#285943] transition-colors">
              Store Amenities
            </a>
            <a href="#about" className="hover:text-[#285943] transition-colors">
              About ApexMart
            </a>
            <a href="#visit" className="hover:text-[#285943] transition-colors">
              Hours & Contact
            </a>
          </nav>

          {/* Right Header Actions: Store Info & Staff Portal */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="#visit"
              className="px-4 py-2 text-xs font-semibold rounded border border-[#E5E4DC] text-[#303631] bg-white hover:bg-[#FAF9F5] hover:border-[#285943] hover:text-[#285943] transition-colors"
            >
              Store Info
            </a>

            {/* Clearly Visible Secondary Staff Mode Button */}
            <Link
              to="/staff"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded text-[#303631] bg-[#FAF9F5] hover:bg-[#F7F6F1] border border-[#E5E4DC] hover:border-[#285943] hover:text-[#285943] transition-colors group"
              title="Employee Point of Sale & Management Terminal"
            >
              <Lock className="w-3.5 h-3.5 text-[#71836A] group-hover:text-[#285943] transition-colors" />
              <span>Staff Mode</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/staff"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded bg-[#FAF9F5] text-[#303631] border border-[#E5E4DC] hover:border-[#285943] hover:text-[#285943] transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-[#71836A]" />
              <span>Staff</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#303631] hover:text-[#285943] hover:bg-[#FAF9F5] rounded"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-[#E5E4DC] px-4 pt-3 pb-5 space-y-3 shadow-xs">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-[#303631]">
              <a
                href="#departments"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[#FAF9F5]"
              >
                Product Departments
              </a>
              <a
                href="#quality"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[#FAF9F5]"
              >
                Store Standards
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[#FAF9F5]"
              >
                Store Amenities
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[#FAF9F5]"
              >
                About Us
              </a>
              <a
                href="#visit"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded hover:bg-[#FAF9F5]"
              >
                Hours & Contact
              </a>
            </nav>
            <div className="pt-2 border-t border-[#E5E4DC] flex flex-col gap-2">
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded bg-[#285943] text-white hover:bg-[#1e4433] border border-[#3d5a4d]"
              >
                <Lock className="w-4 h-4 text-[#d6e2dc]" />
                <span>Enter Staff Mode (POS & Management)</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#263B32] text-white py-16 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#334c41]">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1f3029] border border-[#334c41] text-[#d6e2dc] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#71836A]" />
              <span>Neighborhood Supermarket Store</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-white">
              Fresh Produce. <br />
              <span className="text-[#d6e2dc]">
                Everyday Grocery Essentials.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#b4c7be] leading-relaxed max-w-2xl">
              Welcome to <strong>ApexMart</strong>. A local physical supermarket offering fresh fruits,
              vegetables, dairy goods, bakery items, and household staples in a clean, organized shopping
              environment.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#departments"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs bg-[#285943] hover:bg-[#1e4433] text-white border border-[#3d5a4d] transition-colors"
              >
                <span>Explore Product Categories</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#visit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded font-bold text-xs bg-[#1f3029] hover:bg-[#192621] text-white border border-[#334c41] transition-colors"
              >
                <Clock className="w-4 h-4 text-[#71836A]" />
                <span>Store Hours & Location</span>
              </a>
            </div>

            {/* Factual Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-[#334c41]">
              <div className="space-y-1">
                <div className="text-[#d6e2dc] font-bold text-sm flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-[#71836A]" /> Fresh Stock
                </div>
                <div className="text-xs text-[#9cb5a8]">Daily Produce Aisle</div>
              </div>
              <div className="space-y-1">
                <div className="text-[#d6e2dc] font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#71836A]" /> Refrigerated
                </div>
                <div className="text-xs text-[#9cb5a8]">Dairy & Chilled Displays</div>
              </div>
              <div className="space-y-1">
                <div className="text-[#d6e2dc] font-bold text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#71836A]" /> In-Store
                </div>
                <div className="text-xs text-[#9cb5a8]">Checkout Billing</div>
              </div>
              <div className="space-y-1">
                <div className="text-[#d6e2dc] font-bold text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#71836A]" /> Open Daily
                </div>
                <div className="text-xs text-[#9cb5a8]">[Operating Hours]</div>
              </div>
            </div>
          </div>

          {/* Right Hero Graphic Card */}
          <div className="lg:col-span-5">
            <div className="rounded bg-[#1f3029] border border-[#334c41] p-6 sm:p-7 shadow-xs relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#334c41]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded bg-[#285943] text-white flex items-center justify-center font-bold">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">ApexMart Supermarket</h2>
                      <p className="text-xs text-[#9cb5a8]">In-Store Shopping</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#285943] text-[#d6e2dc] border border-[#3d5a4d]">
                    Retail Store
                  </span>
                </div>

                <div className="space-y-2.5 text-xs text-[#d6e2dc]">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#71836A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Operating Schedule:</strong>
                      <span>[Store Operating Hours - e.g. Mon–Sun: 8:00 AM – 10:00 PM]</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#71836A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Store Location:</strong>
                      <span>[Store Address, Street, City - Editable Placeholder]</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-[#71836A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block">Customer Helpline:</strong>
                      <span>[Store Contact Phone Number / Help Desk]</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#334c41] bg-[#192621] -mx-6 -mb-6 p-4 rounded-b">
                  <div className="text-[11px] text-[#9cb5a8] flex items-center justify-between mb-1.5">
                    <span>Retail Notice:</span>
                    <span className="text-[#d6e2dc] font-semibold">In-Store Shopping Only</span>
                  </div>
                  <p className="text-xs text-[#b4c7be] leading-relaxed italic">
                    "Visit our physical aisles for fresh produce, packaged groceries, and in-person checkout service."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Informational Product & Department Showcase */}
      <section id="departments" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EEF5F0] text-[#285943] text-xs font-semibold uppercase tracking-wider border border-[#C2D9C8]">
            In-Store Categories
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#303631] tracking-tight">
            Informational Product Showcase
          </h2>
          <p className="text-[#777D76] text-xs sm:text-sm leading-relaxed">
            Browse product categories available across our supermarket aisles.
          </p>
          <div className="inline-flex items-center gap-2 p-3 rounded bg-[#FAF3EA] border border-[#F0DDC5] text-[#C87D20] text-xs font-medium text-left">
            <span className="font-bold shrink-0">In-Store Shopping Note:</span>
            <span>ApexMart operates as a brick-and-mortar retail supermarket. This section displays category highlights for customer information. All sales and checkout occur in person at physical POS billing terminals.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.id}
                className="bg-white rounded border border-[#E5E4DC] hover:border-[#285943] transition-colors p-6 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#285943] bg-[#EEF5F0] border border-[#C2D9C8] px-2.5 py-0.5 rounded">
                      {dept.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#303631] group-hover:text-[#285943] transition-colors">
                      {dept.title}
                    </h3>
                    <p className="text-xs text-[#777D76] mt-1.5 leading-relaxed">
                      {dept.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E5E4DC]">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#777D76] mb-2">
                      Department Highlights:
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {dept.highlights.map((h, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium bg-[#FAF9F5] text-[#303631] border border-[#E5E4DC] px-2 py-0.5 rounded"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E5E4DC] flex items-center justify-between text-xs text-[#777D76]">
                  <span className="flex items-center gap-1 text-[#2E6F40] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In-Store Category
                  </span>
                  <span>Physical Store</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quality Standards & Store Commitment */}
      <section id="quality" className="bg-[#263B32] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-[#334c41]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-[#9cb5a8] text-xs font-bold uppercase tracking-widest">
              Store Practices
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Our In-Store Retail Standards
            </h2>
            <p className="text-[#b4c7be] text-xs sm:text-sm leading-relaxed">
              Operational practices focused on cleanliness, shelf organization, and clear pricing for shoppers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {qualityPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="bg-[#1f3029] border border-[#334c41] rounded p-5 space-y-2.5 hover:border-[#285943] transition-colors"
              >
                <div className="w-7 h-7 rounded bg-[#285943] text-white flex items-center justify-center font-bold text-xs">
                  0{idx + 1}
                </div>
                <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
                <p className="text-xs text-[#b4c7be] leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Facilities & Amenities */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#EEF5F0] text-[#285943] text-xs font-semibold uppercase tracking-wider border border-[#C2D9C8]">
            Store Amenities
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#303631] tracking-tight">
            Customer Services & Facilities
          </h2>
          <p className="text-[#777D76] text-xs sm:text-sm leading-relaxed">
            In-store facilities designed for convenient, accessible retail shopping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeFacilities.map((facility, idx) => {
            const Icon = facility.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-white rounded border border-[#E5E4DC] hover:border-[#285943] transition-colors flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#303631]">{facility.title}</h3>
                  <p className="text-xs text-[#777D76] leading-relaxed">{facility.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About Us & Company Background */}
      <section id="about" className="bg-[#FAF9F5] py-16 px-4 sm:px-6 lg:px-8 border-y border-[#E5E4DC]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[#71836A] text-xs font-bold uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#303631] tracking-tight leading-tight">
              ApexMart Retail Supermarket
            </h2>
            <p className="text-xs sm:text-sm text-[#777D76] leading-relaxed">
              ApexMart is a commercial supermarket providing fresh groceries, pantry staples, and household
              products to the local community through our physical retail facility.
            </p>
            <p className="text-xs sm:text-sm text-[#777D76] leading-relaxed">
              Our store features organized aisles, refrigerated displays for perishables, and electronic checkout
              counters to facilitate fast, itemized billing.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded border border-[#E5E4DC]">
                <span className="block text-base font-bold text-[#285943]">Multi-Category</span>
                <span className="text-xs text-[#777D76] font-medium">Produce, Dairy, Staples, Household</span>
              </div>
              <div className="bg-white p-4 rounded border border-[#E5E4DC]">
                <span className="block text-base font-bold text-[#285943]">Itemized POS</span>
                <span className="text-xs text-[#777D76] font-medium">Transparent Printed Receipts</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded border border-[#E5E4DC] p-6 space-y-5">
            <h3 className="text-base font-bold text-[#303631] border-b border-[#E5E4DC] pb-3">
              Store Operations & Policies
            </h3>
            <div className="space-y-4 text-xs text-[#777D76] leading-relaxed">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#303631] block">Regular Shelf Replenishment:</strong>
                  Produce, dairy, and grocery aisles are checked and restocked on a routine daily schedule.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#303631] block">Calibrated Scales & POS Receipts:</strong>
                  Loose and weight-based items are weighed at calibrated electronic scales, producing itemized customer receipts with exact prices and applicable discounts.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#303631] block">Customer Service Counter:</strong>
                  In-store staff are available during store hours to answer product questions, assist shoppers, and handle customer service requests.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opening Hours & Contact Placeholders Section */}
      <section id="visit" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Store Hours & Contacts */}
          <div className="lg:col-span-6 bg-white rounded border border-[#E5E4DC] p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <span className="text-[#71836A] text-xs font-bold uppercase tracking-wider">
                  Store Details
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#303631] tracking-tight">
                  Operating Hours & Store Contacts
                </h2>
                <p className="text-xs text-[#777D76]">
                  Contact information and operational schedule for customer visits.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#303631] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#285943]" /> Store Timings:
                    </span>
                    <span className="text-[11px] font-bold text-[#285943] bg-[#EEF5F0] border border-[#C2D9C8] px-2 py-0.5 rounded">
                      Placeholder
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#303631] pl-6">
                    [Store Operating Hours - e.g. Mon–Sun: 8:00 AM – 10:00 PM]
                  </p>
                  <p className="text-[11px] text-[#777D76] pl-6">
                    (Subject to store schedule and holiday adjustments)
                  </p>
                </div>

                <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#303631]">
                    <MapPin className="w-4 h-4 text-[#285943]" /> Physical Store Address:
                  </div>
                  <p className="text-xs font-semibold text-[#303631] pl-6">
                    [Store Street Address, City, State/Province, Postal Code]
                  </p>
                  <p className="text-[11px] text-[#777D76] pl-6">
                    [Customer Parking Details / Landmark Placeholder]
                  </p>
                </div>

                <div className="p-3.5 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#303631]">
                    <Phone className="w-4 h-4 text-[#285943]" /> Customer Support & Enquiries:
                  </div>
                  <p className="text-xs font-semibold text-[#303631] pl-6">
                    Store Phone: [Store Contact / Telephone Number Placeholder]
                  </p>
                  <p className="text-[11px] text-[#777D76] pl-6 flex items-center gap-1.5 pt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#71836A]" />
                    Email: [store-support@example.com - Placeholder]
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E4DC] text-[11px] text-[#777D76]">
              * Note: All contact numbers, store hours, and addresses shown above are clearly labeled editable placeholders for retail deployment.
            </div>
          </div>

          {/* Customer FAQs */}
          <div className="lg:col-span-6 bg-white rounded border border-[#E5E4DC] p-6 space-y-5">
            <div className="space-y-1.5">
              <span className="text-[#71836A] text-xs font-bold uppercase tracking-wider">
                Store FAQs
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#303631] tracking-tight">
                Frequently Asked In-Store Questions
              </h2>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded border border-[#E5E4DC] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-3.5 text-left font-bold text-xs sm:text-sm text-[#303631] hover:bg-[#FAF9F5] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#777D76] transition-transform ${
                        activeFaq === index ? 'rotate-180 text-[#285943]' : ''
                      }`}
                    />
                  </button>
                  {activeFaq === index && (
                    <div className="p-3.5 pt-0 text-xs text-[#777D76] leading-relaxed border-t border-[#E5E4DC] bg-[#FAF9F5]">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Staff Mode Access Card / Portal Banner */}
      <section className="bg-[#FAF9F5] border-t border-[#E5E4DC] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto rounded bg-white border border-[#E5E4DC] p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded bg-[#263B32] text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[#d6e2dc]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#303631]">
                Staff & Store Management Portal
              </h3>
              <p className="text-xs text-[#777D76] mt-0.5">
                Authorized entry point for cashiers and store administrators to access the internal POS terminal, stock audit, and management controls.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              to="/staff"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#285943] hover:bg-[#1e4433] text-white font-bold text-xs border border-[#3d5a4d] transition-colors group"
            >
              <span>Launch Staff Mode</span>
              <ArrowRight className="w-4 h-4 text-[#d6e2dc] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Public Website Footer */}
      <footer className="bg-[#263B32] text-[#d6e2dc] text-xs pt-14 pb-10 border-t border-[#334c41]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
            {/* Col 1: Brand & Bio */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-[#285943] border border-[#3d5a4d] flex items-center justify-center text-white">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">ApexMart</span>
              </div>
              <p className="text-xs text-[#b4c7be] leading-relaxed max-w-sm">
                ApexMart is a brick-and-mortar retail supermarket offering fresh produce, dairy products,
                packaged groceries, and home essentials to local shoppers.
              </p>
              <div className="text-[11px] text-[#9cb5a8]">
                [Store Address, Street, City - Placeholder]
              </div>
            </div>

            {/* Col 2: In-Store Departments */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Product Categories</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Fresh Fruits & Vegetables</a></li>
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Dairy, Chilled & Eggs</a></li>
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Bakery & Breads</a></li>
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Grains, Spices & Staples</a></li>
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Beverages & Juices</a></li>
                <li><a href="#departments" className="text-[#b4c7be] hover:text-white transition-colors">Home Care & Essentials</a></li>
              </ul>
            </div>

            {/* Col 3: Customer Care & Services */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Customer Information</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#visit" className="text-[#b4c7be] hover:text-white transition-colors">Store Hours & Contacts</a></li>
                <li><a href="#services" className="text-[#b4c7be] hover:text-white transition-colors">Store Facilities</a></li>
                <li><a href="#quality" className="text-[#b4c7be] hover:text-white transition-colors">Store Standards</a></li>
                <li><a href="#visit" className="text-[#b4c7be] hover:text-white transition-colors">Customer Service Counter</a></li>
                <li><span className="text-[#9cb5a8]">Phone: [Store Phone Placeholder]</span></li>
              </ul>
            </div>

            {/* Col 4: Staff Portal & Administration */}
            <div className="lg:col-span-2 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Staff Access</h4>
              <p className="text-[11px] text-[#b4c7be] leading-relaxed">
                Employee entry point for POS terminals and store management:
              </p>
              <Link
                to="/staff"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-[#1f3029] hover:bg-[#192621] text-[#d6e2dc] hover:text-white border border-[#334c41] text-xs font-semibold transition-colors w-full justify-center"
              >
                <Lock className="w-3.5 h-3.5 text-[#71836A]" />
                <span>Staff Mode Portal</span>
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-[#334c41] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9cb5a8]">
            <div>
              &copy; {new Date().getFullYear()} ApexMart Supermarket. All rights reserved. Physical retail supermarket.
            </div>
            <div className="flex items-center gap-4">
              <span>Electronic Billing</span>
              <span>•</span>
              <span>In-Store Shopping</span>
              <span>•</span>
              <Link to="/staff" className="hover:text-white text-[#9cb5a8]">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
