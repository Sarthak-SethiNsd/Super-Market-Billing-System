Use Case Specifications — Billing System
Use Case 1: Add Item to Bill
Primary Actor: Customer

Stakeholders
Customer: Wants the selected item and requested quantity to be added correctly to the bill.
Billing System: Must calculate the item amount accurately and prevent invalid entries from being added.
Store: Needs accurate billing information for the transaction.
Preconditions
The Billing System is running.
The item/stock data is available.
A billing transaction has been started.
The customer has an item code and quantity to enter.
Postconditions
Success:

The selected item is added to the current bill.
The requested quantity is stored.
The amount for the item is calculated.
Failure:

An invalid item or quantity is not added to the bill.
The system informs the customer about the invalid entry.
Trigger
The customer selects an item by entering its item code and then enters the required quantity.

Main Flow
The customer enters the item code.
The Billing System receives the item code.
The system searches the item/stock data.
The system retrieves the item's name and rate.
The customer enters the required quantity.
The system validates the item and quantity.
The system calculates the item amount using the rate and quantity.
The system creates the bill item.
The system adds the bill item to the current bill.
The system confirms that the item has been added.
The customer can continue adding another item.
Alternate Flow 1: Invalid Item Code
The customer enters an item code.
The system searches the item/stock data.
No item is found for the entered code.
The system displays an invalid item-code message.
The item is not added to the bill.
The customer enters another item code and the use case continues.
Alternate Flow 2: Invalid Quantity
The customer enters the quantity.
The system determines that the quantity is invalid, such as zero or a negative value.
The system displays an invalid-quantity message.
The item is not added to the bill.
The customer enters a valid quantity.
The use case continues from quantity validation.
Use Case 2: Request Final Bill
Primary Actor: Customer

Stakeholders
Customer: Wants an accurate final bill and total amount.
Billing System: Must calculate the grand total correctly.
Store: Needs a reliable record of the completed transaction.
Preconditions
The Billing System is running.
A billing transaction has been started.
At least one valid item has been added to the current bill.
The item amounts have been calculated.
Postconditions
Success:

The grand total is calculated.
The final bill is generated.
The completed bill is saved.
The bill is ready to be displayed or printed.
Failure:

A final bill is not generated when no valid items exist.
If storage fails, the system reports the failure and retains the bill information for another attempt.
Trigger
The customer requests the final bill after finishing item selection.

Main Flow
The customer requests the final bill.
The Billing System retrieves all items in the current bill.
The system calculates or verifies the amount of each bill item.
The system calculates the grand total.
The system generates the final bill.
The system sends the completed bill data to bill storage.
The storage confirms that the bill was saved successfully.
The system prepares the receipt.
The system displays or prints the final bill for the customer.
Alternate Flow 1: No Items in Bill
The customer requests the final bill.
The system checks the current bill.
The system finds that no valid items have been added.
The system displays a message that the bill cannot be generated.
The customer returns to item selection.
The use case ends without generating a final bill.
Alternate Flow 2: Bill Storage Failure
The system calculates the grand total successfully.
The system attempts to save the completed bill.
The bill storage operation fails.
The system informs the customer that the bill could not be saved.
The system retains the current bill information.
The customer or system can retry the save operation.
Use Case 3: Display / Print Receipt
Primary Actor: Customer

Stakeholders
Customer: Wants to receive a clear receipt containing the purchase details and final amount.
Billing System: Must present accurate information from the completed bill.
Store: Needs proof of the completed transaction.
Preconditions
A final bill has been generated.
The grand total has been calculated.
The bill contains at least one valid item.
Postconditions
Success:

The customer receives or views the completed receipt.
The receipt contains item details, quantities, rates, individual amounts, and the grand total.
Failure:

If printing fails, the receipt can still be displayed electronically.
The completed bill remains available in the system.
Trigger
The final bill has been successfully generated and the system is ready to present the receipt.

Main Flow
The Billing System receives the completed bill.
The system retrieves the items and their billing details.
The system displays each item's name.
The system displays the quantity of each item.
The system displays the rate of each item.
The system displays the amount for each item.
The system displays the grand total.
The system displays or prints the receipt.
The customer receives or views the final receipt.
Alternate Flow 1: Printer Unavailable
The system attempts to print the receipt.
The printer is unavailable.
The system detects the printing failure.
The system informs the customer that printing is unavailable.
The system displays the completed receipt on the screen instead.
The customer can view the receipt electronically.
Alternate Flow 2: Receipt Display Failure
The system attempts to display the receipt.
The display operation fails.
The system reports the error.
The system retrieves the saved bill information.
The system retries the receipt display.
If successful, the customer views the receipt.
