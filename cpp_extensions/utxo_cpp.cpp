// utxo_cpp.cpp - Enhanced with serialization/deserialization for persistence
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <unordered_map>
#include <string>
#include <vector>
#include <tuple>
#include <sstream>
#include <iostream>
#include <optional>
#include <memory>

namespace py = pybind11;

// Structure to store serialized UTXO data
struct SerializedUTXO
{
    std::string tx_id;
    size_t output_index;
    std::string serialized_output;
};

// Structure to represent a transaction output with essential fields
// This is used for internal serialization within C++
struct TransactionOutput
{
    std::string recipient;
    double amount;
    std::string script;

    // Serialize to string
    std::string serialize() const
    {
        std::stringstream ss;
        ss << recipient << "|" << amount << "|" << script;
        return ss.str();
    }

    // Deserialize from string
    static std::optional<TransactionOutput> deserialize(const std::string &data)
    {
        std::stringstream ss(data);
        std::string recipient, script;
        double amount;

        std::getline(ss, recipient, '|');
        if (ss.fail())
            return std::nullopt;

        ss >> amount;
        if (ss.fail())
            return std::nullopt;

        ss.ignore(); // Skip delimiter
        std::getline(ss, script);
        if (ss.fail())
            return std::nullopt;

        return TransactionOutput{recipient, amount, script};
    }
};

// Efficient UTXO set implementation in C++ with serialization support
class UTXOSetCpp
{
private:
    std::unordered_map<std::string, std::vector<py::object>> utxos;
    std::unordered_map<std::string, std::unordered_set<uint64_t>> used_nonces;

    // Helper functions for serialization and deserialization
    py::object create_output_from_serialized(const std::string &serialized_data)
    {
        auto output_opt = TransactionOutput::deserialize(serialized_data);
        if (!output_opt)
        {
            return py::none();
        }

        // Create Python TransactionOutput object
        py::object transaction_output_class = py::module::import("utils").attr("TransactionOutput");
        return transaction_output_class(output_opt->recipient, output_opt->amount, output_opt->script);
    }

    std::string serialize_output(py::object output)
    {
        if (output.is_none())
        {
            return "";
        }

        // Extract fields from Python TransactionOutput
        std::string recipient = py::cast<std::string>(output.attr("recipient"));
        double amount = py::cast<double>(output.attr("amount"));
        std::string script = py::cast<std::string>(output.attr("script"));

        // Create and serialize a C++ TransactionOutput
        TransactionOutput tx_output{recipient, amount, script};
        return tx_output.serialize();
    }

public:
    UTXOSetCpp() {}

    bool add_utxo(const std::string &tx_id, size_t output_index, py::object output)
    {
        if (utxos.find(tx_id) == utxos.end())
        {
            utxos[tx_id] = std::vector<py::object>();
        }

        // Resize vector if needed
        if (utxos[tx_id].size() <= output_index)
        {
            utxos[tx_id].resize(output_index + 1, py::none());
        }

        utxos[tx_id][output_index] = output;
        return true;
    }

    py::object get_utxo(const std::string &tx_id, size_t output_index)
    {
        if (utxos.find(tx_id) == utxos.end() || utxos[tx_id].size() <= output_index)
        {
            return py::none();
        }
        return utxos[tx_id][output_index];
    }

    bool spend_utxo(const std::string &tx_id, size_t output_index)
    {
        if (utxos.find(tx_id) == utxos.end() || utxos[tx_id].size() <= output_index)
        {
            return false;
        }

        utxos[tx_id][output_index] = py::none();
        return true;
    }

    bool is_nonce_used(const std::string &address, uint64_t nonce)
    {
        return used_nonces.find(address) != used_nonces.end() &&
               used_nonces[address].find(nonce) != used_nonces[address].end();
    }

    void add_nonce(const std::string &address, uint64_t nonce)
    {
        used_nonces[address].insert(nonce);
    }

    size_t utxo_count() const
    {
        size_t count = 0;
        for (const auto &entry : utxos)
        {
            for (const auto &output : entry.second)
            {
                if (!output.is_none())
                {
                    count++;
                }
            }
        }
        return count;
    }

    py::list get_utxos_for_address(const std::string &address)
    {
        py::list result;
        for (const auto &entry : utxos)
        {
            for (size_t i = 0; i < entry.second.size(); i++)
            {
                if (!entry.second[i].is_none())
                {
                    py::object output = entry.second[i];
                    py::object recipient = output.attr("recipient");

                    if (py::cast<std::string>(recipient) == address)
                    {
                        result.append(py::make_tuple(entry.first, i, output));
                    }
                }
            }
        }
        return result;
    }

    // New methods for serialization and deserialization

    // Serialize the entire UTXO set for database storage
    py::list serialize_utxo_set()
    {
        py::list serialized_utxos;

        for (const auto &[tx_id, outputs] : utxos)
        {
            for (size_t i = 0; i < outputs.size(); i++)
            {
                if (!outputs[i].is_none())
                {
                    // Serialize the output
                    std::string serialized_output = serialize_output(outputs[i]);
                    if (!serialized_output.empty())
                    {
                        // Create a tuple for database storage
                        serialized_utxos.append(py::make_tuple(tx_id, i, serialized_output));
                    }
                }
            }
        }

        return serialized_utxos;
    }

    // Deserialize and restore UTXO set from database data
    void deserialize_utxo_set(py::list serialized_data)
    {
        // Clear existing data
        utxos.clear();

        // Process each serialized UTXO entry
        for (auto item : serialized_data)
        {
            try
            {
                py::tuple entry = py::cast<py::tuple>(item);
                if (entry.size() != 3)
                    continue;

                std::string tx_id = py::cast<std::string>(entry[0]);
                size_t output_index = py::cast<size_t>(entry[1]);
                std::string serialized_output = py::cast<std::string>(entry[2]);

                // Deserialize the output
                py::object output = create_output_from_serialized(serialized_output);
                if (!output.is_none())
                {
                    add_utxo(tx_id, output_index, output);
                }
            }
            catch (const py::error_already_set &e)
            {
                py::print("Error deserializing UTXO:", e.what());
                continue;
            }
        }
    }

    // Serialize nonce data
    py::list serialize_nonces()
    {
        py::list serialized_nonces;

        for (const auto &[address, nonces] : used_nonces)
        {
            for (uint64_t nonce : nonces)
            {
                serialized_nonces.append(py::make_tuple(address, nonce));
            }
        }

        return serialized_nonces;
    }

    // Deserialize nonce data
    void deserialize_nonces(py::list serialized_data)
    {
        // Clear existing nonces
        used_nonces.clear();

        // Process each serialized nonce entry
        for (auto item : serialized_data)
        {
            try
            {
                py::tuple entry = py::cast<py::tuple>(item);
                if (entry.size() != 2)
                    continue;

                std::string address = py::cast<std::string>(entry[0]);
                uint64_t nonce = py::cast<uint64_t>(entry[1]);

                add_nonce(address, nonce);
            }
            catch (const py::error_already_set &e)
            {
                py::print("Error deserializing nonce:", e.what());
                continue;
            }
        }
    }

    // Batch add UTXOs (for efficient loading from database)
    void batch_add_utxos(py::list utxo_entries)
    {
        for (auto item : utxo_entries)
        {
            try
            {
                py::tuple entry = py::cast<py::tuple>(item);
                if (entry.size() != 3)
                    continue;

                std::string tx_id = py::cast<std::string>(entry[0]);
                size_t output_index = py::cast<size_t>(entry[1]);
                py::object output = entry[2];

                add_utxo(tx_id, output_index, output);
            }
            catch (const py::error_already_set &e)
            {
                py::print("Error in batch_add_utxos:", e.what());
                continue;
            }
        }
    }

    // Batch add nonces (for efficient loading from database)
    void batch_add_nonces(py::list nonce_entries)
    {
        for (auto item : nonce_entries)
        {
            try
            {
                py::tuple entry = py::cast<py::tuple>(item);
                if (entry.size() != 2)
                    continue;

                std::string address = py::cast<std::string>(entry[0]);
                uint64_t nonce = py::cast<uint64_t>(entry[1]);

                add_nonce(address, nonce);
            }
            catch (const py::error_already_set &e)
            {
                py::print("Error in batch_add_nonces:", e.what());
                continue;
            }
        }
    }

    // Get serialized batch of UTXOs - with pagination support
    py::list get_serialized_utxo_batch(size_t offset, size_t limit)
    {
        py::list batch;
        size_t current = 0;
        size_t count = 0;

        for (const auto &[tx_id, outputs] : utxos)
        {
            for (size_t i = 0; i < outputs.size(); i++)
            {
                if (!outputs[i].is_none())
                {
                    if (current >= offset)
                    {
                        std::string serialized_output = serialize_output(outputs[i]);
                        batch.append(py::make_tuple(tx_id, i, serialized_output));
                        count++;

                        if (count >= limit)
                        {
                            return batch;
                        }
                    }
                    current++;
                }
            }
        }

        return batch;
    }

    // Clear all data
    void clear()
    {
        utxos.clear();
        used_nonces.clear();
    }
};

PYBIND11_MODULE(utxo_cpp, m)
{
    m.doc() = "C++ implementation of UTXO set with persistence support";

    py::class_<UTXOSetCpp>(m, "UTXOSetCpp")
        .def(py::init<>())
        .def("add_utxo", &UTXOSetCpp::add_utxo)
        .def("get_utxo", &UTXOSetCpp::get_utxo)
        .def("spend_utxo", &UTXOSetCpp::spend_utxo)
        .def("is_nonce_used", &UTXOSetCpp::is_nonce_used)
        .def("add_nonce", &UTXOSetCpp::add_nonce)
        .def("utxo_count", &UTXOSetCpp::utxo_count)
        .def("get_utxos_for_address", &UTXOSetCpp::get_utxos_for_address)
        // New persistence methods
        .def("serialize_utxo_set", &UTXOSetCpp::serialize_utxo_set)
        .def("deserialize_utxo_set", &UTXOSetCpp::deserialize_utxo_set)
        .def("serialize_nonces", &UTXOSetCpp::serialize_nonces)
        .def("deserialize_nonces", &UTXOSetCpp::deserialize_nonces)
        .def("batch_add_utxos", &UTXOSetCpp::batch_add_utxos)
        .def("batch_add_nonces", &UTXOSetCpp::batch_add_nonces)
        .def("get_serialized_utxo_batch", &UTXOSetCpp::get_serialized_utxo_batch)
        .def("clear", &UTXOSetCpp::clear);
}