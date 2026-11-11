#pragma once
#include <string>
#include <iostream>

/**
 * @brief Common base class for individuals involved in supermarket operations.
 * Demonstrates:
 *  - Common Base Class in Virtual Inheritance
 *  - Virtual Destructor for safe polymorphic cleanup
 */
class Person {
protected:
    std::string name;

public:
    explicit Person(const std::string& n) : name(n) {}
    virtual ~Person() = default;

    std::string getName() const {
        return name;
    }

    virtual void display() const {
        std::cout << "Person: " << name << "\n";
    }
};
