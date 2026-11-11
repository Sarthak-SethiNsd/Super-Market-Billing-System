# Use Case Specifications — Supermarket Billing System

## Use Case 1: Add Item to Bill

### Primary Actor
Customer

### Stakeholders
- **Customer:** Wants the selected item and requested quantity to be added correctly to the bill.
- **Billing System:** Must calculate the item amount accurately and prevent invalid entries from being added.
- **Store:** Needs accurate billing information for the transaction.

### Preconditions
- The Billing System is running.
- The item/stock data is available.
- A billing transaction has been started.
- The customer has an item code and quantity to enter.

### Postconditions

**Success:**
- The selected item is added to the current bill.
- The requested quantity is stored.
- The amount for the item is calculated.

**Failure:**
- An invalid item or quantity is not added to the bill.
- The system informs the customer about the invalid entry.

### Trigger
The customer selects an item by entering its item code and then enters the required quantity.

### Main Flow
1. The customer enters the item code.
2. The Billing System receives the item code.
3. The system searches the item/stock data.
4. The system retrieves the item's name and rate.
5. The customer enters the required quantity.
6. The system validates the item and quantity.
7. The system calculates the item amount using the rate and quantity.
8. The system creates the bill item.
9. The system adds the bill item to the current bill.
10. The system confirms that the item has been added.
11. The customer can continue adding another item.

### Alternate Flow 1: Invalid Item Code
1. The customer enters an item code.
2. The system searches the item/stock data.
3. No item is found for the entered code.
4. The system displays an invalid item-code message.
5. The item is not added to the bill.
6. The customer enters another item code.
7. The use case continues from item-code validation.

### Alternate Flow 2: Invalid Quantity
1. The customer enters the quantity.
2. The system validates the quantity.
3. The system determines that the quantity is invalid, such as zero or a negative value.
4. The system displays an invalid-quantity message.
5. The item is not added to the bill.
6. The customer enters a valid quantity.
7. The use case continues from quantity validation.


---

## Use Case 2: Request Final Bill

### Primary Actor
Customer

### Stakeholders
- **Customer:** Wants an accurate final bill and total amount.
- **Billing System:** Must calculate the grand total correctly.
- **Store:** Needs a reliable record of the completed transaction.

### Preconditions
- The Billing System is running.
- A billing transaction has been started.
- At least one valid item has been added to the current bill.
- The item amounts have been calculated.

### Postconditions

**Success:**
- The grand total is calculated.
- The final bill is generated.
- The completed bill is saved.
- The bill is ready to be displayed or printed.

**Failure:**
- A final bill is not generated when no valid items exist.
- If storage fails, the system reports the failure and retains the bill information for another attempt.

### Trigger
The customer requests the final bill after finishing item selection.

### Main Flow
1. The customer requests the final bill.
2. The Billing System retrieves all items in the current bill.
3. The system calculates or verifies the amount of each bill item.
4. The system calculates the grand total.
5. The system generates the final bill.
6. The system sends the completed bill data to bill storage.
7. The storage system confirms that the bill was saved successfully.
8. The system prepares the receipt.
9. The system displays or prints the final bill for the customer.

### Alternate Flow 1: No Items in Bill
1. The customer requests the final bill.
2. The system checks the current bill.
3. The system finds that no valid items have been added.
4. The system displays a message that the bill cannot be generated.
5. The customer returns to item selection.
6. The use case ends without generating a final bill.

### Alternate Flow 2: Bill Storage Failure
1. The system calculates the grand total successfully.
2. The system attempts to save the completed bill.
3. The bill storage operation fails.
4. The system informs the customer that the bill could not be saved.
5. The system retains the current bill information.
6. The customer or system can retry the save operation.


---

## Use Case 3: Display / Print Receipt

### Primary Actor
Customer

### Stakeholders
- **Customer:** Wants to receive a clear receipt containing the purchase details and final amount.
- **Billing System:** Must present accurate information from the completed bill.
- **Store:** Needs proof of the completed transaction.

### Preconditions
- A final bill has been generated.
- The grand total has been calculated.
- The bill contains at least one valid item.
- The completed bill is available in the system.

### Postconditions

**Success:**
- The customer receives or views the completed receipt.
- The receipt contains item details, quantities, rates, individual amounts, and the grand total.

**Failure:**
- If printing fails, the receipt can still be displayed electronically.
- The completed bill remains available in the system.

### Trigger
The final bill has been successfully generated and the system is ready to present the receipt.

### Main Flow
1. The Billing System receives the completed bill.
2. The system retrieves the items and their billing details.
3. The system displays each item's name.
4. The system displays the quantity of each item.
5. The system displays the rate of each item.
6. The system displays the amount for each item.
7. The system displays the grand total.
8. The system displays or prints the receipt.
9. The customer receives or views the final receipt.

### Alternate Flow 1: Printer Unavailable
1. The system attempts to print the receipt.
2. The printer is unavailable.
3. The system detects the printing failure.
4. The system informs the customer that printing is unavailable.
5. The system displays the completed receipt on the screen instead.
6. The customer can view the receipt electronically.

### Alternate Flow 2: Receipt Display Failure
1. The system attempts to display the receipt.
2. The display operation fails.
3. The system reports the error.
4. The system retrieves the saved bill information.
5. The system retries the receipt display.
6. If successful, the customer views the receipt.