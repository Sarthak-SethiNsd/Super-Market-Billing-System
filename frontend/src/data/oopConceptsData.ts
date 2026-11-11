export type ConceptStatus = 'VERIFIED' | 'PARTIALLY VERIFIED' | 'NOT FOUND';

export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface OopConcept {
  id: string;
  moduleId: ModuleId;
  name: string;
  status: ConceptStatus;
  sourcePath: string;
  symbolName: string;
  summary: string;
  explanation: string;
  whyItMatters: string;
  codeExcerpt: string;
  isSimplified?: boolean;
  auditNote?: string;
}

export interface EducationalModule {
  id: ModuleId;
  code: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface QuizQuestion {
  id: string;
  moduleId: ModuleId;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceReference: string;
}

export const EDUCATIONAL_MODULES: EducationalModule[] = [
  {
    id: 'A',
    code: 'MODULE A',
    title: 'Foundations of Object Modeling',
    subtitle: 'Classes, Encapsulation, Constructors, Rule of Five & Static State',
    description:
      'Core object-oriented building blocks forming the Supermarket product catalog, nested stock metrics, const-correct interfaces, and safe copy/move resource lifecycles.',
  },
  {
    id: 'B',
    code: 'MODULE B',
    title: 'Polymorphism & Strategy Pattern',
    subtitle: 'Abstract Interfaces, Virtual Dispatch, Virtual Destructors & Overrides',
    description:
      'Extensible pricing policies via IDiscountStrategy pure virtual contracts, dynamic runtime binding, and keyword safeguards (override, final).',
  },
  {
    id: 'C',
    code: 'MODULE C',
    title: 'Inheritance & The Diamond Problem',
    subtitle: 'Single & Multiple Inheritance, Virtual Base Classes & Object Slicing',
    description:
      'Catalog specialization (Perishable/NonPerishable) and Personnel diamond resolution (Person -> Employee & Customer -> Manager).',
  },
  {
    id: 'D',
    code: 'MODULE D',
    title: 'Encapsulation, Exceptions & Operators',
    subtitle: 'Access Control, Friend Grants, Operator Overloading & Error Handling',
    description:
      'Controlled encapsulation exceptions (friend class Bill), algebraic merging (+, ==, <<, >>) on Bills/BillItems, and strict exception-safe validation.',
  },
  {
    id: 'E',
    code: 'MODULE E',
    title: 'Generic Programming & STL',
    subtitle: 'Class Templates, std::vector, std::optional, Lambdas & Algorithms',
    description:
      'Type-independent generic containers (Repository<T>, ApiResponse<T>) paired with STL algorithms and honest audit status of function templates.',
  },
  {
    id: 'F',
    code: 'MODULE F',
    title: 'Modern C++ & System Design',
    subtitle: 'RAII Database Guards, Move Semantics, Smart Pointers, RTTI & Currency',
    description:
      'Industrial C++17 architecture patterns powering SQLite persistence, transaction rollback, RTTI casts, and 64-bit integer paise precision.',
  },
];

export const OOP_CONCEPTS: OopConcept[] = [
  // =========================================================================
  // MODULE A — Foundations of Object Modeling
  // =========================================================================
  {
    id: 'a-classes-encapsulation',
    moduleId: 'A',
    name: 'Classes, Objects & Encapsulation',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp',
    symbolName: 'class Product',
    summary: 'Private entity attributes guarded by validated public mutators and const accessors.',
    explanation:
      'Product encapsulates its identity, SKU, name, brandId, categoryId, priceInPaise, stock, and discountStrategy under private access. External callers cannot assign negative stock or corrupt prices directly.',
    whyItMatters:
      'Prevents accidental inventory corruption or negative price overrides anywhere in the billing terminal or REST controllers.',
    codeExcerpt: `class Product {
private:
    int id;
    std::string sku;
    std::string name;
    int brandId;
    int categoryId;
    int64_t priceInPaise;
    int stock;
    std::shared_ptr<IDiscountStrategy> discountStrategy;

public:
    void reduceStock(int quantity);
    void addStock(int quantity);
    void setPriceInPaise(int64_t newPriceInPaise);
};`,
    isSimplified: true,
  },
  {
    id: 'a-constructors-overloading',
    moduleId: 'A',
    name: 'Constructors & Constructor Overloading',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp & src/models/Product.cpp',
    symbolName: 'Product::Product(...)',
    summary: 'Three overloaded constructors supporting default creation, DB hydration, and legacy rupees.',
    explanation:
      'Product declares a default constructor, a comprehensive constructor taking paise and an optional IDiscountStrategy smart pointer, and a backwards-compatible 3-argument constructor accepting price in rupees.',
    whyItMatters:
      'Allows SQLite repositories to hydrate full persisted rows cleanly while preserving compatibility with academic lab unit tests.',
    codeExcerpt: `// Default Constructor
Product();

// Comprehensive Constructor
Product(int id,
        const std::string& sku,
        const std::string& name,
        int brandId,
        int categoryId,
        int64_t priceInPaise,
        int initialStock,
        std::shared_ptr<IDiscountStrategy> discount = nullptr);

// Backwards-Compatible Legacy Constructor (for lab compatibility)
Product(const std::string& name, double priceInRupees, int initialStock);`,
  },
  {
    id: 'a-rule-of-five',
    moduleId: 'A',
    name: 'Copy/Move Constructors & Rule of Five',
    status: 'VERIFIED',
    sourcePath: 'backend/src/models/Product.cpp',
    symbolName: 'Product (Copy/Move Ctor & Assign, Virtual Dtor)',
    summary: 'Full Rule of Five implementation keeping static product/stock telemetry synchronized.',
    explanation:
      'Because Product tracks active object counts and total stock in static counters, compiler-generated copies would drift telemetry and shallow-copy discount strategies. The copy constructor deep-clones the strategy via clone(), and move constructors transfer ownership with noexcept.',
    whyItMatters:
      'Prevents counter drift when Products are copied into repositories or moved out of vectors during API search filtering.',
    codeExcerpt: `Product::Product(const Product& other) {
    this->id = other.id;
    this->sku = other.sku;
    this->name = other.name;
    this->brandId = other.brandId;
    this->categoryId = other.categoryId;
    this->priceInPaise = other.priceInPaise;
    this->stock = other.stock;
    if (other.discountStrategy) {
        this->discountStrategy = other.discountStrategy->clone();
    } else {
        this->discountStrategy = std::make_shared<NoDiscount>();
    }

    totalProducts++;
    totalStockUnits += this->stock;
}

Product::Product(Product&& other) noexcept {
    this->id = other.id;
    this->sku = std::move(other.sku);
    this->name = std::move(other.name);
    this->brandId = other.brandId;
    this->categoryId = other.categoryId;
    this->priceInPaise = other.priceInPaise;
    this->stock = other.stock;
    this->discountStrategy = std::move(other.discountStrategy);

    other.stock = 0;
    totalProducts++;
}`,
  },
  {
    id: 'a-const-correctness',
    moduleId: 'A',
    name: 'const Correctness & Immutable Queries',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp & repositories/ProductRepository.hpp',
    symbolName: 'const Member Functions & References',
    summary: 'Read-only accessors, display hooks, and reference parameters marked const.',
    explanation:
      'Getters (getName() const, getDiscountedPriceInPaise() const) and serializers accept const Product& or const Bill&. The compiler statically guarantees these inspection methods cannot mutate domain state.',
    whyItMatters:
      'Enables JSON serialization in ProductController::productToJson(const Product&, ...) and database inserts via const references safely.',
    codeExcerpt: `// Product.hpp
int getId() const;
int64_t getPriceInPaise() const;
int64_t getDiscountedPriceInPaise() const;
virtual void display() const;

// ProductRepository.hpp
int insert(const Product& product);
bool update(const Product& product);`,
    isSimplified: true,
  },
  {
    id: 'a-static-members',
    moduleId: 'A',
    name: 'Static Data Members & Static Methods',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp, Bill.hpp & auth/CryptoUtils.hpp',
    symbolName: 'Product::totalProducts, Bill::totalBillsCreated',
    summary: 'Class-wide telemetry counters and stateless utility factory methods.',
    explanation:
      'Product defines static int totalProducts and static int totalStockUnits incremented in constructors and decremented in destructors. Bill tracks static int totalBillsCreated. CryptoUtils exposes static cryptographic helpers without needing instance state.',
    whyItMatters:
      'Provides process-level memory diagnostics in the OOP demonstration driver and clean namespace-like stateless utilities in auth/controllers.',
    codeExcerpt: `// In Product.hpp:
static int totalProducts;
static int totalStockUnits;
static int getTotalProducts();
static int getTotalStockUnits();

// In Bill.hpp:
static int totalBillsCreated;
static int getTotalBillsCreated();`,
    isSimplified: true,
  },
  {
    id: 'a-nested-class',
    moduleId: 'A',
    name: 'Nested Classes (Product::StockInfo)',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp & src/models/Product.cpp',
    symbolName: 'Product::StockInfo',
    summary: 'Encapsulated inner class modeling partitioned reserved vs. available stock.',
    explanation:
      'StockInfo is declared inside the public scope of Product with its own private members (reserved, available) and const accessor methods, instantiated on demand via Product::getStockInfo().',
    whyItMatters:
      'Groups stock-partitioning logic cleanly under the Product namespace scope rather than polluting global model headers.',
    codeExcerpt: `class Product {
public:
    class StockInfo {
    private:
        int reserved;
        int available;

    public:
        StockInfo(int r, int a);
        void display() const;
        int getReserved() const;
        int getAvailable() const;
        int getTotal() const;
    };
    // ...
    StockInfo getStockInfo() const;
};`,
    isSimplified: true,
  },

  // =========================================================================
  // MODULE B — Polymorphism & Strategy Pattern
  // =========================================================================
  {
    id: 'b-abstract-strategy',
    moduleId: 'B',
    name: 'Abstract Class & IDiscountStrategy Interface',
    status: 'VERIFIED',
    sourcePath: 'backend/include/strategies/IDiscountStrategy.hpp',
    symbolName: 'class IDiscountStrategy',
    summary: 'Pure virtual interface defining polymorphic discount calculations and cloning.',
    explanation:
      'IDiscountStrategy declares five pure virtual methods (= 0): calculateDiscount, getType, getValue, getDescription, and clone. It provides a default virtual getDiscountedPrice() that floors payable amounts at zero.',
    whyItMatters:
      'Decouples pricing promotions from Product and Bill logic, allowing new seasonal discount formulas without altering checkout code.',
    codeExcerpt: `class IDiscountStrategy {
public:
    virtual ~IDiscountStrategy() = default;
    virtual int64_t calculateDiscount(int64_t priceInPaise) const = 0;
    virtual int64_t getDiscountedPrice(int64_t priceInPaise) const {
        int64_t discount = calculateDiscount(priceInPaise);
        return std::max(INT64_C(0), priceInPaise - discount);
    }
    virtual DiscountType getType() const = 0;
    virtual double getValue() const = 0;
    virtual std::string getDescription() const = 0;
    virtual std::unique_ptr<IDiscountStrategy> clone() const = 0;
};`,
    isSimplified: true,
  },
  {
    id: 'b-concrete-strategies',
    moduleId: 'B',
    name: 'Concrete Strategies (NoDiscount, Percentage, Fixed)',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Discount.hpp & src/models/Discount.cpp',
    symbolName: 'NoDiscount, PercentageDiscount, FixedAmountDiscount',
    summary: 'Three concrete Strategy implementations with domain invariant validation.',
    explanation:
      'NoDiscount returns 0. PercentageDiscount enforces [0.0, 100.0]% in its constructor and rounds deductions to nearest paisa. FixedAmountDiscount guarantees non-negative paise and caps deductions at std::min(priceInPaise, amountInPaise).',
    whyItMatters:
      'Prevents invalid promotions (like >100% off or negative flat discounts causing inflated prices) from ever entering the catalog.',
    codeExcerpt: `int64_t PercentageDiscount::calculateDiscount(int64_t priceInPaise) const {
    if (priceInPaise <= 0 || percent <= 0.0) {
        return 0;
    }
    // Round to nearest paisa
    double discount = (static_cast<double>(priceInPaise) * percent) / 100.0;
    return static_cast<int64_t>(std::round(discount));
}

int64_t FixedAmountDiscount::calculateDiscount(int64_t priceInPaise) const {
    if (priceInPaise <= 0 || amountInPaise <= 0) {
        return 0;
    }
    // Cannot exceed original product price
    return std::min(priceInPaise, amountInPaise);
}`,
    isSimplified: true,
  },
  {
    id: 'b-runtime-polymorphism',
    moduleId: 'B',
    name: 'Runtime Polymorphism & Virtual Dispatch',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp & src/main.cpp',
    symbolName: 'Product::display(), IDiscountStrategy::calculateDiscount()',
    summary: 'Base pointers and references resolve derived overrides dynamically at runtime.',
    explanation:
      'Note: Product::display() is virtual (not pure virtual) so base Product objects can still be instantiated, while Perishable and NonPerishable override it. When invoked through a polymorphic base pointer (Product*) or std::shared_ptr<Product>, C++ dynamic dispatch calls the derived class override matching the runtime dynamic type.',
    whyItMatters:
      'Allows ProductRepository::getAll() to return a homogeneous std::vector<std::shared_ptr<Product>> holding mixed Perishable and NonPerishable inventory.',
    codeExcerpt: `Product* catalog[3] = {p1, p2, p3};
for (int i = 0; i < 3; i++) {
    cout << "catalog[" << i << "]->display(): ";
    catalog[i]->display(); // Virtual dispatch dynamically resolves to derived display()
}`,
  },
  {
    id: 'b-virtual-destructors',
    moduleId: 'B',
    name: 'Virtual Destructors',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp, Person.hpp, IDiscountStrategy.hpp',
    symbolName: 'virtual ~Product(), virtual ~IDiscountStrategy(), virtual ~Person()',
    summary: 'Ensures complete derived class cleanup when deleted via base class pointers.',
    explanation:
      'All three polymorphic base types declare virtual destructors. Deleting a Perishable* through a Product* guarantees Perishable::~Perishable() (cleaning up its std::string expiryDate) runs before Product::~Product() decrements static counters.',
    whyItMatters:
      'Eliminates undefined behavior and string memory leaks when mixed inventory items go out of scope.',
    codeExcerpt: `// Product.hpp
virtual ~Product();

// IDiscountStrategy.hpp
virtual ~IDiscountStrategy() = default;

// Person.hpp
virtual ~Person() = default;`,
    isSimplified: true,
  },
  {
    id: 'b-override-final',
    moduleId: 'B',
    name: 'Contextual Specifiers: override and final',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Perishable.hpp & Discount.hpp',
    symbolName: 'override, class Discount final',
    summary: 'Compiler-checked virtual overriding and inheritance sealing via final.',
    explanation:
      'Perishable, NonPerishable, Employee, Customer, Manager, and concrete discount classes apply override to catch signature mismatches at compile time. Legacy class Discount uses the final specifier to prevent accidental subclassing.',
    whyItMatters:
      'Locks down method signatures during refactoring and explicitly preserves the legacy lab Discount utility as a sealed value type.',
    codeExcerpt: `// Perishable.hpp
void display() const override;
ProductType getType() const override;
std::string getProductTypeString() const override;

// Discount.hpp
class Discount final {
private:
    double percent;

public:
    explicit Discount(double p);

    double apply(double amountInRupees) const;
    int64_t applyToPaise(int64_t amountInPaise) const;
    double getPercent() const;
};`,
    isSimplified: true,
  },

  // =========================================================================
  // MODULE C — Inheritance & The Diamond Problem
  // =========================================================================
  {
    id: 'c-single-inheritance',
    moduleId: 'C',
    name: 'Single Public Inheritance (Catalog Specialization)',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Perishable.hpp & NonPerishable.hpp',
    symbolName: 'Perishable : public Product, NonPerishable : public Product',
    summary: 'Models IS-A relationships for perishable items with expiry dates vs. durable goods.',
    explanation:
      'Perishable extends Product by adding private std::string expiryDate and overriding display(), getType(), and getProductTypeString(). NonPerishable inherits Product directly to represent non-expiring items.',
    whyItMatters:
      'Maps seamlessly to the SQLite schema product_type column (PERISHABLE vs NON_PERISHABLE) and conditional expiry UI fields.',
    codeExcerpt: `class Perishable : public Product {
private:
    std::string expiryDate;

public:
    Perishable();

    // Comprehensive constructor
    Perishable(int id,
               const std::string& sku,
               const std::string& name,
               int brandId,
               int categoryId,
               int64_t priceInPaise,
               int initialStock,
               const std::string& expiry,
               std::shared_ptr<IDiscountStrategy> discount = nullptr);

    // Legacy constructor (preserves original lab interface)
    Perishable(const std::string& name, double priceInRupees, int initialStock, const std::string& expiry);

    std::string getExpiry() const;
    void setExpiry(const std::string& newExpiry);

    void display() const override;
    ProductType getType() const override;
    std::string getProductTypeString() const override;
};`,
  },
  {
    id: 'c-diamond-virtual-inheritance',
    moduleId: 'C',
    name: 'Multiple & Virtual Inheritance (Diamond Resolution)',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Person.hpp, Employee.hpp, Customer.hpp, Manager.hpp',
    symbolName: 'Manager : public Employee, public Customer',
    summary: 'Resolves the Person diamond hierarchy using virtual base classes.',
    explanation:
      'Employee and Customer both inherit virtually from Person (: virtual public Person). Manager inherits from both Employee and Customer. Virtual inheritance collapses duplicate Person subobjects into a single shared Person instance, initialized directly in Manager\'s constructor initializer list.',
    whyItMatters:
      'Eliminates diamond ambiguity (manager.getName() is unambiguous) and demonstrates classic C++ virtual base layout semantics.',
    codeExcerpt: `class Employee : virtual public Person { ... };
class Customer : virtual public Person { ... };

class Manager : public Employee, public Customer {
private:
    std::string department;
public:
    explicit Manager(const std::string& n,
                     const std::string& empId = "MGR-001",
                     int points = 500,
                     const std::string& dept = "Operations")
        : Person(n), Employee(n, empId), Customer(n, points), department(dept) {}
};`,
    isSimplified: true,
  },
  {
    id: 'c-object-slicing',
    moduleId: 'C',
    name: 'Object Slicing & Pointer/Reference Prevention',
    status: 'VERIFIED',
    sourcePath: 'backend/src/main.cpp',
    symbolName: 'Product slicedItem = perishableItem;',
    summary: 'Shows derived-class state loss when copying derived objects by value vs. using references or smart pointers.',
    explanation:
      'Assigning a Perishable instance by value to a Product variable copies only the Product base subobject via Product\'s copy constructor, slicing away Perishable-specific state (expiryDate) so the resulting variable has dynamic type Product and calls Product::display(). Passing or storing via const Product&, Product*, or std::shared_ptr<Product> avoids by-value slicing and preserves virtual dispatch to Perishable and NonPerishable overrides.',
    whyItMatters:
      'Explains why ProductRepository and ProductController exclusively pass std::shared_ptr<Product> and const Product& rather than value containers of Product.',
    codeExcerpt: `Perishable perishableItem(104, "SKU-CURD-04", "Fresh Curd 500g", 2, 20, 4000, 15, "2026-11-12");

// Assigning by value to Product slices away derived state (expiryDate):
Product slicedItem = perishableItem;
slicedItem.display();     // Dynamic type is Product -> calls Product::display()

// Avoid slicing via reference or smart pointer (e.g. main.cpp Product* / shared_ptr):
const Product& ref = perishableItem;
ref.display();            // Dynamic type is Perishable -> calls Perishable::display()`,
    isSimplified: true,
  },

  // =========================================================================
  // MODULE D — Encapsulation, Exceptions & Operator Overloading
  // =========================================================================
  {
    id: 'd-friend-class-functions',
    moduleId: 'D',
    name: 'Friend Classes & Friend Operator Functions',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Product.hpp, BillItem.hpp & Bill.hpp',
    symbolName: 'friend class Bill; friend operator==; friend operator<<',
    summary: 'Declares Bill as a friend of Product and grants symmetric non-member operators friend access.',
    explanation:
      'Product declares `friend class Bill;` inside its class body while keeping its public validated mutators (`reduceStock`). Symmetric non-member binary operators (`operator==`, `operator<<`, `operator+`, `operator>>`) across Product, BillItem, and Bill are declared as friend functions so they can read private fields cleanly.',
    whyItMatters:
      'Keeps private domain fields protected from arbitrary callers while supporting idiomatic non-member stream I/O and equality operators.',
    codeExcerpt: `// Friends for encapsulation exceptions (Product.hpp)
friend class Bill;
friend bool operator==(const Product& p1, const Product& p2);
friend std::ostream& operator<<(std::ostream& out, const Product& p);`,
    isSimplified: true,
  },
  {
    id: 'd-operator-overloading',
    moduleId: 'D',
    name: 'Operator Overloading (+, ==, <<, >>)',
    status: 'VERIFIED',
    sourcePath: 'backend/src/models/BillItem.cpp & src/models/Bill.cpp',
    symbolName: 'BillItem::operator+, operator==, Bill::operator+, operator<<, operator>>',
    summary: 'Domain-specific algebraic operators with safety invariant checks.',
    explanation:
      'BillItem operator+ merges quantities when names and finalUnitPriceInPaise match (throwing std::invalid_argument otherwise). BillItem operator== compares name and finalUnitPriceInPaise; Product operator== compares non-zero IDs (falling back to name). Bill operator+ concatenates bills, operator<< formats receipts, and operator>> parses whitespace-separated item inputs.',
    whyItMatters:
      'Makes C++ domain expressions expressive while guarding against silent data corruption when combining mismatched items.',
    codeExcerpt: `BillItem operator+(const BillItem& a, const BillItem& b) {
    if (a.name != b.name) {
        throw std::invalid_argument("Cannot combine line items with different product names: " + a.name + " vs " + b.name);
    }
    if (a.finalUnitPriceInPaise != b.finalUnitPriceInPaise) {
        throw std::invalid_argument("Cannot combine line items with different final unit prices for " + a.name);
    }
    return BillItem(a.productId, a.name, a.unitPriceInPaise, a.unitDiscountInPaise, a.quantity + b.quantity);
}`,
  },
  {
    id: 'd-method-overloading',
    moduleId: 'D',
    name: 'Function / Method Overloading',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Bill.hpp & PreparedStatement.hpp',
    symbolName: 'Bill::addItem(...), PreparedStatement::bind(...)',
    summary: 'Multiple compile-time resolved overloads accepting distinct types.',
    explanation:
      'Bill provides 3 overloaded addItem signatures: using the product\'s own strategy, an explicit IDiscountStrategy&, or a legacy Discount&. PreparedStatement::bind overloads for int, int64_t, double, std::string, and std::optional variants.',
    whyItMatters:
      'Provides type-safe convenience APIs for both modern strategy-based checkout and SQLite parameter binding.',
    codeExcerpt: `// Bill.hpp
void addItem(Product& p, int quantity);
void addItem(Product& p, int quantity, const IDiscountStrategy& strategy);
void addItem(Product& p, int quantity, Discount& d);

// PreparedStatement.hpp
void bind(int index, int value);
void bind(int index, int64_t value);
void bind(int index, const std::string& value);
void bind(int index, const std::optional<int>& value);`,
    isSimplified: true,
  },
  {
    id: 'd-exceptions-rollback',
    moduleId: 'D',
    name: 'Exception Handling & Transactional Integrity',
    status: 'VERIFIED',
    sourcePath: 'backend/src/models/Product.cpp, BillRepository.cpp, BillController.hpp',
    symbolName: 'std::invalid_argument, std::runtime_error, try/catch',
    summary: 'Standard C++ exceptions enforce business invariants and trigger rollback when thrown inside an active Transaction.',
    explanation:
      'Domain mutators throw std::invalid_argument on non-positive quantities/negative prices and std::runtime_error on insufficient stock. In BillRepository::saveBill, empty bills throw before any Transaction starts; once `Transaction tx(db)` is active, any thrown exception (e.g., insufficient DB stock or SQL error) unwinds the stack before `tx.commit()` is reached, so `~Transaction()` rolls back uncommitted work.',
    whyItMatters:
      'Guarantees that a failed checkout (such as an out-of-stock check or mid-transaction SQL failure) never leaves partial bills or leaked stock deductions in SQLite.',
    codeExcerpt: `void Product::reduceStock(int quantity) {
    if (quantity <= 0) {
        throw std::invalid_argument("Quantity must be positive");
    }
    if (quantity > this->stock) {
        throw std::runtime_error("Not enough stock for product: " + this->name);
    }
    this->stock -= quantity;
    totalStockUnits -= quantity;
}`,
  },

  // =========================================================================
  // MODULE E — Generic Programming & STL
  // =========================================================================
  {
    id: 'e-repository-template',
    moduleId: 'E',
    name: 'Class Template: Repository<T>',
    status: 'VERIFIED',
    sourcePath: 'backend/include/utils/Repository.hpp',
    symbolName: 'template <typename T> class Repository',
    summary: 'Generic type-independent in-memory storage backing entity lookup and filtering.',
    explanation:
      'Repository<T> stores elements in a std::vector<T> internally. It is parameterized on any type T (for example, instantiated in main.cpp as Repository<std::shared_ptr<Product>>, though T can be any copyable or movable domain type). It exposes add, find, filter, remove, and update using std::function predicates.',
    whyItMatters:
      'Eliminates duplicated container/filtering boilerplate across domain types by writing search and filter logic once in a generic template.',
    codeExcerpt: `template <typename T>
class Repository {
private:
    std::vector<T> storage;

public:
    Repository() = default;

    void add(const T& item) {
        storage.push_back(item);
    }

    void add(T&& item) {
        storage.push_back(std::move(item));
    }

    std::optional<T> find(std::function<bool(const T&)> predicate) const {
        auto it = std::find_if(storage.begin(), storage.end(), predicate);
        if (it != storage.end()) {
            return *it;
        }
        return std::nullopt;
    }
    // ...
};`,
    isSimplified: true,
  },
  {
    id: 'e-apiresponse-template',
    moduleId: 'E',
    name: 'Class Template: ApiResponse<T>',
    status: 'VERIFIED',
    sourcePath: 'backend/include/utils/ApiResponse.hpp',
    symbolName: 'template <typename T> class ApiResponse',
    summary: 'Type-safe response envelope wrapping optional payloads with std::chrono timestamps.',
    explanation:
      'ApiResponse<T> wraps success status, message, std::optional<T> payload, and millisecond epoch timestamp. Static factory helpers ok() and error() enforce valid envelope construction.',
    whyItMatters:
      'Ensures uniform response contracts across C++ domain code and REST testing utilities without casting raw void pointers.',
    codeExcerpt: `template <typename T>
class ApiResponse {
private:
    bool success;
    std::string message;
    std::optional<T> data;
    int64_t timestamp;
public:
    static ApiResponse<T> ok(const T& payload, const std::string& msg = "Success");
    static ApiResponse<T> error(const std::string& msg);
};`,
    isSimplified: true,
  },
  {
    id: 'e-stl-containers-algorithms',
    moduleId: 'E',
    name: 'STL Containers, std::optional & Algorithms',
    status: 'VERIFIED',
    sourcePath: 'backend/include/utils/Repository.hpp, AuthService.hpp & src/main.cpp',
    symbolName: 'std::vector, std::unordered_map, std::optional, std::find_if, std::copy_if',
    summary: 'Idiomatic C++17 container and algorithm usage with lambda predicates.',
    explanation:
      'Bill uses std::vector<BillItem>; AuthService uses std::unordered_map<std::string, SessionInfo>; Repository<T> leverages std::find_if and std::copy_if with std::back_inserter and lambda expressions; Repositories return std::optional instead of nullable raw pointers.',
    whyItMatters:
      'Replaces error-prone manual arrays and null pointer checks with compile-time type safety and expressive functional queries.',
    codeExcerpt: `// From Repository.hpp:
std::vector<T> filter(std::function<bool(const T&)> predicate) const {
    std::vector<T> results;
    std::copy_if(storage.begin(), storage.end(), std::back_inserter(results), predicate);
    return results;
}

// Lambda usage in main.cpp:
auto perishableList = productRepo.filter([](const shared_ptr<Product>& prod) {
    return prod->getType() == ProductType::PERISHABLE;
});`,
    isSimplified: true,
  },
  {
    id: 'e-function-templates',
    moduleId: 'E',
    name: 'Standalone Function Templates',
    status: 'PARTIALLY VERIFIED',
    sourcePath: 'Supermarket_billing_System/1.cpp (Reference Only — Not in backend/utils/)',
    symbolName: 'maxOf<T> (in 1.cpp); Class Templates in backend/',
    summary: 'Class templates are verified in backend; standalone function templates exist only in the legacy lab reference.',
    explanation:
      'Audit Verification Notice: While the original academic submission (1.cpp) included a standalone function template maxOf<T>, the modular production backend in Supermarket_Management_System/backend/ implements templates strictly via Class Templates (Repository<T>, ApiResponse<T>) and STL algorithm templates rather than standalone utility function templates.',
    whyItMatters:
      'Maintaining strict truthfulness during academic evaluation ensures documentation never claims non-existent functions inside the production backend.',
    codeExcerpt: `// Audit Result: PARTIALLY VERIFIED
// Production backend uses Class Templates (Repository<T>, ApiResponse<T>)
// and STL function templates (std::find_if, std::copy_if, std::max, std::min).
// No standalone custom function templates are declared in backend/include/utils/.`,
    isSimplified: true,
    auditNote:
      'Marked PARTIALLY VERIFIED per Part 5A Architecture Audit: Class templates are VERIFIED; standalone custom function templates are absent from Supermarket_Management_System/backend/.',
  },

  // =========================================================================
  // MODULE F — Modern C++ & System Design
  // =========================================================================
  {
    id: 'f-raii-sqlite',
    moduleId: 'F',
    name: 'RAII Database Connection, Statements & Transaction Guards',
    status: 'VERIFIED',
    sourcePath: 'backend/include/database/Transaction.hpp & src/database/Transaction.cpp (+ DatabaseConnection, PreparedStatement)',
    symbolName: 'DatabaseConnection, PreparedStatement, Transaction',
    summary: 'Deterministic acquisition and cleanup of SQLite C API handles and ACID transactions.',
    explanation:
      'DatabaseConnection opens sqlite3* in its constructor and closes via sqlite3_close_v2() in ~DatabaseConnection(). PreparedStatement finalizes sqlite3_stmt* in its destructor. Transaction issues BEGIN TRANSACTION; on construction, commits only via explicit commit() (setting completed = true), and runs rollback() in ~Transaction() if completed is still false.',
    whyItMatters:
      'Makes resource leaks and uncommitted/dangling SQLite locks virtually impossible when exceptions unwind an active Transaction scope.',
    codeExcerpt: `Transaction::Transaction(DatabaseConnection& conn)
    : connection(conn), completed(false) {
    connection.execute("BEGIN TRANSACTION;");
}

Transaction::~Transaction() {
    if (!completed) {
        try {
            rollback();
        } catch (const std::exception& e) {
            std::cerr << "Failed to rollback transaction in destructor: " << e.what() << "\\n";
        }
    }
}`,
  },
  {
    id: 'f-move-deleted-copy',
    moduleId: 'F',
    name: 'Move Semantics & Deleted Copy Operations',
    status: 'VERIFIED',
    sourcePath: 'backend/include/database/DatabaseConnection.hpp & src/database/DatabaseConnection.cpp',
    symbolName: '= delete, Move Ctor & Move Assign (noexcept)',
    summary: 'Enforces unique ownership of low-level database handles via deleted copies and noexcept moves.',
    explanation:
      'DatabaseConnection and PreparedStatement delete their copy constructor and copy assignment operator (= delete) because duplicating a raw sqlite3* handle causes double-free bugs. They implement noexcept move constructors that transfer the pointer and null out the source.',
    whyItMatters:
      'Enforces single ownership at compile time while still allowing resource wrappers to be moved cleanly across scopes.',
    codeExcerpt: `// DatabaseConnection.hpp
DatabaseConnection(const DatabaseConnection&) = delete;
DatabaseConnection& operator=(const DatabaseConnection&) = delete;

// DatabaseConnection.cpp
DatabaseConnection::DatabaseConnection(DatabaseConnection&& other) noexcept
    : dbHandle(other.dbHandle), databasePath(std::move(other.databasePath)) {
    other.dbHandle = nullptr;
}`,
    isSimplified: true,
  },
  {
    id: 'f-smart-pointers',
    moduleId: 'F',
    name: 'Smart Pointers: unique_ptr vs shared_ptr',
    status: 'VERIFIED',
    sourcePath: 'backend/include/strategies/IDiscountStrategy.hpp, Product.hpp & src/models/Product.cpp',
    symbolName: 'std::unique_ptr<IDiscountStrategy>, std::shared_ptr<IDiscountStrategy>',
    summary: 'Explicit ownership distinction between exclusive cloning and shared runtime policies.',
    explanation:
      'IDiscountStrategy::clone() returns std::unique_ptr<IDiscountStrategy> (via std::make_unique) representing newly allocated exclusive ownership. Product stores std::shared_ptr<IDiscountStrategy> so discounts can be safely shared across instances or converted directly from unique_ptr during deep copy construction.',
    whyItMatters:
      'Completely eliminates manual delete calls on strategies and polymorphic Product pointers across the REST API.',
    codeExcerpt: `// IDiscountStrategy.hpp: Exclusive ownership returned by prototype clone()
virtual std::unique_ptr<IDiscountStrategy> clone() const = 0;

// Product.hpp: Shared ownership stored on domain objects
std::shared_ptr<IDiscountStrategy> discountStrategy;

// Product.cpp: Automatic unique_ptr -> shared_ptr conversion on copy
this->discountStrategy = other.discountStrategy->clone();`,
    isSimplified: true,
  },
  {
    id: 'f-rtti-dynamic-cast',
    moduleId: 'F',
    name: 'RTTI & dynamic_cast (Checked vs Unchecked Inspection)',
    status: 'VERIFIED',
    sourcePath: 'backend/include/controllers/ProductController.hpp & src/repositories/ProductRepository.cpp',
    symbolName: 'dynamic_cast<const Perishable*>, dynamic_cast<FixedAmountDiscount*>',
    summary: 'Downcasting polymorphic base pointers at runtime with explicit safety distinction.',
    explanation:
      'The backend uses RTTI downcasting in two distinct patterns: (1) For Perishable*, both ProductController and ProductRepository null-check the cast result (`if (per) expiry = per->getExpiry();`). (2) For FixedAmountDiscount* inside ProductRepository::insert/update, the cast result is dereferenced directly without a null check (`dynamic_cast<FixedAmountDiscount*>(strategy.get())->getAmountInPaise()`), relying on the preceding enum check (`strategy->getType() == DiscountType::FIXED`).',
    whyItMatters:
      'Demonstrates real-world RTTI downcasting while transparently noting that unchecked dynamic_cast dereferencing relies on enum invariants rather than defensive pointer null-checking.',
    codeExcerpt: `// 1. Null-checked dynamic_cast (ProductController.hpp:69-72 & ProductRepository.cpp:40-45)
if (p.getType() == ProductType::PERISHABLE) {
    const auto* per = dynamic_cast<const Perishable*>(&p);
    if (per) expiry = per->getExpiry();
}

// 2. Unchecked dynamic_cast relying on enum invariant (ProductRepository.cpp:54-57)
} else if (strategy->getType() == DiscountType::FIXED) {
    discountTypeStr = "FIXED";
    discountValue = static_cast<double>(
        dynamic_cast<FixedAmountDiscount*>(strategy.get())->getAmountInPaise()
    );
}`,
    isSimplified: true,
    auditNote:
      'Audit Accuracy Note: The Perishable* cast is safely null-checked; the FixedAmountDiscount* cast in ProductRepository.cpp is unchecked and depends on getType() matching the concrete subclass.',
  },
  {
    id: 'f-patterns-composition',
    moduleId: 'F',
    name: 'Design Patterns, Composition & Aggregation',
    status: 'VERIFIED',
    sourcePath: 'backend/include/models/Bill.hpp, Product.hpp, BillRepository.hpp',
    symbolName: 'Strategy, Repository, Prototype, Composition vs Aggregation',
    summary: 'Clean separation of persistence, behavior, and ownership lifetimes.',
    explanation:
      'Composition: Bill owns std::vector<BillItem> (line items live and die with the Bill snapshot). Aggregation: Product holds std::shared_ptr<IDiscountStrategy> and repositories hold DatabaseConnection& references. Patterns: Strategy (IDiscountStrategy), Prototype (clone()), Repository (SQLite + generic Repository<T>).',
    whyItMatters:
      'Keeps SQL statements isolated in repositories, pricing policies isolated in strategies, and HTTP routing isolated in controllers.',
    codeExcerpt: `// Composition in Bill.hpp: Bill owns BillItem value snapshots
std::vector<BillItem> items;

// Aggregation in BillRepository.hpp: borrows DatabaseConnection without owning it
class BillRepository {
private:
    DatabaseConnection& db;
public:
    explicit BillRepository(DatabaseConnection& conn) : db(conn) {}
};`,
    isSimplified: true,
  },
  {
    id: 'f-currency-paise',
    moduleId: 'F',
    name: 'Integer Paise Currency Representation',
    status: 'VERIFIED',
    sourcePath: 'backend/src/models/BillItem.cpp & src/models/Product.cpp',
    symbolName: 'int64_t priceInPaise, lineSubtotalInPaise, getPrice',
    summary: 'Eliminates IEEE-754 binary floating-point drift in billing and ledger totals.',
    explanation:
      'Storing currency as IEEE-754 double values introduces binary representation errors (e.g. 0.1 + 0.2 != 0.3). The backend stores all prices, discounts, and SQLite columns in exact 64-bit integer paise (1 Rupee = 100 Paise), converting to decimal rupees only for JSON display.',
    whyItMatters:
      'Guarantees exact financial reconciliation between line items, discounts, and SQLite SUM() aggregates across thousands of transactions.',
    codeExcerpt: `// BillItem.cpp (lines 50-52)
int64_t BillItem::lineSubtotalInPaise() const {
    return unitPriceInPaise * quantity;
}

// Product.cpp (line 188)
double Product::getPrice() const { return static_cast<double>(priceInPaise) / 100.0; }`,
    isSimplified: true,
  },
];

export const OOP_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    moduleId: 'B',
    question: 'Why does IDiscountStrategy declare a virtual destructor and clone() pure virtual method?',
    options: [
      'To allow deleting concrete discount strategies via base pointers safely and deep-copying strategies in Product copy constructors',
      'Because C++ requires every class with private fields to define clone()',
      'To convert fixed discounts automatically into percentage discounts at compile time',
      'To disable polymorphism on PercentageDiscount',
    ],
    correctIndex: 0,
    explanation:
      'A virtual destructor prevents undefined behavior when deleting derived objects via a base pointer, while clone() (returning std::unique_ptr<IDiscountStrategy>) enables Product\'s copy constructor to deep-copy the polymorphic strategy without knowing its concrete type.',
    sourceReference: 'include/strategies/IDiscountStrategy.hpp & src/models/Product.cpp',
  },
  {
    id: 'q2',
    moduleId: 'C',
    question: 'How does the Personnel hierarchy (Person, Employee, Customer, Manager) resolve the Diamond Problem?',
    options: [
      'Manager overrides getName() and deletes the Person base class',
      'Employee and Customer inherit from Person using virtual inheritance (: virtual public Person)',
      'Manager stores two separate Person objects and picks the first one',
      'Person is marked final so it cannot be inherited twice',
    ],
    correctIndex: 1,
    explanation:
      'Both Employee and Customer declare `: virtual public Person`. As a result, Manager inherits only ONE shared Person subobject and directly initializes Person(n) in its constructor initializer list.',
    sourceReference: 'include/models/Employee.hpp, Customer.hpp, Manager.hpp',
  },
  {
    id: 'q3',
    moduleId: 'C',
    question: 'What happens when a Perishable object is assigned by value to a Product variable (`Product p = perishableItem;`)?',
    options: [
      'It triggers a compile-time error because Perishable has an extra field',
      'It performs automatic deep polymorphic cloning using virtual dispatch',
      'Object slicing occurs: only the Product subobject is copied, slicing away Perishable\'s derived state (expiryDate) so p has dynamic type Product',
      'The expiryDate moves into Product::StockInfo',
    ],
    correctIndex: 2,
    explanation:
      'Assigning a derived object by value to a base Product constructs p via Product(const Product&), slicing off derived members (expiryDate) so p is a Product object and p.display() calls Product::display(). Passing/storing via const Product&, Product*, or std::shared_ptr<Product> avoids this slicing and preserves polymorphic virtual dispatch.',
    sourceReference: 'src/main.cpp (Object Slicing Demonstration)',
  },
  {
    id: 'q4',
    moduleId: 'F',
    question: 'Inside BillRepository::saveBill, Transaction tx(db) begins a transaction before checking stock and committing at the end. What happens if an insufficient-stock exception is thrown during that check?',
    options: [
      'Partial line items remain committed in SQLite until manually deleted',
      'The exception unwinds the active Transaction tx before tx.commit() is reached, so ~Transaction() sees completed == false and executes ROLLBACK',
      'DatabaseConnection automatically closes the database file without rolling back',
      'The exception is suppressed and negative stock is written to SQLite',
    ],
    correctIndex: 1,
    explanation:
      'After checking bill.isEmpty(), BillRepository::saveBill constructs `Transaction tx(db)` (executing BEGIN TRANSACTION; with completed = false). If stock verification throws std::runtime_error while tx is active and before `tx.commit()` executes, stack unwinding invokes `~Transaction()`, which calls `rollback()` because `!completed`.',
    sourceReference: 'include/database/Transaction.hpp, src/database/Transaction.cpp & src/repositories/BillRepository.cpp',
  },
  {
    id: 'q5',
    moduleId: 'E',
    question: 'What does the architecture audit verify about template implementation in Supermarket_Management_System/backend/?',
    options: [
      'Only standalone function templates like maxOf<T> exist in the backend',
      'Repository<T> and ApiResponse<T> implement generic class templates; standalone custom function templates exist in 1.cpp reference only',
      'Repository<T> is hardcoded to store only raw Product* pointers',
      'C++ templates were removed in favor of void* pointers',
    ],
    correctIndex: 1,
    explanation:
      'The production backend uses generic class templates Repository<T> (backed by std::vector<T>) and ApiResponse<T> (backed by std::optional<T>). Standalone function templates like maxOf<T> are only in the original academic lab file 1.cpp.',
    sourceReference: 'include/utils/Repository.hpp & include/utils/ApiResponse.hpp',
  },
  {
    id: 'q6',
    moduleId: 'F',
    question: 'Which statement accurately describes dynamic_cast usage in the backend codebase?',
    options: [
      'Every dynamic_cast in the backend is strictly null-checked before dereferencing',
      'Perishable* casts are null-checked (`if (per)`), whereas the FixedAmountDiscount* cast in ProductRepository::insert/update relies on the enum invariant without a pointer null-check',
      'dynamic_cast is never used anywhere in the backend',
      'dynamic_cast is used to convert int64_t paise into double rupees',
    ],
    correctIndex: 1,
    explanation:
      'Both ProductController and ProductRepository null-check `if (per)` after casting to `const Perishable*`. However, ProductRepository::insert and update dereference `dynamic_cast<FixedAmountDiscount*>(strategy.get())->getAmountInPaise()` directly after checking `strategy->getType() == DiscountType::FIXED`.',
    sourceReference: 'include/controllers/ProductController.hpp & src/repositories/ProductRepository.cpp',
  },
  {
    id: 'q7',
    moduleId: 'A',
    question: 'Why does the Supermarket backend store all prices and discounts in int64_t paise instead of double rupees?',
    options: [
      'SQLite does not support decimal numbers',
      'To avoid IEEE-754 floating-point precision errors during unit multiplication, discounts, and SQL aggregates',
      'Because C++17 removed the double type for currency',
      'To double the speed of HTTP JSON string serialization',
    ],
    correctIndex: 1,
    explanation:
      'Binary floating-point arithmetic accumulates rounding errors (such as 0.1 + 0.2 != 0.3). Storing monetary amounts as 64-bit integer paise ensures exact line totals, discounts, and SQL SUM() reconciliation.',
    sourceReference: 'include/models/Product.hpp, BillItem.hpp, Bill.hpp',
  },
];
