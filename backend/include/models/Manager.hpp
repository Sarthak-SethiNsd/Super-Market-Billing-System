#pragma once
#include "models/Employee.hpp"
#include "models/Customer.hpp"

/**
 * @brief Manager class demonstrating multiple and virtual inheritance.
 * Resolves the classic "Diamond Problem":
 *
 *              Person (virtual base)
 *             /      \
 *     Employee        Customer
 *             \      /
 *             Manager
 *
 * Without virtual inheritance, Manager would inherit two independent copies
 * of 'Person', leading to ambiguity when accessing 'name'.
 * With virtual inheritance, 'Manager' has exactly ONE shared 'Person' subobject.
 */
class Manager : public Employee, public Customer {
private:
    std::string department;

public:
    explicit Manager(const std::string& n,
                     const std::string& empId = "MGR-001",
                     int points = 500,
                     const std::string& dept = "Operations")
        : Person(n), Employee(n, empId), Customer(n, points), department(dept) {}

    std::string getDepartment() const {
        return department;
    }

    void display() const override {
        std::cout << "Manager Name: " << name
                  << " | Emp ID: " << employeeId
                  << " | Loyalty Points: " << loyaltyPoints
                  << " | Department: " << department << "\n";
    }
};
