## Problem Statement

Most supermarkets still bill and track stock by hand, or with systems that don't talk to each other. That gap shows up as wrong prices, mismatched stock counts, and slow lines at checkout — the exact things customers notice first.

This project automates that. A cashier (or a customer, in a self-checkout setup) looks up a product, sees its price, stock, and GST rate, then adds it to the bill, edits the quantity, or removes it before paying. The system handles the math on its own — line totals, subtotal, GST, final amount — validates whatever gets typed in, and refuses to sell more of an item than the store actually has. Bad input doesn't crash the program; that's what the exception handling is there for.

Once a sale closes, it prints a receipt and logs the transaction to a file, so nothing depends on memory or paper. Stock stays visible before every purchase, and management can pull a daily sales report to see what moved and how the day went.

It's really a way to put core OOP ideas to work instead of just reading about them: encapsulation for the product and bill classes, inheritance and polymorphism across item or user types, operator overloading for bill calculations, exception handling for bad input and stock errors, file handling for receipts and records, and basic data structures to hold it all.
