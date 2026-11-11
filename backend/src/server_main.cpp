#include "server/AppServer.hpp"
#include <iostream>

int main(int argc, char* argv[]) {
    try {
        ServerConfig config = ServerConfig::loadFromEnvironment();

        if (argc > 1) {
            try {
                config.port = std::stoi(argv[1]);
            } catch (...) {}
        }

        AppServer server(config);
        server.run();
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "[FATAL SERVER ERROR] " << e.what() << "\n";
        return 1;
    }
}
