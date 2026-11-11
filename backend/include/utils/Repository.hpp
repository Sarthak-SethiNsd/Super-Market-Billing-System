#pragma once
#include <vector>
#include <optional>
#include <functional>
#include <algorithm>
#include <stdexcept>

/**
 * @brief Generic in-memory Repository template.
 * Demonstrates:
 *  - C++ Template Metaprogramming (Class Templates)
 *  - Generic Programming with Type Independence
 *  - Standard Library algorithm integration (std::find_if, std::copy_if)
 *
 * @tparam T The domain entity type managed by this repository.
 */
template <typename T>
class Repository {
private:
    std::vector<T> storage;

public:
    Repository() = default;

    /**
     * @brief Adds a new entity to the repository.
     */
    void add(const T& item) {
        storage.push_back(item);
    }

    /**
     * @brief Adds an entity using move semantics.
     */
    void add(T&& item) {
        storage.push_back(std::move(item));
    }

    /**
     * @brief Retrieves all entities in the repository.
     */
    std::vector<T> getAll() const {
        return storage;
    }

    /**
     * @brief Returns the total number of entities stored.
     */
    size_t count() const {
        return storage.size();
    }

    /**
     * @brief Clears all entities from storage.
     */
    void clear() {
        storage.clear();
    }

    /**
     * @brief Checks if storage is empty.
     */
    bool isEmpty() const {
        return storage.empty();
    }

    /**
     * @brief Finds the first entity satisfying a predicate function.
     */
    std::optional<T> find(std::function<bool(const T&)> predicate) const {
        auto it = std::find_if(storage.begin(), storage.end(), predicate);
        if (it != storage.end()) {
            return *it;
        }
        return std::nullopt;
    }

    /**
     * @brief Filters all entities satisfying a predicate function.
     */
    std::vector<T> filter(std::function<bool(const T&)> predicate) const {
        std::vector<T> results;
        std::copy_if(storage.begin(), storage.end(), std::back_inserter(results), predicate);
        return results;
    }

    /**
     * @brief Removes the first entity matching the predicate.
     * @return true if an item was removed, false otherwise.
     */
    bool remove(std::function<bool(const T&)> predicate) {
        auto it = std::find_if(storage.begin(), storage.end(), predicate);
        if (it != storage.end()) {
            storage.erase(it);
            return true;
        }
        return false;
    }

    /**
     * @brief Updates the first entity matching the predicate with a new value.
     * @return true if an item was updated, false otherwise.
     */
    bool update(std::function<bool(const T&)> predicate, const T& updatedItem) {
        auto it = std::find_if(storage.begin(), storage.end(), predicate);
        if (it != storage.end()) {
            *it = updatedItem;
            return true;
        }
        return false;
    }
};
