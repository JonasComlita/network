import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PriceData = () => {
    const [price, setPrice] = useState(null);

    useEffect(() => {
        const fetchPriceData = async () => {
            const response = await axios.get('http://localhost:8000/api/price/');
            setPrice(response.data.bitcoin.usd);
        };
        fetchPriceData();
    }, []);

    return (
        <div>
            <h2>Current Bitcoin Price</h2>
            {price ? <p>${price}</p> : <p>Loading...</p>}
        </div>
    );
};

export default PriceData;
