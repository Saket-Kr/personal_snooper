import './ConsumerGroups.css';

export function ConsumerGroups() {
    const consumerGroups = [
        {
            groupId: 'desktop-activity-tracker',
            state: 'Stable',
            members: 1,
            topics: ['user-activity-events'],
            lag: 0,
            lastCommit: '2024-01-15T10:30:00Z'
        }
    ];

    return (
        <div className="consumer-groups">
            <div className="groups-header">
                <h3>👥 Consumer Groups</h3>
                <p>Monitor and manage Kafka consumer groups</p>
            </div>

            <div className="groups-list">
                {consumerGroups.map((group) => (
                    <div key={group.groupId} className="group-card">
                        <div className="group-header">
                            <h4>{group.groupId}</h4>
                            <span className={`group-state ${group.state.toLowerCase()}`}>
                                {group.state}
                            </span>
                        </div>
                        <div className="group-details">
                            <div className="detail-item">
                                <span className="detail-label">Members:</span>
                                <span className="detail-value">{group.members}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Topics:</span>
                                <span className="detail-value">{group.topics.join(', ')}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Lag:</span>
                                <span className="detail-value">{group.lag}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Last Commit:</span>
                                <span className="detail-value">
                                    {new Date(group.lastCommit).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="group-actions">
                            <button className="action-button">📊 View Details</button>
                            <button className="action-button">🔄 Reset Offset</button>
                            <button className="action-button">⚙️ Configure</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="groups-footer">
                <p>Consumer group management features coming soon! This will include offset management, group rebalancing, and detailed monitoring.</p>
            </div>
        </div>
    );
}
