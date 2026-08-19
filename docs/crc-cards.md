# CRC Cards — Supermarket Billing System
 
One card per surviving class from the noun–verb analysis.
 
> **CRC = Class | Responsibilities | Collaborators**
> - **Responsibility** = what this class *knows* (data) or *does* (behaviour)
> - **Collaborator** = another class it calls or depends on to fulfil a responsibility
 
---
 
## Card 1 — Customer
 
| **Class: Customer** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Know own identity (customerId, name) | — |
| Enter an item code to look up a product | Item |
| Enter a quantity for the chosen item | BillItem |
| Request the final bill when done shopping | Bill |
| View or receive the printed receipt | Receipt |
 
---
 
## Card 2 — Item
 
| **Class: Item** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Know its item code, name, rate, and stock level | — |
| Validate that an item code exists | — |
| Provide name and rate when queried | BillItem |
| Report invalid item code if not found | — |
 
---
 
## Card 3 — BillItem
 
| **Class: BillItem** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Know the item it references | Item |
| Know the quantity entered by the customer | — |
| Validate that quantity is positive (> 0) | — |
| Calculate its own line amount (rate × quantity) | Item |
| Report invalid quantity if entry is bad | — |
 
---
 
## Card 4 — Bill
 
| **Class: Bill** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Hold the collection of all BillItems | BillItem |
| Verify at least one valid item has been added | BillItem |
| Calculate or verify the amount of each BillItem | BillItem |
| Calculate the grand total of all BillItems | BillItem |
| Track its own status (in-progress / completed) | — |
| Initiate saving itself to storage | BillStorage |
| Provide data needed to generate the Receipt | Receipt |
 
---
 
## Card 5 — Receipt
 
| **Class: Receipt** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Receive a completed Bill | Bill |
| Display each item's name, quantity, rate, and amount | Bill |
| Display the grand total | Bill |
| Print the receipt to a printer | — |
| Fall back to on-screen display if printer unavailable | — |
| Retry display if the display operation fails | BillStorage |
 
---
 
## Card 6 — BillStorage
 
| **Class: BillStorage** | |
|---|---|
| **Responsibilities** | **Collaborators** |
| Accept a completed Bill for persistence | Bill |
| Save the Bill to the storage medium (file / DB) | Bill |
| Confirm a successful save | Bill |
| Report a storage failure to the caller | Bill |
| Retain the Bill in memory if save fails (allow retry) | Bill |