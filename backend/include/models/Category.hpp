#pragma once
#include <string>

struct Category {
    int id = 0;
    std::string name;
    std::string createdAt;

    Category() = default;
    Category(int id, const std::string& name, const std::string& createdAt = "")
        : id(id), name(name), createdAt(createdAt) {}
};
