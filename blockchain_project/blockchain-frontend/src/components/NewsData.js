import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewsData = () => {
    const [news, setNews] = useState([]);

    useEffect(() => {
        const fetchNewsData = async () => {
            const response = await axios.get('http://localhost:8000/api/news/');
            setNews(response.data.articles);
        };
        fetchNewsData();
    }, []);

    return (
        <div>
            <h2>Latest News</h2>
            <ul>
                {news.map(article => (
                    <li key={article.title}>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NewsData;
