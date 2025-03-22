import React from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'react-flow-renderer';

const TransactionFlow = ({ transactions }) => {
    const elements = transactions.map((tx, index) => ({
        id: tx.id.toString(),
        data: { label: `From: ${tx.sender}\nTo: ${tx.recipient}\nAmount: ${tx.amount}` },
        position: { x: index * 150, y: 0 },
    }));

    return (
        <div style={{ height: 300 }}>
            <ReactFlow elements={elements}>
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
};

export default TransactionFlow;
