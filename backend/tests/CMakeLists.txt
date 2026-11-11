cmake_minimum_required(VERSION 3.15)

# Discount Tests
add_executable(test_discounts test_discounts.cpp)
target_link_libraries(test_discounts PRIVATE supermarket_domain)
target_include_directories(test_discounts PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME DiscountSuite COMMAND test_discounts)

# Inventory Tests
add_executable(test_inventory test_inventory.cpp)
target_link_libraries(test_inventory PRIVATE supermarket_domain)
target_include_directories(test_inventory PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME InventorySuite COMMAND test_inventory)

# Billing and Integration Tests
add_executable(test_billing test_billing.cpp)
target_link_libraries(test_billing PRIVATE supermarket_domain)
target_include_directories(test_billing PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME BillingSuite COMMAND test_billing)

# Database Persistence Tests
add_executable(test_database test_database.cpp)
target_link_libraries(test_database PRIVATE supermarket_domain)
target_include_directories(test_database PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME DatabaseSuite COMMAND test_database)

# REST API & Authentication Tests (Stage 3)
add_executable(test_api test_api.cpp)
target_link_libraries(test_api PRIVATE supermarket_domain)
target_include_directories(test_api PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/../include)
add_test(NAME ApiSuite COMMAND test_api)
