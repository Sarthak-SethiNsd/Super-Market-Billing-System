# Supermarket Management System — UML Diagrams

These diagrams are based on the project analysis document. GitHub renders the Mermaid diagrams automatically when they are placed inside Markdown files.

> **Note:** The object diagram uses illustrative sample values, not fixed values stored in the program.

## 1. UML Class Diagram

This diagram shows the main classes, inheritance, and important relationships.

```mermaid
classDiagram
    class Product {
        -string name
        -double price
        -int stock
        +Product()
        +Product(name, price, stock)
        +getName() string
        +getPrice() double
        +getStock() int
        +checkStockAlert()
        +reduceStock(quantity)
        +display()
        +getStockInfo() StockInfo
    }

    class StockInfo {
        +int reserved
        +int available
    }

    class Perishable {
        -string expiry
        +display()
    }

    class NonPerishable {
        +display()
    }

    class Discount {
        -double percent
        +Discount(percent)
        +apply(price) double
        +getPercent() double
    }

    class BillItem {
        -Product product
        -int quantity
        -double amount
        +operator+()
        +operator==()
        +operator<<()
    }

    class Bill {
        -vector~BillItem~ items
        -double total
        +addItem()
        +getTotal() double
        +isEmpty() bool
        +operator+()
        +operator==()
        +operator<<()
    }

    class Person
    class Employee
    class Customer
    class Manager

    Product <|-- Perishable
    Product <|-- NonPerishable
    Product ..> StockInfo : returns from getStockInfo()
    Bill *-- BillItem : contains
    BillItem --> Product : refers to
    Bill ..> Discount : discounted item addition

    Person <|-- Employee : virtual inheritance
    Person <|-- Customer : virtual inheritance
    Employee <|-- Manager
    Customer <|-- Manager

    note for Manager "Inherits Employee and Customer.\nVirtual inheritance of Person avoids duplicate Person base subobjects."
```

## 2. UML Object Diagram

This is an example runtime snapshot showing sample products, a bill, a bill item, and a discount.

```mermaid
flowchart TB
    Rice["**rice : Product**<br/>name = Rice<br/>price = 60.0<br/>stock = 20"]
    Milk["**milk : Perishable**<br/>name = Milk<br/>price = 30.0<br/>stock = 10<br/>expiry = sample date"]
    Soap["**soap : NonPerishable**<br/>name = Soap<br/>price = 40.0<br/>stock = 15"]

    Bill["**bill1 : Bill**<br/>items = {item1}<br/>total = 120.0 (example)"]
    Item["**item1 : BillItem**<br/>product = Rice<br/>quantity = 2<br/>amount = 120.0"]
    Disc["**discount1 : Discount**<br/>percent = 10.0"]

    Rice -. "selected for billing" .-> Item
    Bill -- "contains" --> Item
    Disc -. "used during discounted addition" .-> Bill
```

The values above are illustrative. Replace them with values from an actual program run if a runtime-specific object diagram is required.

## 3. UML Use-Case Diagram

The current application is a menu-driven console program. The diagram therefore uses one actor: **Store User / Cashier**.

```mermaid
flowchart LR
    User["Store User / Cashier"]

    subgraph System["Supermarket Management System"]
        UC1(["Enter product details"])
        UC2(["View product catalogue"])
        UC3(["Check stock alerts"])
        UC4(["Get budget-based recommendations"])
        UC5(["Select products and enter quantities"])
        UC6(["Apply discount"])
        UC7(["Generate / view bill"])
        UC8(["View product and stock summary"])
    end

    User --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6
    User --- UC7
    User --- UC8
```

## 4. CRC Summary

CRC means **Class–Responsibility–Collaborator**. This is included as a table because it is clearer and more readable than turning it into another relationship diagram.

| Class | Main responsibilities | Collaborators |
|---|---|---|
| `Product` | Store name, price and stock; provide getters; check low stock; safely reduce stock; display product; maintain counters. | `Perishable`, `NonPerishable`, `Bill`, `BillItem`, `main()` |
| `Perishable` | Represent a perishable product and display expiry information. | `Product`, `main()` |
| `NonPerishable` | Represent a non-perishable product and provide its display implementation. | `Product`, `main()` |
| `Discount` | Validate discount percentage and calculate discounted price. | `Bill`, `BillItem`, `main()` |
| `BillItem` | Represent one purchased line item and support its implemented operators. | `Product`, `Bill` |
| `Bill` | Store bill items; add normal/discounted items; calculate total; check empty state; maintain bill counter; support bill operators. | `BillItem`, `Product`, `Discount`, `main()` |
| `Person` | Common base type for the person inheritance demonstration. | `Employee`, `Customer` |
| `Employee` | Extend `Person` as an employee role. | `Person`, `Manager` |
| `Customer` | Extend `Person` as a customer role. | `Person`, `Manager` |
| `Manager` | Combine `Employee` and `Customer` through multiple inheritance. | `Employee`, `Customer`, `Person` |
| `Product::StockInfo` | Nested helper class for stock information returned by `Product::getStockInfo()`. | `Product` |

**Other program elements:** `recommendProducts()` filters available products by budget; `maxOf<T>()` is a function template; `Pair<T>` is a class template; `main()` coordinates input, menu actions, purchases, bill output and cleanup.

## 5. Noun–Verb Analysis

### Noun analysis

| Noun / phrase | Design result |
|---|---|
| Product | Class: `Product` |
| Perishable product | Derived class: `Perishable` |
| Non-perishable product | Derived class: `NonPerishable` |
| Discount | Class: `Discount` |
| Bill | Class: `Bill` |
| Bill item / quantity | Class: `BillItem`; quantity is item data |
| Person / Employee / Customer / Manager | Classes: `Person`, `Employee`, `Customer`, `Manager` |
| Stock information | Nested class: `Product::StockInfo` |
| Budget | Parameter to `recommendProducts()`; not a class |
| Catalogue / menu | Behaviour in `main()`; not a class |
| User / cashier | External actor in the use-case diagram |

### Verb analysis

| Verb | Mapped method / responsibility |
|---|---|
| Store / maintain | `Product` constructors and data members |
| Display / show | `Product::display()` and overridden `display()` methods |
| Check / alert | `Product::checkStockAlert()` |
| Reduce / update | `Product::reduceStock(quantity)` |
| Apply / calculate | `Discount::apply(price)`; `Bill::getTotal()` |
| Recommend / filter | `recommendProducts(products, n, budget)` |
| Add / compare | `Bill::addItem(...)`; overloaded `+` and `==` operators |
| Purchase / select | `main()`: select product, validate quantity and choose discount |
| Generate / print | Bill output and final bill summary |
| Inherit / specialize | `Perishable` and `NonPerishable` inherit `Product`; `Employee` and `Customer` virtually inherit `Person` |

---

## Accuracy notes

- The `Person` hierarchy and templates are OOP demonstrations; they are not directly part of the supermarket purchase workflow.
- The object diagram's names and values are examples only.
- The use-case diagram has one actor because the current console program does not implement separate login roles.
- The diagrams show the confirmed project structure and avoid inventing unavailable private fields or exact method signatures.
