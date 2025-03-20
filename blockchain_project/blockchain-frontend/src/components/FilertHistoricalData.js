import React, { useState } from 'react';
import axios from 'axios';

const FilterHistoricalData = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [data, setData] = useState([]);

    const handleFilter = async () => {
        const response = await axios.get('http://localhost:8000/api/historical-data/', {
            params: { start_date: startDate, end_date: endDate, min_price: minPrice, max_price: maxPrice }
        });
        setData(response.data);
    };

    return (
        <div>
            <input type="date" onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" onChange={(e) => setEndDate(e.target.value)} />
            <input type="number" placeholder="Min Price" onChange={(e) => setMinPrice(e.target.value)} />
            <input type="number" placeholder="Max Price" onChange={(e) => setMaxPrice(e.target.value)} />
            <button onClick={handleFilter}>Filter</button>
            {/* Render filtered data */}
        </div>
    );
};

export default FilterHistoricalData;
