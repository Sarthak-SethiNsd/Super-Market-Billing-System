from graphviz import Digraph

# Create UML diagram
uml = Digraph(
    "SupermarketManagementSystem",
    format="png"
)

# General diagram settings
uml.attr(
    rankdir="TB",
    splines="ortho",
    nodesep="0.6",
    ranksep="0.8"
)

uml.attr(
    "node",
    shape="record",
    style="rounded",
    fontname="Helvetica",
    fontsize="11"
)

# -------------------------
# Classes
# -------------------------

uml.node(
    "Customer",
    """{Customer|
    - customerId : int\\l
    - name : string\\l
    - phone : string\\l
    - email : string\\l|
    + register()\\l
    + login()\\l
    + placeOrder()\\l
    + viewOrder()\\l
    }"""
)

uml.node(
    "Product",
    """{Product|
    - productId : int\\l
    - name : string\\l
    - category : string\\l
    - price : double\\l
    - quantity : int\\l|
    + getDetails()\\l
    + updatePrice()\\l
    }"""
)

uml.node(
    "Category",
    """{Category|
    - categoryId : int\\l
    - categoryName : string\\l|
    + addProduct()\\l
    + removeProduct()\\l
    }"""
)

uml.node(
    "Cart",
    """{Cart|
    - cartId : int\\l
    - totalAmount : double\\l|
    + addProduct()\\l
    + removeProduct()\\l
    + calculateTotal()\\l
    + clearCart()\\l
    }"""
)

uml.node(
    "Order",
    """{Order|
    - orderId : int\\l
    - orderDate : Date\\l
    - totalAmount : double\\l
    - status : string\\l|
    + createOrder()\\l
    + cancelOrder()\\l
    + calculateTotal()\\l
    }"""
)

uml.node(
    "Payment",
    """{Payment|
    - paymentId : int\\l
    - amount : double\\l
    - paymentMethod : string\\l
    - status : string\\l|
    + makePayment()\\l
    + refundPayment()\\l
    }"""
)

uml.node(
    "Admin",
    """{Admin|
    - adminId : int\\l
    - name : string\\l
    - username : string\\l|
    + login()\\l
    + addProduct()\\l
    + removeProduct()\\l
    + updateProduct()\\l
    }"""
)

uml.node(
    "Inventory",
    """{Inventory|
    - inventoryId : int\\l
    - stockLevel : int\\l|
    + addStock()\\l
    + removeStock()\\l
    + checkStock()\\l
    }"""
)

uml.node(
    "Supplier",
    """{Supplier|
    - supplierId : int\\l
    - name : string\\l
    - phone : string\\l|
    + supplyProduct()\\l
    + updateDetails()\\l
    }"""
)

# -------------------------
# Relationships
# -------------------------

# Customer relationships
uml.edge(
    "Customer",
    "Cart",
    label="  owns  ",
    arrowhead="none"
)

uml.edge(
    "Customer",
    "Order",
    label="  places  ",
    arrowhead="none"
)

# Cart contains products
uml.edge(
    "Cart",
    "Product",
    label="  contains  ",
    arrowhead="none"
)

# Order contains products
uml.edge(
    "Order",
    "Product",
    label="  contains  ",
    arrowhead="none"
)

# Order has payment
uml.edge(
    "Order",
    "Payment",
    label="  paid by  ",
    arrowhead="none"
)

# Product belongs to category
uml.edge(
    "Product",
    "Category",
    label="  belongs to  ",
    arrowhead="none"
)

# Inventory manages products
uml.edge(
    "Inventory",
    "Product",
    label="  manages  ",
    arrowhead="none"
)

# Supplier supplies products
uml.edge(
    "Supplier",
    "Product",
    label="  supplies  ",
    arrowhead="none"
)

# Admin manages inventory
uml.edge(
    "Admin",
    "Inventory",
    label="  manages  ",
    arrowhead="none"
)

# Admin manages products
uml.edge(
    "Admin",
    "Product",
    label="  manages  ",
    arrowhead="none"
)

# -------------------------
# Generate PNG
# -------------------------

output_file = uml.render(
    filename="supermarket_management_uml",
    cleanup=True
)

print("UML diagram generated successfully!")
print("File:", output_file)
