cmake_minimum_required(VERSION 3.15)
project(SupermarketManagementSystem VERSION 1.0.0 LANGUAGES C CXX)

# Enforce C++17 Standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Platform and compiler warnings
if(MSVC)
    add_compile_options(/W4 /EHsc /utf-8 /permissive- /wd4244 /wd4267)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Global Definitions for Asio, Crow, and CRT
add_definitions(
    -DASIO_STANDALONE
    -D_WIN32_WINNT=0x0601
    -DNOMINMAX
    -D_CRT_SECURE_NO_WARNINGS
)

# Include Directories
set(DOMAIN_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/include)
set(SQLITE_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/sqlite)
set(CROW_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/crow)
set(ASIO_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/asio/include)
set(NLOHMANN_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party)

# Build SQLite3 Amalgamation Static Library
add_library(sqlite3_lib STATIC
    third_party/sqlite/sqlite3.c
)

target_include_directories(sqlite3_lib PUBLIC
    ${SQLITE_INCLUDE_DIR}
)

if(MSVC)
    target_compile_options(sqlite3_lib PRIVATE /W0)
else()
    target_compile_options(sqlite3_lib PRIVATE -w)
endif()

# Domain Model & Persistence Library Source Files
set(DOMAIN_SOURCES
    src/models/Product.cpp
    src/models/Perishable.cpp
    src/models/NonPerishable.cpp
    src/models/Discount.cpp
    src/models/BillItem.cpp
    src/models/Bill.cpp
    src/database/DatabaseConnection.cpp
    src/database/PreparedStatement.cpp
    src/database/Transaction.cpp
    src/database/DatabaseMigrator.cpp
    src/auth/CryptoUtils.cpp
    src/auth/AuthService.cpp
    src/repositories/UserRepository.cpp
    src/repositories/BrandRepository.cpp
    src/repositories/CategoryRepository.cpp
    src/repositories/ProductRepository.cpp
    src/repositories/InventoryRepository.cpp
    src/repositories/BillRepository.cpp
)

# Reusable Static Domain and Persistence Library
add_library(supermarket_domain STATIC
    ${DOMAIN_SOURCES}
)

target_link_libraries(supermarket_domain PUBLIC
    sqlite3_lib
    bcrypt
    ws2_32
    mswsock
)

target_include_directories(supermarket_domain PUBLIC
    $<BUILD_INTERFACE:${DOMAIN_INCLUDE_DIR}>
    $<BUILD_INTERFACE:${SQLITE_INCLUDE_DIR}>
    $<BUILD_INTERFACE:${CROW_INCLUDE_DIR}>
    $<BUILD_INTERFACE:${ASIO_INCLUDE_DIR}>
    $<BUILD_INTERFACE:${NLOHMANN_INCLUDE_DIR}>
    $<INSTALL_INTERFACE:include>
)

# Interactive OOP Concept Demo Application
add_executable(supermarket_demo
    src/main.cpp
)

target_link_libraries(supermarket_demo PRIVATE
    supermarket_domain
)

target_include_directories(supermarket_demo PRIVATE
    ${DOMAIN_INCLUDE_DIR}
    ${SQLITE_INCLUDE_DIR}
    ${CROW_INCLUDE_DIR}
    ${ASIO_INCLUDE_DIR}
    ${NLOHMANN_INCLUDE_DIR}
)

# Crow REST API Web Server Application (Stage 3)
add_executable(supermarket_server
    src/server_main.cpp
)

target_link_libraries(supermarket_server PRIVATE
    supermarket_domain
)

target_include_directories(supermarket_server PRIVATE
    ${DOMAIN_INCLUDE_DIR}
    ${SQLITE_INCLUDE_DIR}
    ${CROW_INCLUDE_DIR}
    ${ASIO_INCLUDE_DIR}
    ${NLOHMANN_INCLUDE_DIR}
)

# Unit Testing Subdirectory
enable_testing()
add_subdirectory(tests)
