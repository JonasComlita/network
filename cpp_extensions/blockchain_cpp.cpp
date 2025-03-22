#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <openssl/evp.h>
#include <thread>
#include <mutex>
#include <atomic>
#include <algorithm>
#include <numeric>

namespace py = pybind11;

// Base58 character set
static const char *BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Convert bytes to hexadecimal string
std::string bytes_to_hex(const std::vector<unsigned char> &data)
{
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (const auto &byte : data)
    {
        ss << std::setw(2) << static_cast<int>(byte);
    }
    return ss.str();
}

// Convert hexadecimal string to bytes
std::vector<unsigned char> hex_to_bytes(const std::string &hex)
{
    std::vector<unsigned char> bytes;
    for (size_t i = 0; i < hex.length(); i += 2)
    {
        std::string byteString = hex.substr(i, 2);
        unsigned char byte = static_cast<unsigned char>(std::strtol(byteString.c_str(), nullptr, 16));
        bytes.push_back(byte);
    }
    return bytes;
}

// SHA-256 implementation using OpenSSL
std::vector<unsigned char> sha256_bytes(const std::vector<unsigned char> &input)
{
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    const EVP_MD *md = EVP_sha256();
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_length;

    EVP_DigestInit_ex(mdctx, md, nullptr);
    EVP_DigestUpdate(mdctx, input.data(), input.size());
    EVP_DigestFinal_ex(mdctx, hash, &hash_length);
    EVP_MD_CTX_free(mdctx);

    return std::vector<unsigned char>(hash, hash + hash_length);
}

// Double SHA-256 hash
std::vector<unsigned char> double_sha256(const std::vector<unsigned char> &input)
{
    std::vector<unsigned char> first_hash = sha256_bytes(input);
    return sha256_bytes(first_hash);
}

// SHA-256 hash of a string, returned as string
std::string sha256(const std::string &input)
{
    std::vector<unsigned char> input_bytes(input.begin(), input.end());
    std::vector<unsigned char> hash_bytes = sha256_bytes(input_bytes);
    return bytes_to_hex(hash_bytes);
}

// RIPEMD-160 implementation using OpenSSL
std::vector<unsigned char> ripemd160_bytes(const std::vector<unsigned char> &input)
{
    EVP_MD_CTX *mdctx = EVP_MD_CTX_new();
    const EVP_MD *md = EVP_ripemd160();
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hash_length;

    EVP_DigestInit_ex(mdctx, md, nullptr);
    EVP_DigestUpdate(mdctx, input.data(), input.size());
    EVP_DigestFinal_ex(mdctx, hash, &hash_length);
    EVP_MD_CTX_free(mdctx);

    return std::vector<unsigned char>(hash, hash + hash_length);
}

// RIPEMD-160 hash of a string, returned as string
std::string ripemd160(const std::string &input)
{
    std::vector<unsigned char> input_bytes(input.begin(), input.end());
    std::vector<unsigned char> hash_bytes = ripemd160_bytes(input_bytes);
    return bytes_to_hex(hash_bytes);
}

// Base58 encode a byte vector
std::string base58_encode(const std::vector<unsigned char> &input)
{
    // Count leading zeros
    size_t zeros = 0;
    while (zeros < input.size() && input[zeros] == 0)
    {
        zeros++;
    }

    // Allocate enough space for the result
    std::vector<unsigned char> result((input.size() - zeros) * 138 / 100 + 1);
    size_t result_size = 0;

    // Convert from base256 to base58
    for (size_t i = zeros; i < input.size(); i++)
    {
        int carry = input[i];
        size_t j = 0;
        for (size_t k = result_size; j < k || carry != 0; j++)
        {
            if (j < result_size)
            {
                carry += 256 * result[j];
            }
            result[j] = carry % 58;
            carry /= 58;
        }
        result_size = j;
    }

    // Skip leading zeros in result
    size_t leading_zeros = 0;
    while (leading_zeros < result_size && result[leading_zeros] == 0)
    {
        leading_zeros++;
    }

    // Build the resulting string
    std::string encoded;
    encoded.reserve(zeros + (result_size - leading_zeros));

    // Add leading '1's for each zero byte
    encoded.append(zeros, '1');

    // Add the rest of the encoded characters
    for (size_t i = leading_zeros; i < result_size; i++)
    {
        encoded += BASE58_CHARS[result[result_size - 1 - i + leading_zeros]];
    }

    return encoded;
}

// Base58Check encoding for Bitcoin addresses
std::string base58check_encode(const std::vector<unsigned char> &payload, unsigned char version)
{
    // Prepend version byte
    std::vector<unsigned char> extended_payload;
    extended_payload.push_back(version);
    extended_payload.insert(extended_payload.end(), payload.begin(), payload.end());

    // Calculate checksum (first 4 bytes of double SHA-256)
    std::vector<unsigned char> checksum = double_sha256(extended_payload);
    checksum.resize(4); // Take first 4 bytes

    // Append checksum to extended payload
    extended_payload.insert(extended_payload.end(), checksum.begin(), checksum.end());

    // Base58 encode the result
    return base58_encode(extended_payload);
}

// Enhanced Bitcoin address generation from public key
std::string public_key_to_address(const std::string &public_key, unsigned char version = 0x00)
{
    // Convert hex public key to bytes
    std::vector<unsigned char> public_key_bytes = hex_to_bytes(public_key);

    // 1. SHA-256 hash of the public key
    std::vector<unsigned char> sha256_hash = sha256_bytes(public_key_bytes);

    // 2. RIPEMD-160 hash of the SHA-256 hash
    std::vector<unsigned char> ripemd_hash = ripemd160_bytes(sha256_hash);

    // 3. Base58Check encode with version byte (0x00 for Bitcoin main network)
    return base58check_encode(ripemd_hash, version);
}

// Calculate Merkle root from transaction IDs
std::string calculate_merkle_root(const std::vector<std::string> &tx_ids)
{
    if (tx_ids.empty())
    {
        return std::string(64, '0');
    }

    std::vector<std::string> tree = tx_ids;
    while (tree.size() > 1)
    {
        std::vector<std::string> new_level;
        for (size_t i = 0; i < tree.size(); i += 2)
        {
            std::string left = tree[i];
            std::string right = (i + 1 < tree.size()) ? tree[i + 1] : left;
            std::string combined = left + right;
            new_level.push_back(sha256(combined));
        }
        tree = new_level;
    }
    return tree[0];
}

// Mining function
std::tuple<int, std::string, long> mine_block(const std::string &block_string_base, int difficulty, int max_nonce = INT_MAX)
{
    std::string target(difficulty, '0');

    unsigned int num_threads = std::thread::hardware_concurrency();
    if (num_threads == 0)
        num_threads = 4;

    // Use atomic variables for thread-safe operations
    std::atomic<bool> found_solution(false);
    std::atomic<int> result_nonce(0);
    std::atomic<long> total_hashes(0);
    std::string result_hash;
    std::mutex result_mutex;

    std::vector<std::thread> threads;
    int chunk_size = max_nonce / num_threads;

    for (unsigned int i = 0; i < num_threads; i++)
    {
        int start_nonce = i * chunk_size;
        int end_nonce = (i == num_threads - 1) ? max_nonce : (i + 1) * chunk_size;

        threads.emplace_back([&, start_nonce, end_nonce]()
                             {
            long local_hashes = 0;
            for (int nonce = start_nonce; nonce < end_nonce && !found_solution; nonce++) {
                std::string block_string = block_string_base + std::to_string(nonce);
                std::string hash = sha256(block_string);
                local_hashes++;
                
                if (hash.compare(0, difficulty, target) == 0) {
                    std::lock_guard<std::mutex> lock(result_mutex);
                    if (!found_solution) {
                        found_solution = true;
                        result_nonce.store(nonce);
                        result_hash = hash;
                    }
                    break;
                }
                
                if (local_hashes % 10000 == 0) {
                    total_hashes += local_hashes;
                    local_hashes = 0;
                }
            }
            total_hashes += local_hashes; });
    }

    for (auto &thread : threads)
    {
        thread.join();
    }

    if (found_solution)
    {
        return std::make_tuple(result_nonce.load(), result_hash, total_hashes.load());
    }
    else
    {
        return std::make_tuple(-1, "", total_hashes.load());
    }
}

// Python module definition
PYBIND11_MODULE(blockchain_cpp, m)
{
    m.doc() = "C++ acceleration library for blockchain operations with enhanced address encoding";

    m.def("sha256", &sha256, "Calculate SHA-256 hash of input string");
    m.def("ripemd160", &ripemd160, "Calculate RIPEMD-160 hash of input string");
    m.def("calculate_merkle_root", &calculate_merkle_root, "Calculate Merkle root from transaction IDs");
    m.def("mine_block", &mine_block, "Mine a block with the given difficulty",
          py::arg("block_string_base"), py::arg("difficulty"), py::arg("max_nonce") = INT_MAX);
    m.def("public_key_to_address", &public_key_to_address, "Convert public key to blockchain address with Base58Check encoding",
          py::arg("public_key"), py::arg("version") = 0x00);
    m.def("base58_encode", [](const std::string &input)
          {
        std::vector<unsigned char> bytes(input.begin(), input.end());
        return base58_encode(bytes); }, "Encode data as Base58 string");
    m.def("base58check_encode", [](const std::string &payload, unsigned char version)
          {
        std::vector<unsigned char> bytes(payload.begin(), payload.end());
        return base58check_encode(bytes, version); }, "Encode data with Base58Check encoding", py::arg("payload"), py::arg("version") = 0x00);
}