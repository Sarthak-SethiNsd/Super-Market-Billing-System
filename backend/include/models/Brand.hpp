#pragma once
#include <string>

struct Brand {
    int id = 0;
    std::string name;
    std::string createdAt;

    Brand() = default;
    Brand(int id, const std::string& name, const std::string& createdAt = "")
        : id(id), name(name), createdAt(createdAt) {}
};
