#pragma once
#include "models/Person.hpp"

/**
 * @brief Employee class inheriting virtually from Person.
 * Demonstrates:
 *  - Left branch of the diamond inheritance hierarchy
 *  - Virtual base class specification
 */
class Employee : virtual public Person {
protected:
    std::string employeeId;

public:
    explicit Employee(const std::string& n, const std::string& empId = "EMP-001")
        : Person(n), employeeId(empId) {}

    std::string getEmployeeId() const {
        return employeeId;
    }

    void display() const override {
        std::cout << "Employee [ID: " << employeeId << "] Name: " << name << "\n";
    }
};
