import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ExternalData = () => {
    const [externalData, setExternalData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get('http://localhost:8000/api/external-data/');
            setExternalData(response.data);
        };
        fetchData();
    }, []);

    return (
        <div>
            <h2>External Data Insights</h2>
            <ul>
                {externalData.map((data) => (
                    <li key={data.id}>{data.info}</li>
                ))}
            </ul>
        </div>
    );
};

export default ExternalData;
