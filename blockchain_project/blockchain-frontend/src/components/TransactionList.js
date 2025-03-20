import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TransactionFlow from './TransactionFlow';

const TransactionList = ({ blockId }) => {
    const [transactions, setTransactions] = useState([]);
    const [blockDetails, setBlockDetails] = useState(null);
    const [filter, setFilter] = useState('');
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('id');
    const [order, setOrder] = useState('asc');

    useEffect(() => {
        const fetchBlockDetails = async () => {
            const response = await axios.get(`http://localhost:8000/api/blocks/${blockId}/`);
            setTransactions(response.data.transactions);
            setBlockDetails(response.data);
        };
        fetchBlockDetails();
    }, [blockId]);

    useEffect(() => {
        const fetchTransactions = async () => {
            const response = await axios.get(`http://localhost:8000/api/transactions/?page=${page}&sort_by=${sortBy}&order=${order}`);
            setTransactions(response.data.results);
            setTotalPages(response.data.total_pages);
        };
        fetchTransactions();
    }, [page, sortBy, order]);

    const fetchFilteredTransactions = async () => {
        const response = await axios.get(`http://localhost:8000/api/transactions/`, {
            params: {
                sender: filter,
                min_amount: minAmount,
                max_amount: maxAmount,
                start_date: startDate,
                end_date: endDate,
            },
        });
        setTransactions(response.data.results);
    };

    const exportTransactions = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + transactions.map(tx => `${tx.sender},${tx.recipient},${tx.amount}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div>
            {blockDetails && (
                <div className="mb-4">
                    <h3 className="text-xl font-semibold">Block Details</h3>
                    <p>Index: {blockDetails.index}</p>
                    <p>Timestamp: {new Date(blockDetails.timestamp).toLocaleString()}</p>
                    <p>Hash: {blockDetails.hash}</p>
                    <p>Previous Hash: {blockDetails.previous_hash}</p>
                </div>
            )}
            <h3 className="text-xl font-semibold">Transactions</h3>
            <input
                type="text"
                placeholder="Filter by sender..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border p-2 mb-4"
            />
            <input
                type="number"
                placeholder="Min Amount"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="border p-2 mb-4"
            />
            <input
                type="number"
                placeholder="Max Amount"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="border p-2 mb-4"
            />
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border p-2 mb-4"
            />
            <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border p-2 mb-4"
            />
            <button onClick={fetchFilteredTransactions} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
                Filter Transactions
            </button>
            <button onClick={exportTransactions} className="bg-green-500 text-white px-4 py-2 rounded mb-4">
                Export Transactions
            </button>
            <div className="mb-4">
                <label>Sort By:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border p-2 ml-2">
                    <option value="id">ID</option>
                    <option value="amount">Amount</option>
                    <option value="timestamp">Timestamp</option>
                </select>
                <label className="ml-4">Order:</label>
                <select value={order} onChange={(e) => setOrder(e.target.value)} className="border p-2 ml-2">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
            </div>
            <ul>
                {transactions.map(tx => (
                    <li key={tx.id} className="border-b py-2">
                        <p>From: {tx.sender}</p>
                        <p>To: {tx.recipient}</p>
                        <p>Amount: {tx.amount}</p>
                    </li>
                ))}
            </ul>
            <TransactionFlow transactions={transactions} />
            <div className="flex justify-between mt-4">
                <button 
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button 
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default TransactionList;
