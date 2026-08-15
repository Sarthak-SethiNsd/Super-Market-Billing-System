<h1 id="use-case-specifications--billing-system">Use Case Specifications — Billing System</h1>
<h2 id="use-case-1-add-item-to-bill">Use Case 1: Add Item to Bill</h2>
<p><strong>Primary Actor:</strong> Customer</p>
<h3 id="stakeholders">Stakeholders</h3>
<ul>
<li><strong>Customer:</strong> Wants the selected item and requested quantity to be added correctly to the bill.</li>
<li><strong>Billing System:</strong> Must calculate the item amount accurately and prevent invalid entries from being added.</li>
<li><strong>Store:</strong> Needs accurate billing information for the transaction.</li>
</ul>
<h3 id="preconditions">Preconditions</h3>
<ol>
<li>The Billing System is running.</li>
<li>The item/stock data is available.</li>
<li>A billing transaction has been started.</li>
<li>The customer has an item code and quantity to enter.</li>
</ol>
<h3 id="postconditions">Postconditions</h3>
<p><strong>Success:</strong></p>
<ul>
<li>The selected item is added to the current bill.</li>
<li>The requested quantity is stored.</li>
<li>The amount for the item is calculated.</li>
</ul>
<p><strong>Failure:</strong></p>
<ul>
<li>An invalid item or quantity is not added to the bill.</li>
<li>The system informs the customer about the invalid entry.</li>
</ul>
<h3 id="trigger">Trigger</h3>
<p>The customer selects an item by entering its item code and then enters the required quantity.</p>
<h3 id="main-flow">Main Flow</h3>
<ol>
<li>The customer enters the item code.</li>
<li>The Billing System receives the item code.</li>
<li>The system searches the item/stock data.</li>
<li>The system retrieves the item's name and rate.</li>
<li>The customer enters the required quantity.</li>
<li>The system validates the item and quantity.</li>
<li>The system calculates the item amount using the rate and quantity.</li>
<li>The system creates the bill item.</li>
<li>The system adds the bill item to the current bill.</li>
<li>The system confirms that the item has been added.</li>
<li>The customer can continue adding another item.</li>
</ol>
<h3 id="alternate-flow-1-invalid-item-code">Alternate Flow 1: Invalid Item Code</h3>
<ol>
<li>The customer enters an item code.</li>
<li>The system searches the item/stock data.</li>
<li>No item is found for the entered code.</li>
<li>The system displays an invalid item-code message.</li>
<li>The item is not added to the bill.</li>
<li>The customer enters another item code and the use case continues.</li>
</ol>
<h3 id="alternate-flow-2-invalid-quantity">Alternate Flow 2: Invalid Quantity</h3>
<ol>
<li>The customer enters the quantity.</li>
<li>The system determines that the quantity is invalid, such as zero or a negative value.</li>
<li>The system displays an invalid-quantity message.</li>
<li>The item is not added to the bill.</li>
<li>The customer enters a valid quantity.</li>
<li>The use case continues from quantity validation.</li>
</ol>
<hr />
<h2 id="use-case-2-request-final-bill">Use Case 2: Request Final Bill</h2>
<p><strong>Primary Actor:</strong> Customer</p>
<h3 id="stakeholders-1">Stakeholders</h3>
<ul>
<li><strong>Customer:</strong> Wants an accurate final bill and total amount.</li>
<li><strong>Billing System:</strong> Must calculate the grand total correctly.</li>
<li><strong>Store:</strong> Needs a reliable record of the completed transaction.</li>
</ul>
<h3 id="preconditions-1">Preconditions</h3>
<ol>
<li>The Billing System is running.</li>
<li>A billing transaction has been started.</li>
<li>At least one valid item has been added to the current bill.</li>
<li>The item amounts have been calculated.</li>
</ol>
<h3 id="postconditions-1">Postconditions</h3>
<p><strong>Success:</strong></p>
<ul>
<li>The grand total is calculated.</li>
<li>The final bill is generated.</li>
<li>The completed bill is saved.</li>
<li>The bill is ready to be displayed or printed.</li>
</ul>
<p><strong>Failure:</strong></p>
<ul>
<li>A final bill is not generated when no valid items exist.</li>
<li>If storage fails, the system reports the failure and retains the bill information for another attempt.</li>
</ul>
<h3 id="trigger-1">Trigger:</h3>