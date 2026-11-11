#include "models/Product.hpp"
#include "models/Discount.hpp"
#include <iomanip>
#include <cmath>

// Static data member definition
int Product::totalProducts = 0;
int Product::totalStockUnits = 0;

int Product::getTotalProducts() {
    return totalProducts;
}

int Product::getTotalStockUnits() {
    return totalStockUnits;
}

// ==========================================
// Product::StockInfo Implementation
// ==========================================
Product::StockInfo::StockInfo(int r, int a) : reserved(r), available(a) {}

void Product::StockInfo::display() const {
    std::cout << "Reserved: " << reserved
              << "  Available: " << available
              << "  (Total: " << (reserved + available) << ")\n";
}

int Product::StockInfo::getReserved() const { return reserved; }
int Product::StockInfo::getAvailable() const { return available; }
int Product::StockInfo::getTotal() const { return reserved + available; }

// ==========================================
// Product Constructors and Destructor
// ==========================================
Product::Product() {
    this->id = 0;
    this->sku = "SKU-UNKNOWN";
    this->name = "Unknown";
    this->brandId = 0;
    this->categoryId = 0;
    this->priceInPaise = 0;
    this->stock = 0;
    this->discountStrategy = std::make_shared<NoDiscount>();

    totalProducts++;
    totalStockUnits += this->stock;
}

Product::Product(int id,
                 const std::string& sku,
                 const std::string& name,
                 int brandId,
                 int categoryId,
                 int64_t priceInPaise,
                 int initialStock,
                 std::shared_ptr<IDiscountStrategy> discount) {
    if (priceInPaise < 0) {
        throw std::invalid_argument("Product price cannot be negative");
    }
    if (initialStock < 0) {
        throw std::invalid_argument("Initial stock cannot be negative");
    }

    this->id = id;
    this->sku = sku;
    this->name = name;
    this->brandId = brandId;
    this->categoryId = categoryId;
    this->priceInPaise = priceInPaise;
    this->stock = initialStock;
    this->discountStrategy = discount ? discount : std::make_shared<NoDiscount>();

    totalProducts++;
    totalStockUnits += this->stock;
}

Product::Product(const std::string& name, double priceInRupees, int initialStock) {
    if (priceInRupees < 0.0) {
        throw std::invalid_argument("Price cannot be negative");
    }
    if (initialStock < 0) {
        throw std::invalid_argument("Stock cannot be negative");
    }

    this->id = totalProducts + 1;
    this->sku = "SKU-" + std::to_string(this->id);
    this->name = name;
    this->brandId = 1;
    this->categoryId = 1;
    this->priceInPaise = static_cast<int64_t>(std::round(priceInRupees * 100.0));
    this->stock = initialStock;
    this->discountStrategy = std::make_shared<NoDiscount>();

    totalProducts++;
    totalStockUnits += this->stock;
}

Product::~Product() {
    totalProducts--;
    totalStockUnits -= this->stock;
}

// ==========================================
// Rule of Five (Copy & Move)
// ==========================================
Product::Product(const Product& other) {
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

Product& Product::operator=(const Product& other) {
    if (this != &other) {
        totalStockUnits -= this->stock;

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

        totalStockUnits += this->stock;
    }
    return *this;
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
}

Product& Product::operator=(Product&& other) noexcept {
    if (this != &other) {
        totalStockUnits -= this->stock;

        this->id = other.id;
        this->sku = std::move(other.sku);
        this->name = std::move(other.name);
        this->brandId = other.brandId;
        this->categoryId = other.categoryId;
        this->priceInPaise = other.priceInPaise;
        this->stock = other.stock;
        this->discountStrategy = std::move(other.discountStrategy);

        other.stock = 0;
    }
    return *this;
}

// ==========================================
// Getters, Setters, and Operations
// ==========================================
int Product::getId() const { return id; }
std::string Product::getSku() const { return sku; }
std::string Product::getName() const { return name; }
int Product::getBrandId() const { return brandId; }
int Product::getCategoryId() const { return categoryId; }
int64_t Product::getPriceInPaise() const { return priceInPaise; }
double Product::getPrice() const { return static_cast<double>(priceInPaise) / 100.0; }
int Product::getStock() const { return stock; }

int64_t Product::getDiscountedPriceInPaise() const {
    if (!discountStrategy) return priceInPaise;
    return discountStrategy->getDiscountedPrice(priceInPaise);
}

double Product::getDiscountedPriceInRupees() const {
    return static_cast<double>(getDiscountedPriceInPaise()) / 100.0;
}

void Product::setDiscount(std::shared_ptr<IDiscountStrategy> strategy) {
    this->discountStrategy = strategy ? strategy : std::make_shared<NoDiscount>();
}

std::shared_ptr<IDiscountStrategy> Product::getDiscount() const {
    return discountStrategy;
}

void Product::setPriceInPaise(int64_t newPriceInPaise) {
    if (newPriceInPaise < 0) {
        throw std::invalid_argument("Product price cannot be negative");
    }
    this->priceInPaise = newPriceInPaise;
}

void Product::setPriceInRupees(double newPriceInRupees) {
    if (newPriceInRupees < 0.0) {
        throw std::invalid_argument("Product price cannot be negative");
    }
    this->priceInPaise = static_cast<int64_t>(std::round(newPriceInRupees * 100.0));
}

void Product::reduceStock(int quantity) {
    if (quantity <= 0) {
        throw std::invalid_argument("Quantity must be positive");
    }
    if (quantity > this->stock) {
        throw std::runtime_error("Not enough stock for product: " + this->name);
    }
    this->stock -= quantity;
    totalStockUnits -= quantity;
}

void Product::addStock(int quantity) {
    if (quantity <= 0) {
        throw std::invalid_argument("Restock quantity must be positive");
    }
    this->stock += quantity;
    totalStockUnits += quantity;
}

Product::StockInfo Product::getStockInfo() const {
    return StockInfo(0, this->stock);
}

void Product::display() const {
    std::cout << "[ID: " << id << "] " << name
              << " | Price: Rs." << std::fixed << std::setprecision(2) << getPrice()
              << " | Stock: " << stock;
    if (discountStrategy && discountStrategy->getType() != DiscountType::NONE) {
        std::cout << " (" << discountStrategy->getDescription()
                  << " -> Rs." << getDiscountedPriceInRupees() << ")";
    }
    std::cout << "\n";
}

ProductType Product::getType() const {
    return ProductType::NON_PERISHABLE;
}

std::string Product::getProductTypeString() const {
    return "Non-Perishable";
}

// ==========================================
// Friends and Operators
// ==========================================
bool operator==(const Product& p1, const Product& p2) {
    if (p1.id != 0 && p2.id != 0) {
        return p1.id == p2.id;
    }
    return p1.name == p2.name;
}

std::ostream& operator<<(std::ostream& out, const Product& p) {
    out << "[Product] ID: " << p.id
        << " | " << p.name
        << " | Price: Rs." << std::fixed << std::setprecision(2) << p.getPrice()
        << " | Stock: " << p.stock;
    return out;
}
