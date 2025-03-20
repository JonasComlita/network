import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SentimentData = () => {
    const [sentiment, setSentiment] = useState([]);

    useEffect(() => {
        const fetchSentimentData = async () => {
            const response = await axios.get('http://localhost:8000/api/sentiment/');
            setSentiment(response.data);
        };
        fetchSentimentData();
    }, []);

    return (
        <div>
            <h2>Sentiment Analysis</h2>
            <ul>
                {sentiment.map((item, index) => (
                    <li key={index}>
                        {item.sentiment}: {item.score}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SentimentData;
