# Noun–Verb Analysis — Supermarket Billing System

Source: Three use case specifications (Add Item to Bill, Request Final Bill, Display/Print Receipt)

---

## Step 1 — Raw Candidate List

Every noun and verb extracted from the three use case specs, before any filtering.

### Nouns (Candidate Classes)
| # | Noun Found in Specs |
|---|---------------------|
| 1 | Customer |
| 2 | Billing System |
| 3 | Item / Stock |
| 4 | Item Code |
| 5 | Name (item name) |
| 6 | Rate |
| 7 | Quantity |
| 8 | Amount |
| 9 | Bill Item |
| 10 | Bill |
| 11 | Grand Total |
| 12 | Receipt |
| 13 | Storage / Bill Storage |
| 14 | Store |
| 15 | Transaction |
| 16 | Message (error/info) |
| 17 | Printer |

### Verbs (Candidate Operations)
| # | Verb Found in Specs |
|---|---------------------|
| 1 | enter (item code, quantity) |
| 2 | search (item/stock data) |
| 3 | retrieve (name, rate) |
| 4 | validate (item, quantity) |
| 5 | calculate (amount, grand total) |
| 6 | create (bill item) |
| 7 | add (item to bill) |
| 8 | confirm (item added) |
| 9 | display (message, receipt) |
| 10 | request (final bill) |
| 11 | generate (final bill) |
| 12 | save (bill to storage) |
| 13 | prepare (receipt) |
| 14 | print (receipt) |
| 15 | retry (save, display) |

---

## Step 2 — The Four Filters

Each candidate noun is run through these four filters. If it fails any one, it is discarded.

| Filter | Rule |
|--------|------|
| F1 — Outside Scope | The system does not need to model it; it's an actor or external entity |
| F2 — Attribute/Value | It's a simple data value, not an object with its own behaviour |
| F3 — Duplicate / Synonym | Already captured by another surviving class |
| F4 — Vague / Irrelevant | Too abstract or just a system description word |

---

## Step 3 — Filter Applied to Each Candidate

| # | Candidate | Keep / Discard | Filter | Reason |
|---|-----------|----------------|--------|--------|
| 1 | Customer | ✅ Keep | — | Primary actor; has identity, triggers actions |
| 2 | Billing System | ❌ Discard | F4 | The system itself — not a class inside it |
| 3 | Item / Stock | ✅ Keep | — | Core entity with name, rate, code, stock level |
| 4 | Item Code | ❌ Discard | F2 | Simple string attribute of Item |
| 5 | Name | ❌ Discard | F2 | Simple string attribute of Item |
| 6 | Rate | ❌ Discard | F2 | Simple numeric attribute of Item |
| 7 | Quantity | ❌ Discard | F2 | Simple numeric attribute of BillItem |
| 8 | Amount | ❌ Discard | F2 | Calculated value = Rate × Quantity; attribute of BillItem |
| 9 | Bill Item | ✅ Keep | — | Has own data (item ref, qty, amount); distinct from Item |
| 10 | Bill | ✅ Keep | — | Aggregates BillItems; calculates grand total; saved |
| 11 | Grand Total | ❌ Discard | F2 | Numeric attribute of Bill |
| 12 | Receipt | ✅ Keep | — | Separate output object; has display/print behaviour |
| 13 | Storage / Bill Storage | ✅ Keep | — | Handles persistence; own responsibility (save, retry) |
| 14 | Store | ❌ Discard | F1 | External stakeholder; not modelled inside the system |
| 15 | Transaction | ❌ Discard | F3 | Synonym for Bill in this context |
| 16 | Message | ❌ Discard | F4 | Not a class; just a UI output string |
| 17 | Printer | ❌ Discard | F1 | External hardware device; outside system boundary |

---

## Step 4 — Surviving Classes

| Class | Why It Survived |
|-------|----------------|
| **Customer** | Actor with identity; initiates all three use cases |
| **Item** | Core product entity: code, name, rate, stock level |
| **BillItem** | Line-item in a bill: links an Item to its quantity and computed amount |
| **Bill** | Container for BillItems; owns grand total calculation and status |
| **Receipt** | Output artefact with display and print responsibility |
| **BillStorage** | Persistence layer: save a completed Bill, confirm or report failure |

---


