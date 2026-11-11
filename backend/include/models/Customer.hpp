#pragma once
#include "models/Person.hpp"

/**
 * @brief Customer class inheriting virtually from Person.
 * Demonstrates:
 *  - Right branch of the diamond inheritance hierarchy
 *  - Virtual base class specification
 */
class Customer : virtual public Person {
protected:
    int loyaltyPoints;

public:
    explicit Customer(const std::string& n, int points = 0)
        : Person(n), loyaltyPoints(points) {}

    int getLoyaltyPoints() const {
        return loyaltyPoints;
    }

    void addLoyaltyPoints(int pts) {
        loyaltyPoints += pts;
    }

    void display() const override {
        std::cout << "Customer Name: " << name << " | Loyalty Points: " << loyaltyPoints << "\n";
    }
};
